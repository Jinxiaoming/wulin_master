import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["content", "title"]

  connect() {
    this.modal = M.Modal.getInstance(this.element)
    if (!this.modal) {
      this.modal = M.Modal.init(this.element)
    }
  }

  open(event) {
    const { message, title, confirmCallBack } = event.detail
    
    if (this.hasContentTarget) this.contentTarget.innerHTML = message
    if (this.hasTitleTarget) this.titleTarget.innerText = title

    if (confirmCallBack) {
      this.confirmCallBack = confirmCallBack
    }

    this.modal.open()
  }

  confirm() {
    if (this.confirmCallBack) {
      this.confirmCallBack()
      this.confirmCallBack = null
    }
    this.modal.close()
  }

  close() {
    this.modal.close()
  }
}
