import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["content", "navigation", "submenu"]

  toggle() {
    this.contentTarget.classList.toggle('extended-panel')
    this.navigationTarget.style.display = 
      (this.navigationTarget.style.display === 'none') ? 'block' : 'none'
  }

  toggleSubmenu(event) {
    event.preventDefault()
    const submenu = event.currentTarget.nextElementSibling
    if (submenu && submenu.tagName === 'UL') {
      submenu.style.display = 
        (submenu.style.display === 'none' || submenu.style.display === '') ? 'block' : 'none'
    }
  }

  expandAll() {
    this.submenuTargets.forEach(el => el.style.display = 'block')
  }

  collapseAll() {
    this.submenuTargets.forEach(el => el.style.display = 'none')
  }

  focusActive() {
    const activeItem = this.element.querySelector('li.item.active')
    if (activeItem) {
      const parentUl = activeItem.closest('ul')
      if (parentUl) parentUl.style.display = 'block'
      activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
}
