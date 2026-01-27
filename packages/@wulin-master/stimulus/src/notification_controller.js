import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["container"]

  connect() {
    this.duration = 3000 // 3 seconds
  }

  display(event) {
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

  discard(element) {
    if (!element) return
    
    element.style.opacity = '0'
    setTimeout(() => {
      element.remove()
    }, 300)
  }

  discardClick(event) {
    this.discard(event.currentTarget)
  }

  buildNotification(message, type) {
    const div = document.createElement('div')
    div.className = `notification ${type || ''}`
    div.innerHTML = message
    div.dataset.action = "click->notification#discardClick"
    return div
  }

  saveMessage(content, type) {
    const nowDate = new Date()
    const hour = ('0' + nowDate.getHours()).slice(-2)
    const minute = ('0' + nowDate.getMinutes()).slice(-2)
    const time = `${hour}:${minute}`

    const activityList = document.getElementById('activity_menu-list')
    if (activityList) {
      const li = document.createElement('li')
      li.className = "notification-item collection-item"
      
      let iconText = 'error'
      let iconClass = ''
      if (type === 'info') iconText = 'error_outline'
      else if (type === 'success') {
        iconText = 'done'
        iconClass = 'green-text'
      } else {
        iconClass = 'red-text'
      }

      li.innerHTML = `
        <i class="material-icons left ${iconClass}">${iconText}</i>
        <div>${content}</div>
        <div class="right">${time}</div>
      `
      activityList.prepend(li)
      
      const activityMenu = document.getElementById('activity_menu')
      if (activityMenu) activityMenu.classList.remove('disabled')
    }
  }
}
