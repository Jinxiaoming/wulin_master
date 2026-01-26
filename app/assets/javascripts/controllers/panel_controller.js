import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["buttons"]

  connect() {
    this.adjust()
  }

  adjust() {
    if (!this.hasButtonsTarget) return

    const panelHeight = this.element.offsetHeight
    const btnsHeight = this.buttonsTarget.offsetHeight
    const margin = (panelHeight - btnsHeight) / 2 * 0.8
    this.buttonsTarget.style.marginTop = `${margin}px`
  }
}
