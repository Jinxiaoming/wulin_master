import { Controller } from "@hotwired/stimulus"

/**
 * GridStatesController handles the UI for switching, creating, and editing grid states.
 */
export default class extends Controller {
  static values = {
    gridName: String,
    currentId: String
  }
  
  static targets = ["createInput", "editInput", "createBtn", "updateBtn"]

  connect() {
    // Initialize Materialize components
    const dropdown = this.element.querySelector('.dropdown-trigger')
    if (dropdown) M.Dropdown.init(dropdown)
    
    const modals = this.element.querySelectorAll('.modal')
    M.Modal.init(modals)
  }

  /**
   * Toggles the dropdown icon.
   */
  toggleIcon(event) {
    const icon = event.currentTarget.querySelector('.material-icons')
    if (icon) {
      icon.textContent = (icon.textContent === 'arrow_drop_down') ? 'arrow_drop_up' : 'arrow_drop_down'
    }
  }

  /**
   * Enables/disables the create button based on input.
   */
  validateCreate() {
    this.createBtnTarget.classList.toggle('disabled', !this.createInputTarget.value)
  }

  /**
   * Handles Enter key in create input.
   */
  handleCreateKey(event) {
    if (event.key === 'Enter' && !this.createBtnTarget.classList.contains('disabled')) {
      this.create()
    }
  }

  /**
   * Creates a new grid state.
   */
  async create() {
    const name = this.createInputTarget.value
    const url = '/wulin_master/grid_states_manages/create'
    const payload = {
      grid_name: this.gridNameValue,
      state_name: name,
      authenticity_token: decodeURIComponent(window._token || '')
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify(payload)
      })

      const result = await response.text()
      if (result === 'success') {
        window.location.reload()
      } else {
        window.displayErrorMessage(result, "Error")
      }
    } catch (error) {
      console.error('Create state error:', error)
    }
  }

  /**
   * Opens the edit modal for a state.
   */
  openEdit(event) {
    const { stateId, stateName } = event.currentTarget.dataset
    this.editingId = stateId
    this.editInputTarget.value = stateName
    this.editInputTarget.nextElementSibling?.classList.add('active')
    
    const modal = document.getElementById('edit-state-modal')
    M.Modal.getInstance(modal).open()
    this.validateUpdate()
  }

  /**
   * Enables/disables the update button based on input.
   */
  validateUpdate() {
    const newVal = this.editInputTarget.value
    this.updateBtnTarget.classList.toggle('disabled', !newVal)
  }

  /**
   * Handles Enter key in edit input.
   */
  handleEditKey(event) {
    if (event.key === 'Enter' && !this.updateBtnTarget.classList.contains('disabled')) {
      this.update()
    }
  }

  /**
   * Updates an existing grid state.
   */
  async update() {
    const name = this.editInputTarget.value
    const url = '/wulin_master/grid_states_manages/update'
    const payload = {
      id: this.editingId,
      name: name,
      authenticity_token: decodeURIComponent(window._token || '')
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify(payload)
      })

      const result = await response.text()
      if (result === 'success') {
        window.location.reload()
      } else {
        window.displayErrorMessage(result, "Error")
      }
    } catch (error) {
      console.error('Update state error:', error)
    }
  }

  /**
   * Deletes a grid state.
   */
  async delete() {
    if (!confirm("Are you sure you want to delete this view?")) return

    const url = '/wulin_master/grid_states_manages/destroy'
    const payload = {
      id: this.editingId,
      authenticity_token: decodeURIComponent(window._token || '')
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify(payload)
      })

      const result = await response.text()
      if (result === 'success') {
        window.location.reload()
      } else {
        window.displayErrorMessage(result, "Error")
      }
    } catch (error) {
      console.error('Delete state error:', error)
    }
  }
}
