# frozen_string_literal: true

# Usage:
#   rails new wulin_app --skip-hotwire --database=postgresql -j esbuild \
#     -m ./wulin_master_template.rb

# =============================================================================
# 1. Yarn — use node-modules linker for compatibility
# =============================================================================

file ".yarnrc.yml", <<~YAML
  nodeLinker: node-modules
  supportedArchitectures:
    os: [darwin, linux]
    cpu: [arm64, x64]
YAML

# =============================================================================
# 2. Wulin Master — add as git submodule
# =============================================================================

run "git submodule add -b v3.0.1a https://github.com/Jinxiaoming/wulin_master.git vendor/gems/wulin_master"
run "git config -f .gitmodules submodule.vendor/gems/wulin_master.branch v3"

# =============================================================================
# 3. Gem Dependencies
# =============================================================================

# -- Core --
gem "wulin_master", path: "vendor/gems/wulin_master"
gem "dartsass-rails"
gem "redis", ">= 5.0"

# Ruby 3.4+ extracted these from stdlib
gem "rexml"
gem "net-smtp"
gem "net-imap"
gem "net-pop"

# -- Development --
gem_group :development do
  gem "annotate"
  gem "bullet"
  gem "letter_opener"
end

# -- Development & Test --
gem_group :development, :test do
  gem "dotenv-rails"
  gem "rspec-rails", "~> 7.0"
  gem "factory_bot_rails"
  gem "faker"
  gem "standard"
end

# -- Test --
gem_group :test do
  gem "shoulda-matchers"
  gem "database_cleaner-active_record"
  gem "simplecov", require: false
end

# =============================================================================
# 4. JavaScript & CSS
# =============================================================================

file "app/javascript/application.js", <<~JS
  import '../../vendor/gems/wulin_master/app/assets/javascripts/master/master.js'
JS

remove_file "app/assets/stylesheets/application.css"

file "app/assets/stylesheets/master.scss", <<~SCSS
  @import "theme.generated";
  @import "../../../vendor/gems/wulin_master/app/assets/stylesheets/master";
SCSS

# =============================================================================
# 5. Package.json
# =============================================================================

file "package.json", <<~JSON, force: true
  {
    "name": "app",
    "private": true,
    "packageManager": "yarn@4.0.0",
    "devDependencies": {
      "esbuild": "^0.25.0"
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
      "@esbuild/linux-arm64": "0.25.0",
      "@esbuild/linux-x64": "0.25.0",
      "@esbuild/darwin-arm64": "0.25.0"
    }
  }
JSON

# =============================================================================
# 6. Fonts & Asset Pipeline
# =============================================================================

run "mkdir -p app/assets/fonts"
run "rm -f config/initializers/assets.rb"

initializer "assets.rb", <<~RB
  Rails.application.config.assets.version = "1.0"
  Rails.application.config.assets.paths << Rails.root.join("app/assets/fonts")
RB

file "script/copy_material_icons.js", <<~JS
  const fs = require("fs");
  const path = require("path");

  try {
    const iconPkgPath = require.resolve("material-icons/package.json");
    const srcDir = path.join(path.dirname(iconPkgPath), "iconfont");
    const dstDir = path.join(__dirname, "..", "app", "assets", "fonts");

    fs.mkdirSync(dstDir, { recursive: true });

    for (const name of [
      "material-icons.woff2",
      "material-icons.woff",
      "material-icons-outlined.woff2",
      "material-icons-outlined.woff",
      "material-icons-round.woff2",
      "material-icons-round.woff",
      "material-icons-sharp.woff2",
      "material-icons-sharp.woff",
      "material-icons-two-tone.woff2",
      "material-icons-two-tone.woff",
    ]) {
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

# =============================================================================
# 7. Procfile & Wulin Master Assets Initializer
# =============================================================================

file "Procfile.dev", <<~PROCFILE, force: true
  web: bundle exec rails server -b 0.0.0.0
  js: yarn build:watch --sourcemap=inline
  css: bundle exec rails dartsass:watch
PROCFILE

initializer "wulin_master_assets.rb", <<~RB
  # frozen_string_literal: true

  require "dartsass-rails"

  Rails.application.configure do
    config.assets.paths << Rails.root.join("app/assets/builds")
    config.assets.precompile += %w[*.woff *.woff2]

    config.dartsass.builds = { "master.scss" => "master.css" }
    config.dartsass.build_options << "--load-path=node_modules"
    config.dartsass.build_options << "--load-path=app/assets/stylesheets"
    config.dartsass.build_options << "--quiet-deps"
    config.dartsass.build_options << "--silence-deprecation=import,global-builtin,slash-div,color-functions"
  end
RB

# =============================================================================
# 8. Environment Variables
# =============================================================================

file ".env.example", <<~ENV
  POSTGRES_USER=postgres
  POSTGRES_PASSWORD=password
  DB_HOST=localhost
  DB_PORT=5432
  REDIS_URL=redis://localhost:6379/1
  RAILS_ENV=development
ENV

run "cp .env.example .env"

append_to_file ".gitignore", <<~GIT

  # Environment
  .env
  .env.local
  .env.*.local

  # Coverage
  coverage/

  # Volumes
  volumes/
GIT

# =============================================================================
# 9. Docker
# =============================================================================

file ".dockerignore", <<~TEXT, force: true
  .git
  .env
  .env.local
  node_modules
  tmp
  log
  storage
  public/assets
  coverage
  .bundle
TEXT

file "Dockerfile", <<~DOCKERFILE, force: true
  # syntax=docker/dockerfile:1
  ARG RUBY_VERSION=3.3.6
  ARG NODE_MAJOR=20

  FROM ruby:${RUBY_VERSION}-slim AS base

  WORKDIR /rails

  RUN apt-get update -qq && \\
      apt-get install --no-install-recommends -y \\
        build-essential git libpq-dev curl gnupg2 procps && \\
      curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash - && \\
      apt-get install -y --no-install-recommends nodejs && \\
      corepack enable && \\
      rm -rf /var/lib/apt/lists/*

  COPY Gemfile Gemfile.lock ./
  COPY vendor/gems/wulin_master ./vendor/gems/wulin_master
  RUN bundle install --jobs 4

  COPY package.json yarn.lock .yarnrc.yml ./
  RUN yarn install

  COPY . .

  EXPOSE 3000
  CMD ["./bin/dev"]
DOCKERFILE

file "docker-compose.yml", <<~YAML
  services:
    db:
      container_name: wulin_postgres
      image: postgres:16-alpine
      volumes:
        - volumes/postgres_data:/var/lib/postgresql/data
      environment:
        POSTGRES_USER: \${POSTGRES_USER:-postgres}
        POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-password}
      healthcheck:
        test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER"]
        interval: 5s
        timeout: 5s
        retries: 5

    redis:
      container_name: wulin_redis
      image: redis:7-alpine
      volumes:
        - volumes/redis_data:/data
      healthcheck:
        test: ["CMD", "redis-cli", "ping"]
        interval: 5s
        timeout: 5s
        retries: 5

    app:
      container_name: wulin_app
      build: .
      command: ./bin/dev
      volumes:
        - .:/rails
        - bundle_cache:/usr/local/bundle
        - node_modules:/rails/node_modules
      ports:
        - "3000:3000"
      env_file:
        - .env
      environment:
        DB_HOST: db
        REDIS_URL: redis://redis:6379/1
      depends_on:
        db:
          condition: service_healthy
        redis:
          condition: service_healthy

  volumes:
    postgres_data:
    redis_data:
    bundle_cache:
    node_modules:
YAML

# =============================================================================
# 10. Database Configuration
# =============================================================================

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
    pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 25 } %>
YAML

# =============================================================================
# 11. README
# =============================================================================

file "README.md", <<~MARKDOWN, force: true
  # #{app_name.titleize}

  Built with **Rails 8** and **[Wulin Master](https://github.com/ekohe/wulin_master)** — a grid-centric administrative framework.

  ## Quick Start (Docker)

  ```bash
  docker compose up --build
  docker compose exec app bin/rails db:prepare
  ```

  Open http://localhost:3000.

  ## Quick Start (Local)

  Prerequisites: Ruby #{RUBY_VERSION}, Node 20+, PostgreSQL, Redis.

  ```bash
  bundle install
  yarn install
  cp .env.example .env   # edit credentials if needed
  bin/rails db:prepare
  bin/dev
  ```

  ## Tech Stack

  | Layer          | Choice                     |
  |----------------|----------------------------|
  | Framework      | Rails 8                    |
  | Admin UI       | Wulin Master (SlickGrid)   |
  | Database       | PostgreSQL 16              |
  | Cache / PubSub | Redis 7                    |
  | JS Bundler     | esbuild                    |
  | CSS            | Dart Sass (dartsass-rails)  |
  | Assets         | Propshaft                  |
  | Testing        | RSpec, FactoryBot, SimpleCov |
  | Linting        | Standard Ruby              |

  ## Project Structure

  ```
  app/
    grids/        # Wulin grid definitions (*_grid.rb)
    screens/      # Wulin screen definitions (*_screen.rb)
    models/       # ActiveRecord models
    controllers/  # inherit WulinMaster::ScreenController
  spec/
    models/       # model specs
    requests/     # request specs
    factories/    # FactoryBot definitions
    support/      # shared helpers & config
  ```

  ## Useful Commands

  ```bash
  bin/rails generate wulin_master:screen ModelName   # scaffold a screen
  bundle exec rake wulin_master:generate_theme_color_css
  bundle exec rspec                                   # run tests
  bundle exec standardrb --fix                        # auto-fix lint
  ```

  ---
  Built with care by [Ekohe](https://www.ekohe.com)
MARKDOWN

# =============================================================================
# 12. After Bundle — generators, test infra, asset build, cleanup
# =============================================================================

after_bundle do
  run "corepack enable"
  run "yarn install"

  # -- Wulin Master generator --
  rails_command "generate wulin_master:install"

  # -- RSpec --
  rails_command "generate rspec:install"
  remove_dir "test"

  file ".rspec", <<~RSPEC, force: true
    --require spec_helper
    --format documentation
    --color
    --order random
  RSPEC

  # Prepend SimpleCov (must load before any app code)
  inject_into_file "spec/rails_helper.rb", before: "require 'spec_helper'" do
    <<~RUBY
      require "simplecov"
      SimpleCov.start("rails") do
        add_filter "/vendor/"
        add_filter "/spec/"
      end

    RUBY
  end

  # Load support files
  inject_into_file "spec/rails_helper.rb", after: "require 'rspec/rails'\n" do
    <<~RUBY

      Dir[Rails.root.join("spec/support/**/*.rb")].each { |f| require f }
    RUBY
  end

  # Include FactoryBot methods
  inject_into_file "spec/rails_helper.rb", after: "RSpec.configure do |config|\n" do
    <<~RUBY
      config.include FactoryBot::Syntax::Methods

    RUBY
  end

  # Shoulda Matchers
  file "spec/support/shoulda_matchers.rb", <<~RUBY
    Shoulda::Matchers.configure do |config|
      config.integrate do |with|
        with.test_framework :rspec
        with.library :rails
      end
    end
  RUBY

  # DatabaseCleaner
  file "spec/support/database_cleaner.rb", <<~RUBY
    RSpec.configure do |config|
      config.before(:suite) do
        DatabaseCleaner.strategy = :transaction
        DatabaseCleaner.clean_with(:truncation)
      end

      config.around do |example|
        DatabaseCleaner.cleaning { example.run }
      end
    end
  RUBY

  run "mkdir -p spec/models spec/requests spec/factories spec/support"

  # -- Annotate generator --
  rails_command "generate annotate:install"

  # -- Bullet initializer --
  initializer "bullet.rb", <<~RB
    if defined?(Bullet)
      Rails.application.configure do
        config.after_initialize do
          Bullet.enable        = true
          Bullet.alert         = false
          Bullet.bullet_logger = true
          Bullet.console       = true
          Bullet.rails_logger  = true
          Bullet.add_footer    = true
        end
      end
    end
  RB

  # -- Letter Opener --
  environment "config.action_mailer.delivery_method = :letter_opener", env: "development"
  environment 'config.action_mailer.default_url_options = { host: "localhost", port: 3000 }', env: "development"

  # -- Assets: copy icons & configure esbuild --
  run "yarn run copy-icons"

  package_json = JSON.parse(File.read("package.json"))
  esbuild_flags = %w[
    app/javascript/application.js
    --bundle
    --sourcemap
    --format=esm
    --outdir=app/assets/builds
    --public-path=/assets
    --loader:.woff=file
    --loader:.woff2=file
  ].join(" ")

  package_json["scripts"]["build"]       = "esbuild #{esbuild_flags}"
  package_json["scripts"]["build:watch"]  = "esbuild #{esbuild_flags} --watch=forever"
  package_json["scripts"]["dev"]          = "bin/dev"
  File.write("package.json", JSON.pretty_generate(package_json))

  run "yarn build"

  # Remove duplicate js watcher that jsbundling-rails may have added
  procfile_path = "Procfile.dev"
  if File.exist?(procfile_path)
    content = File.read(procfile_path)
    if content.include?("js: yarn build --watch")
      content.gsub!(/^js: yarn build --watch\n?/, "")
      File.write(procfile_path, content)
    end
  end

  # Generate Wulin Master theme CSS
  run "bundle exec rake wulin_master:generate_theme_color_css"

  # Cleanup leftover files
  remove_file "app/views/layouts/application.html.erb"
  remove_file "app/assets/stylesheets/master.sass"
  remove_file "app/assets/stylesheets/application.sass"
  remove_file "app/javascript/application.sass"

  say ""
  say "=================================================================", :green
  say "  Wulin Master application created successfully!", :green
  say "=================================================================", :green
  say ""
  say "  Docker:                                    Local:", :yellow
  say "    docker compose up --build                  bundle install && yarn install", :cyan
  say "    docker compose exec app rails db:prepare   bin/rails db:prepare", :cyan
  say "                                               bin/dev", :cyan
  say ""
  say "  Tests:  bundle exec rspec", :yellow
  say "  Lint:   bundle exec standardrb --fix", :yellow
  say "=================================================================", :green
end
