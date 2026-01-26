# frozen_string_literal: true

require 'capybara/cuprite'

Capybara.register_driver :cuprite do |app|
  Capybara::Cuprite::Driver.new(
    app,
    window_size: [1200, 800],
    browser_options: { 'no-sandbox': nil },
    inspector: true,
    headless: ENV['HEADLESS'] != 'false'
  )
end

Capybara.javascript_driver = :cuprite
Capybara.default_max_wait_time = 5
