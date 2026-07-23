# frozen_string_literal: true

# Usage (replace APP_NAME with your app directory name, same as `rails new APP_NAME`):
#   rails new APP_NAME --skip-hotwire --database=postgresql -j esbuild \
#     -m ./wulin_master_template.rb

ruby_ver = begin
  File.read(".ruby-version").strip.sub(/^ruby-/, "")
rescue
  RUBY_VERSION
end

# =============================================================================
# 1. Yarn — use node-modules linker (required for esbuild + workspaces)
# =============================================================================

file ".yarnrc.yml", <<~YAML
  nodeLinker: node-modules
YAML

# =============================================================================
# 2. Wulin Master — add as git submodule
# =============================================================================

# Idempotent + self-healing: a failed scaffold retry re-runs this template over a partial tree.
# Guard on the .gitmodules MAPPING (the `url` key — what submodule ops actually need), NOT the
# submodule's own `.git`. A half-registered submodule has the directory but no mapping; the old
# guard skipped the re-add in that state, then blindly set the `branch` key → a .gitmodules with
# only `branch` (no path/url) → "no submodule mapping found". When the mapping is absent we clean
# any partial checkout + stale index/modules entry and re-add cleanly (`git submodule add` writes
# the full path+url+branch); the branch key is set only once a valid mapping exists.
run <<~'SH'
  if ! git config -f .gitmodules --get submodule.vendor/gems/wulin_master.url >/dev/null 2>&1; then
    git rm -f --cached vendor/gems/wulin_master 2>/dev/null || true
    rm -rf vendor/gems/wulin_master .git/modules/vendor/gems/wulin_master
    git submodule add -b v3 https://github.com/ekohe/wulin_master.git vendor/gems/wulin_master
  fi
  git config -f .gitmodules submodule.vendor/gems/wulin_master.branch v3
SH

# =============================================================================
# 3. Gem Dependencies
# =============================================================================

gem "wulin_master", path: "vendor/gems/wulin_master"
gem "dartsass-rails"
# esbuild is wired up by this template directly (package.json build script + Procfile + the
# app/assets/builds path), so the app is scaffolded with `--skip-javascript` (NOT `-j esbuild`):
# `-j esbuild` runs `yarn build` during `rails new`, which fails in a hardened build sandbox
# (esbuild can't exec) and is redundant — the runtime rebuilds assets via `bin/dev`. jsbundling-rails
# is still declared for the production `assets:precompile` hook.
gem "jsbundling-rails"

# =============================================================================
# 4. JavaScript & CSS
# =============================================================================

file "app/javascript/application.js", <<~JS
  import '../../vendor/gems/wulin_master/app/assets/javascripts/master/master.js'
JS

remove_file "app/assets/stylesheets/application.css"

file "app/assets/stylesheets/application.sass", <<~SASS
  @use "../../../vendor/gems/wulin_master/app/assets/stylesheets/master"
SASS

remove_file "app/views/layouts/application.html.erb"

# =============================================================================
# 5. Package.json — use yarn workspaces to share gem's JS dependencies
# =============================================================================

file "package.json", <<~JSON, force: true
  {
    "name": "#{app_name}",
    "private": true,
    "workspaces": [
      "vendor/gems/wulin_master"
    ],
    "devDependencies": {
      "esbuild": "^0.25.9"
    },
    "scripts": {
      "build": "esbuild app/javascript/application.js --bundle --sourcemap --outdir=app/assets/builds --public-path=/assets --loader:.woff=file --loader:.woff2=file '--external:*.css'",
      "copy-icons": "node script/copy_material_icons.js"
    },
    "dependencies": {
      "rails-ujs": "^5.2.8"
    }
  }
JSON

# =============================================================================
# 6. Fonts & Asset Pipeline
# =============================================================================

# Create fonts directory
run "mkdir -p app/assets/fonts"

# esbuild output dir (normally created by `-j esbuild`; we scaffold with --skip-javascript, so
# create it + keep it tracked). The runtime's `bin/dev` (yarn build:watch) fills it.
run "mkdir -p app/assets/builds"
run "touch app/assets/builds/.keep"

# Add fonts in assets.rb initializer
run "rm -f config/initializers/assets.rb"

initializer "assets.rb", <<~RB
  # Be sure to restart your server when you modify this file.

  # Version of your assets, change this if you want to expire all your assets.
  Rails.application.config.assets.version = "1.0"

  # Add additional assets to the asset load path.
  # Rails.application.config.assets.paths << Emoji.images_path
  Rails.application.config.assets.paths << Rails.root.join("app/assets/fonts")
RB

# Setup script/copy_material_icons.js
file "script/copy_material_icons.js", <<~JS
  const fs = require("fs");
  const path = require("path");

  const srcDir = path.join(__dirname, "..", "node_modules", "material-icons", "iconfont");
  const dstDir = path.join(__dirname, "..", "app", "assets", "fonts");

  fs.mkdirSync(dstDir, { recursive: true });

  for (const name of [
    "material-icons.woff2",
    "material-icons.woff"
  ]) {
    fs.copyFileSync(path.join(srcDir, name), path.join(dstDir, name));
    console.log("Copied " + name);
  }
JS

# =============================================================================
# 7. Procfile & Dartsass Configuration
# =============================================================================

# Setup Procfile.dev
file "Procfile.dev", <<~PROCFILE, force: true
  web: bin/rails server -b 0.0.0.0
  js: yarn build:watch
  css: bin/rails dartsass:watch
PROCFILE

# Setup Wulin Master assets initializer
initializer "wulin_master_assets.rb", <<~RB
  # frozen_string_literal: true

  require 'dartsass-rails'

  # Wulin Master assets configuration for Propshaft
  Rails.application.configure do
    # Add builds directory to asset paths
    config.assets.paths << Rails.root.join("app/assets/builds")

    # Add assets to precompile
    config.assets.precompile += %w[
      *.woff
      *.woff2
    ]

    config.dartsass.builds = {
      "application.sass" => "application.css"
    }

    # Add node_modules to Sass load path for npm packages
    config.dartsass.build_options << "--load-path=node_modules"
    config.dartsass.build_options << "--load-path=app/assets/stylesheets"
    config.dartsass.build_options << "--quiet-deps"
    config.dartsass.build_options << "--silence-deprecation=import,global-builtin,slash-div,color-functions"
  end
RB

# =============================================================================
# 8. Docker Support
# =============================================================================

file ".env.example", <<~ENV
  POSTGRES_USER=postgres
  POSTGRES_PASSWORD=password
  DB_HOST=db
  DB_PORT=5432
ENV

run "cp .env.example .env"

append_to_file ".gitignore", <<~GIT

  # Docker
  volumes/
  /.env
  !/.env.example
GIT

file "config/database.yml", <<~YAML, force: true
  default: &default
    adapter: postgresql
    encoding: unicode
    pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
    host: <%= ENV.fetch("DB_HOST") { "localhost" } %>
    port: <%= ENV.fetch("DB_PORT") { 5432 } %>
    username: <%= ENV.fetch("POSTGRES_USER") { "postgres" } %>
    password: <%= ENV.fetch("POSTGRES_PASSWORD") { "password" } %>

  development:
    <<: *default
    database: #{app_name}_development

  test:
    <<: *default
    database: #{app_name}_test

  production:
    <<: *default
    database: #{app_name}_production
YAML

file ".dockerignore", <<~TEXT, force: true
  .git
  .env
  node_modules
  volumes
  tmp
  log
  public/assets
TEXT

# Dev entrypoint as a COMMITTED file (COPY'd in the Dockerfile). NOT a Dockerfile heredoc:
# `COPY <<HEREDOC` needs BuildKit, but Nexus builds with the legacy builder (DOCKER_BUILDKIT=0,
# required for the socket-proxy), which fails a heredoc COPY with "no source files were specified".
file "bin/docker-entrypoint-dev.sh", <<~SH, force: true
  #!/bin/sh
  set -e
  bundle check > /dev/null 2>&1 || {
    echo "[entrypoint] Gems out of sync — running bundle install..."
    bundle install --jobs "$(nproc)"
  }
  echo "[entrypoint] Checking database..."
  if bin/rails db:version > /dev/null 2>&1; then
    echo "[entrypoint] Database exists — db:migrate (applies pending migrations only; no-op if current)."
    bin/rails db:migrate
  else
    echo "[entrypoint] Database missing or not reachable — db:prepare (create / schema / migrations)."
    bin/rails db:prepare
  fi
  exec "$@"
SH

# The base layer (Ruby + Node + build toolchain + bundler + git safe.directory) is a PREBUILT
# image published by wulin_master CI and shared by EVERY generated app. A cold build (CI / a
# fresh machine with no Docker layer cache) then PULLS it instead of re-running apt + the
# NodeSource install — the slowest part of a from-scratch build. Its definition is the single
# source of truth at vendor/gems/wulin_master/docker/base.Dockerfile (shipped via the submodule),
# so a fully offline / no-registry-access build is always possible with no duplicated definition:
#   docker build -f vendor/gems/wulin_master/docker/base.Dockerfile -t wulin-base:local .
#   docker compose build --build-arg BASE_IMAGE=wulin-base:local
#
# NB: no `# syntax=docker/dockerfile:1` — that opts into the BuildKit frontend, but the build
# runs on the legacy builder (DOCKER_BUILDKIT=0). Keep this Dockerfile legacy-compatible.
file "Dockerfile", <<~DOCKERFILE, force: true
  ARG BASE_IMAGE=gitlab.ekohe.com:5050/ekohe/wulin/wulin_master/base:ruby-#{ruby_ver}-node-20
  FROM ${BASE_IMAGE} AS base

  FROM base AS deps

  # wulin_master is a path gem AND a yarn workspace member. Copy ONLY the files bundler and
  # yarn need to resolve dependencies — the gemspec + the VERSION constant it requires, and the
  # workspace member's package.json. Editing the submodule's actual source (the common dev loop)
  # then does NOT invalidate these expensive install layers; the full tree arrives later via
  # `COPY . .` in the development stage. (A path gem installs in-place — no packaging — so the
  # gemspec's `git ls-files` returning empty here is harmless.)
  COPY Gemfile Gemfile.lock ./
  COPY vendor/gems/wulin_master/wulin_master.gemspec ./vendor/gems/wulin_master/
  COPY vendor/gems/wulin_master/lib/wulin_master/version.rb ./vendor/gems/wulin_master/lib/wulin_master/
  RUN bundle install --jobs "$(nproc)" || { \\
        echo "[deps] bundle install failed — retrying after cache clear..." && \\
        rm -rf /usr/local/bundle/cache/*.gem && \\
        bundle install --jobs "$(nproc)"; \\
      }

  COPY package.json yarn.lock .yarnrc.yml ./
  COPY vendor/gems/wulin_master/package.json ./vendor/gems/wulin_master/
  RUN yarn install || true

  FROM deps AS development
  COPY . .

  # Plain COPY of the committed entrypoint (legacy-builder compatible — see the file "…" above).
  # Copied to /usr/local/bin so the runtime `.:/rails` bind mount never shadows it.
  COPY bin/docker-entrypoint-dev.sh /usr/local/bin/docker-entrypoint-dev.sh
  RUN chmod +x /usr/local/bin/docker-entrypoint-dev.sh
  ENTRYPOINT ["/usr/local/bin/docker-entrypoint-dev.sh"]

  EXPOSE 3000
  CMD ["./bin/dev"]
DOCKERFILE

run "mkdir -p volumes"

file "docker-compose.yml", <<~YAML
  name: #{app_name}
  services:
    db:
      image: postgres:16-alpine
      container_name: #{app_name}_db
      volumes:
        - ./volumes/postgres_data:/var/lib/postgresql/data
      environment:
        POSTGRES_USER: ${POSTGRES_USER:-postgres}
        POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-password}
        POSTGRES_HOST_AUTH_METHOD: trust
        PGDATA: /var/lib/postgresql/data/pgdata
      healthcheck:
        test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER"]
        interval: 5s
        timeout: 5s
        retries: 5

    app:
      build:
        context: .
        target: development
      container_name: #{app_name}_app
      volumes:
        - .:/rails
        # Named volume (NOT a host bind): Docker seeds it from the image's /usr/local/bundle on
        # first mount, so the gems installed at build time are already present → the entrypoint's
        # `bundle check` passes and skips re-install. A host bind starts EMPTY and shadows the image
        # gems, forcing a full `bundle install` (native recompile) at every first boot — doubling the
        # gem cost. node_modules already uses a named volume for the same reason.
        - bundle_cache:/usr/local/bundle
        - node_modules:/rails/node_modules
      ports:
        - "3000:3000"
      env_file:
        - path: .env
          required: false
      environment:
        DB_HOST: db
      depends_on:
        db:
          condition: service_healthy
      healthcheck:
        test: ["CMD-SHELL", "bundle check > /dev/null 2>&1"]
        interval: 10s
        timeout: 5s
        retries: 30
        start_period: 120s

  volumes:
    node_modules:
    bundle_cache:
YAML

# =============================================================================
# 9. After Bundle
# =============================================================================

after_bundle do
  run "corepack enable"
  run "yarn install"

  rails_command "generate wulin_master:install"

  # jsbundling-rails install overwrites our package.json scripts with
  # --format=esm (breaks jQuery/SlickGrid globals) and drops our custom
  # flags.  Rewrite the build scripts with the correct esbuild invocation.
  esbuild_flags = %w[
    app/javascript/application.js
    --bundle
    --sourcemap
    --outdir=app/assets/builds
    --public-path=/assets
    --loader:.woff=file
    --loader:.woff2=file
    '--external:*.css'
  ].join(" ")

  package_json = JSON.parse(File.read("package.json"))
  package_json["scripts"]["build"] = "esbuild #{esbuild_flags}"
  package_json["scripts"]["build:watch"] = "esbuild #{esbuild_flags} --watch=forever"
  File.write("package.json", JSON.pretty_generate(package_json))

  # jsbundling-rails appends a duplicate "js:" line to Procfile.dev; remove it.
  procfile = File.read("Procfile.dev")
  cleaned = procfile.lines.reject { |l| l.strip == "js: yarn build --watch" }.join
  File.write("Procfile.dev", cleaned)

  run "yarn run copy-icons"
  run "bundle exec rake wulin_master:generate_theme_color_css"

  # No asset compilation at scaffold time. The JS bundle + compiled CSS are build artifacts the
  # runtime always rebuilds — `bin/dev` in development (Procfile.dev: `js: yarn build:watch`,
  # `css: bin/rails dartsass:watch`), the jsbundling-rails `assets:precompile` hook in production —
  # so compiling here is redundant, and esbuild's exec-in-/tmp breaks in a hardened build sandbox
  # anyway. app/assets/builds/.keep holds the tracked dir until the first build.

  remove_file "app/assets/stylesheets/application.css"

  say ""
  say "=================================================================", :green
  say "  #{app_name} — Wulin Master application created.", :green
  say "=================================================================", :green
  say ""
  say "  Next steps — Docker (PostgreSQL in Compose):", :yellow
  say "    docker login gitlab.ekohe.com:5050   # once — the base image is pulled from here", :yellow
  say "    docker compose up --build", :yellow
  say "    # On first start the app entrypoint runs db:prepare; after that it runs", :yellow
  say "    # db:migrate when the database already exists (no env vars required).", :yellow
  say "    # No registry access? Build the base image from the submodule instead:", :yellow
  say "    #   docker build -f vendor/gems/wulin_master/docker/base.Dockerfile -t wulin-base:local .", :yellow
  say "    #   docker compose build --build-arg BASE_IMAGE=wulin-base:local", :yellow
  say ""
  say "  Next steps — local machine:", :yellow
  say "    bundle install && yarn install", :yellow
  say "    bin/rails db:prepare", :yellow
  say "    bin/dev", :yellow
  say "=================================================================", :green
end
