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
}
