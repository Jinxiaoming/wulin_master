import { Controller } from "@hotwired/stimulus"

/**
 * ToolbarController handles the dropdown and click events for the grid toolbar.
 */
export default class extends Controller {
  static values = {
    gridId: String
  }

  connect() {
    this.initializeDropdown()
  }

  /**
   * Initializes the Materialize dropdown for the "More" menu.
   */
  initializeDropdown() {
    const trigger = this.element.querySelector('.dropdown-trigger')
    if (trigger && window.M) {
      window.M.Dropdown.init(trigger, {
        alignment: 'right',
        constrainWidth: false
      })
    }
  }

  /**
   * Handles clicks on items within the "More" dropdown by proxying them
   * to the actual hidden action buttons.
   */
  proxyClick(event) {
    const targetId = event.currentTarget.dataset.id
    if (targetId) {
      const actualButton = document.getElementById(targetId)
      if (actualButton) {
        actualButton.click()
      }
    }
  }
}
