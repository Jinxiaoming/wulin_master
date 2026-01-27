# rails new wulin_app --skip-hotwire --database=postgresql -j esbuild -m ./wulin_master_template.rb

# Configure Yarn to use node-modules linker
file ".yarnrc.yml", <<~YAML
  nodeLinker: node-modules
  supportedArchitectures:
    os: [darwin, linux]
    cpu: [arm64, x64]
YAML

run "git submodule add -b v3.0.1a https://github.com/Jinxiaoming/wulin_master.git vendor/gems/wulin_master"
run "git config -f .gitmodules submodule.vendor/gems/wulin_master.branch v3"

gem "wulin_master", path: "vendor/gems/wulin_master"

gem "rexml"
gem "net-smtp"
gem "net-imap"
gem "net-pop"

gem "dartsass-rails"

# Add wulin master javascript to application.js:
file "app/javascript/application.js", <<~JS
  // Import Wulin Master modules
  import '../../vendor/gems/wulin_master/app/assets/javascripts/master/master.js'
JS

# Remove application.css file
remove_file "app/assets/stylesheets/application.css"

# Add wulin master stylesheet to master.sass
# Move master.sass to app/assets/stylesheets to avoid esbuild picking it up
file "app/assets/stylesheets/master.sass", <<~CSS
  @use "../../../vendor/gems/wulin_master/app/assets/stylesheets/master";
CSS

# Setup package.json with all required dependencies
file "package.json", <<~JSON, force: true
  {
    "name": "app",
    "private": true,
    "packageManager": "yarn@4.0.0",
    "devDependencies": {
      "esbuild": "^0.25.9"
    },
    "scripts": {
      "build": "esbuild app/javascript/application.js --bundle --outdir=app/assets/builds",
      "copy-icons": "node script/copy_material_icons.js"
    },
    "dependencies": {
      "rails-ujs": "^5.2.8",
      "materialize-css": "^1.0.0",
      "material-icons": "^0.7.7",
      "flatpickr": "^4.6.13",
      "sortablejs": "^1.15.6",
      "slickgrid": "^5.18.2",
      "inputmask": "^5.0.9",
      "tom-select": "^2.4.3",
      "@hotwired/stimulus": "^3.2.2",
      "@hotwired/turbo-rails": "^8.0.21"
    },
    "optionalDependencies": {
      "@esbuild/linux-arm64": "0.25.9",
      "@esbuild/linux-x64": "0.25.9",
      "@esbuild/darwin-arm64": "0.25.9"
    }
  }
JSON

# Create fonts directory
run "mkdir -p app/assets/fonts"

# Add fonts in assets.rb initializer
run "rm config/initializers/assets.rb"

initializer "assets.rb", <<~RB
  # Be sure to restart your server when you modify this file.

  # Version of your assets, change this if you want to expire all your assets.
  Rails.application.config.assets.version = "1.0"

  # Add additional assets to the asset load path.
  # Rails.application.config.assets.paths << Emoji.images_path
  Rails.application.config.assets.paths << Rails.root.join("app/assets/fonts")
RB

# Setup script/copy_material_icons.js (uses require.resolve for better compatibility)
file "script/copy_material_icons.js", <<~JS
  const fs = require("fs");
  const path = require("path");

  try {
    // Use require.resolve to locate material-icons package path
    const iconPkgPath = require.resolve("material-icons/package.json");
    const srcDir = path.join(path.dirname(iconPkgPath), "iconfont");
    const dstDir = path.join(__dirname, "..", "app", "assets", "fonts");

    fs.mkdirSync(dstDir, { recursive: true });

    for (const name of ["material-icons.woff2", "material-icons.woff"]) {
      const srcFile = path.join(srcDir, name);
      if (fs.existsSync(srcFile)) {
        fs.copyFileSync(srcFile, path.join(dstDir, name));
        console.log(`Copied ${name}`);
      } else {
        console.warn(`Warning: ${name} not found at ${srcFile}`);
      }
    }
  } catch (e) {
    console.error("Error copying icons:", e.message);
    process.exit(1);
  }
JS

# Setup Procfile.dev
file "Procfile.dev", <<~PROCFILE
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
    
    Rails.application.config.dartsass.builds = {
      "master.sass"  => "application.css"
    }
    
    # Add node_modules to Sass load path for npm packages
    Rails.application.config.dartsass.build_options << "--load-path=node_modules"
  end
RB

# --- Docker & Environment Setup ---

# Create .env.example
file ".env.example", <<~ENV
  # Database configuration
  POSTGRES_USER=postgres
  POSTGRES_PASSWORD=password
  DATABASE_URL=postgresql://postgres:password@db:5432/postgres

  # Redis configuration
  REDIS_URL=redis://redis:6379/1

  # Rails configuration
  RAILS_ENV=development
  SECRET_KEY_BASE=#{SecureRandom.hex(64)}
ENV

# Create .env (local development, ignored by git)
run "cp .env.example .env"
append_to_file ".gitignore", ".env\n"

# Create .dockerignore
file ".dockerignore", <<~TEXT, force: true
  .git
  .env
  node_modules
  tmp
  log
  storage
  public/assets
TEXT

# Create Dockerfile
file "Dockerfile", <<~DOCKERFILE, force: true
  # syntax=docker/dockerfile:1
  ARG RUBY_VERSION=3.3.0
  FROM ruby:$RUBY_VERSION-slim as base

  WORKDIR /rails

  # Install system dependencies
  RUN apt-get update -qq && \
      apt-get install --no-install-recommends -y \
      build-essential \
      git \
      libpq-dev \
      curl \
      gnupg2 \
      procps

  # Install Node.js and Yarn
  RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
      apt-get install -y nodejs && \
      corepack enable

  # Install Gem dependencies
  COPY Gemfile Gemfile.lock ./
  COPY vendor/gems/wulin_master ./vendor/gems/wulin_master
  RUN bundle install

  # Install JS dependencies
  COPY package.json yarn.lock .yarnrc.yml ./
  RUN corepack enable && yarn install

  # Copy project files
  COPY . .

  EXPOSE 3000

  CMD ["./bin/dev"]
DOCKERFILE

# Create docker-compose.yml
file "docker-compose.yml", <<~YAML
  services:
    db:
      container_name: wulin_postgres
      image: postgres:16-alpine
      volumes:
        - postgres_data:/var/lib/postgresql/data
      env_file:
        - .env
      healthcheck:
        test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER"]
        interval: 5s
        timeout: 5s
        retries: 5

    redis:
      container_name: wulin_redis
      image: redis:7-alpine
      volumes:
        - redis_data:/var/lib/redis/data

    app:
      container_name: wulin_app
      build: .
      command: ./bin/dev
      volumes:
        - .:/rails
        - /rails/node_modules
      ports:
        - "3000:3000"
      env_file:
        - .env
      depends_on:
        db:
          condition: service_healthy
        redis:
          condition: service_started

  volumes:
    postgres_data:
    redis_data:
YAML

# Update database.yml to use environment variables
file "config/database.yml", <<~YAML, force: true
  default: &default
    adapter: postgresql
    encoding: unicode
    pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
    url: <%= ENV.fetch("DATABASE_URL") { nil } %>
    username: <%= ENV.fetch("POSTGRES_USER") { "postgres" } %>
    password: <%= ENV.fetch("POSTGRES_PASSWORD") { "password" } %>

  development:
    <<: *default

  test:
    <<: *default
    database: app_test
YAML

after_bundle do
  # Ensure corepack is enabled and use yarn berry (v4) as specified in Rails 8
  run "corepack enable"
  
  # Install npm dependencies (node-modules mode)
  run "yarn install"

  # Run wulin_master install generator
  rails_command "generate wulin_master:install"

  # Copy material icons fonts
  run "yarn run copy-icons"

  # Set custom build script (overwrites Rails default to include font loaders)
  package_json = JSON.parse(File.read("package.json"))
  package_json["scripts"]["build"] = "esbuild app/javascript/application.js --bundle --sourcemap --format=esm --outdir=app/assets/builds --public-path=/assets --loader:.woff=file --loader:.woff2=file"
  package_json["scripts"]["build:watch"] = "esbuild app/javascript/application.js --bundle --sourcemap --format=esm --outdir=app/assets/builds --public-path=/assets --loader:.woff=file --loader:.woff2=file --watch=forever"
  package_json["scripts"]["dev"] = "bin/dev"
  File.write("package.json", JSON.pretty_generate(package_json))

  # Build JavaScript assets
  run "yarn build"

  # Generate theme color CSS
  run "bundle exec rake wulin_master:generate_theme_color_css"

  # Finally remove the default application.html.erb after all generators and installers are done
  remove_file "app/views/layouts/application.html.erb"

  say "\n"
  say "=================================================================", :green
  say "  Wulin Master Application successfully created!", :green
  say "=================================================================", :green
  say "  To start your application with Docker (recommended):", :yellow
  say "    1. docker-compose build"
  say "    2. docker-compose up"
  say "    3. docker-compose exec app bin/rails db:prepare"
  say "=================================================================", :green
end
