import { Controller } from "@hotwired/stimulus"
import { IconManager } from "@wulin-master/core"

export default class extends Controller {
  connect() {
    if (window.M) {
      window.M.AutoInit(this.element)
    }
    IconManager.scan(this.element)
  }
}
