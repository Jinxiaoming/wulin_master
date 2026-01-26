import { Controller } from "@hotwired/stimulus"

/**
 * ScreenController handles the lifecycle of a WulinMaster screen.
 * It manages screen-specific initialization, cleanup, and loader states.
 */
export default class extends Controller {
  static targets = ["content"]

  connect() {
    // This runs whenever a new screen is loaded into the DOM
    this.initializeScreen()
  }

  /**
   * Performs initialization logic for the newly loaded screen.
   */
  initializeScreen() {
    // Get the screen ID from the first child element
    const screenElement = this.element.querySelector('[id]')
    if (screenElement) {
      const id = screenElement.id
      // Update body class for screen-specific styling
      this.element.classList.remove(...this.element.classList)
      this.element.classList.add(`content-${id}`)
    }

    // Trigger Google Analytics if available
    this.trackAnalytics()
  }

  /**
   * Tracks page view in Google Analytics.
   */
  trackAnalytics() {
    if (typeof ga !== 'undefined') {
      ga('send', 'pageview', window.location.pathname)
    }
  }

  /**
   * Cleanup logic before the screen is replaced.
   * Triggered by Turbo events.
   */
  beforeRender() {
    // Remove old context menus, tooltips, etc.
    document.querySelectorAll("ul.context-menu").forEach(el => el.remove())
    document.querySelectorAll('.wulin-columnpicker').forEach(el => el.remove())
    document.querySelectorAll('.material-tooltip').forEach(el => el.remove())
    
    // Global cleanup for editors if defined
    if (typeof cleanUpEditors === 'function') {
      cleanUpEditors()
    }
  }
}
