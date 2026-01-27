import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    this.loaderClass = 'ajax-loading'
  }

  append() {
    const loader = document.createElement('div')
    loader.className = this.loaderClass
    this.element.appendChild(loader)
  }

  remove() {
    const loader = this.element.querySelector(`.${this.loaderClass}`)
    if (loader) {
      loader.remove()
    }
  }

  /**
   * Toggles the debug information panel.
   */
  toggleDebug(event) {
    event.preventDefault()
    const debugInfo = document.getElementById('debug_info')
    if (debugInfo) {
      const isHidden = debugInfo.style.display === 'none'
      debugInfo.style.display = isHidden ? 'block' : 'none'
    }
  }
}
