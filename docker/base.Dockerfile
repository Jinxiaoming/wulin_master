# Canonical base image for wulin_master-generated apps — the single source of truth for the
# Ruby + Node + build-toolchain layer shared by every generated project.
#
# Published by CI (.gitlab-ci.yml → build:base) to:
#   gitlab.ekohe.com:5050/ekohe/wulin/wulin_master/base:ruby-${RUBY_VERSION}-node-${NODE_MAJOR}
#
# Generated apps FROM this image (see wulin_master_template.rb → generated Dockerfile). This file
# ships into every generated app via the submodule, so a local / offline build (no registry
# access) needs no duplicated definition:
#   docker build -f vendor/gems/wulin_master/docker/base.Dockerfile \
#     --build-arg RUBY_VERSION=3.3.4 -t wulin-base:local .
#   docker compose build --build-arg BASE_IMAGE=wulin-base:local
#
# NB: no `# syntax=docker/dockerfile:1` line — this must stay legacy-builder compatible
# (DOCKER_BUILDKIT=0), matching the runtime build plane.
ARG RUBY_VERSION=3.3.4

FROM ruby:${RUBY_VERSION}-slim
WORKDIR /rails

# Match Gemfile.lock "BUNDLED WITH" — override at build: --build-arg BUNDLER_VERSION=x.y.z
ARG BUNDLER_VERSION=2.7.2
RUN gem install bundler -v "${BUNDLER_VERSION}"

ARG NODE_MAJOR=20
# Two `apt-get update`s are required, not redundant: the second re-indexes after the NodeSource
# repo is added (apt can't see the nodejs package until then). corepack ships with Node 20, so it
# is enabled directly — no separate `npm install -g corepack`.
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      build-essential git libpq-dev curl gnupg2 procps \
      libyaml-dev libvips pkg-config && \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" > /etc/apt/sources.list.d/nodesource.list && \
    apt-get update -qq && \
    apt-get install -y --no-install-recommends nodejs && \
    corepack enable && \
    rm -rf /var/lib/apt/lists/*

# The wulin_master path gem is a git submodule; at runtime it's bind-mounted (`.:/rails`) so its
# files appear owned by a different uid than the container user → git refuses to operate on it
# ("detected dubious ownership"), which breaks the gemspec's git-based file list / version. Trust
# all repo dirs in this single-tenant dev container.
RUN git config --global --add safe.directory '*'
