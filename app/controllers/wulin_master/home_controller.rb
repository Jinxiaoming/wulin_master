# frozen_string_literal: true

module WulinMaster
  class HomeController < ApplicationController
    include WulinMaster::Menuable

    def self.inherited(subclass)
      subclass.define_menu
      super
    end

    def index
      dashboard if respond_to?(:dashboard)
      respond_to do |format|
        format.html do
          xhr = request.xhr?
          if xhr
            begin
              render template: 'homepage/dashboard', layout: false
            rescue StandardError
              render plain: ''
            end
          else
            begin
              render 'wulin_master/index', locals: {xhr: xhr}
            rescue ActionView::MissingTemplate
              render 'wulin_master/home', locals: {xhr: xhr}
            end
          end
        end
      end
    end
  end
end
