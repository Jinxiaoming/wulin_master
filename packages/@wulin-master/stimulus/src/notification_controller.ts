import { Controller } from "@hotwired/stimulus"
import { IconManager } from "@wulin-master/core"

export default class extends Controller {
  static targets = ["container"]

  connect() {
    this.duration = 3000 // 3 seconds
  }

  display(event: CustomEvent) {
    const { message, type, always } = event.detail
    this.saveMessage(message, type)
    
    const notification = this.buildNotification(message, type)
    this.containerTarget.appendChild(notification)
    
    // Animate in (simple fade in)
    notification.style.opacity = '0'
    notification.style.display = 'block'
    setTimeout(() => {
      notification.style.transition = 'opacity 0.3s'
      notification.style.opacity = '1'
    }, 10)

    if (!always) {
      setTimeout(() => this.discard(notification), this.duration)
    }
  }

  discard(element: HTMLElement) {
    if (!element) return
    
    element.style.opacity = '0'
    setTimeout(() => {
      element.remove()
    }, 300)
  }

  discardClick(event: MouseEvent) {
    this.discard(event.currentTarget as HTMLElement)
  }

  buildNotification(message: string, type: string) {
    const div = document.createElement('div')
    div.className = `notification ${type || ''}`
    div.innerHTML = message
    div.dataset.action = "click->notification#discardClick"
    return div
  }

  saveMessage(content: string, type: string) {
    const nowDate = new Date()
    const hour = ('0' + nowDate.getHours()).slice(-2)
    const minute = ('0' + nowDate.getMinutes()).slice(-2)
    const time = `${hour}:${minute}`

    const activityList = document.getElementById('activity_menu-list')
    if (activityList) {
      const li = document.createElement('li')
      li.className = "notification-item collection-item"
      
      let iconName = 'alert-circle'
      let iconClass = ''
      if (type === 'info') iconName = 'info'
      else if (type === 'success') {
        iconName = 'check-circle'
        iconClass = 'green-text'
      } else {
        iconClass = 'red-text'
      }

      const iconHtml = IconManager.getIconHtml(iconName, { class: `left ${iconClass}` })

      li.innerHTML = `
        ${iconHtml}
        <div>${content}</div>
        <div class="right">${time}</div>
      `
      activityList.prepend(li)
      
      const activityMenu = document.getElementById('activity_menu')
      if (activityMenu) activityMenu.classList.remove('disabled')
    }
  }
}
