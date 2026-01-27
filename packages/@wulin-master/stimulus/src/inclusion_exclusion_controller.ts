import { Controller } from "@hotwired/stimulus"
import { gridManager } from "@wulin-master/slickgrid"
import { displayNewNotification, displayErrorMessage } from "@wulin-master/core"

/**
 * InclusionExclusionController handles the logic for moving records between
 * an inclusion grid and an exclusion grid (many-to-many relationship).
 */
export default class extends Controller {
  static values = {
    inclusionGrid: String,
    exclusionGrid: String
  }

  /**
   * Moves selected records from exclusion grid to inclusion grid.
   */
  include() {
    this.handleMove('add')
  }

  /**
   * Moves selected records from inclusion grid to exclusion grid.
   */
  exclude() {
    this.handleMove('remove')
  }

  /**
   * Common handler for adding or removing associations.
   */
  async handleMove(type: 'add' | 'remove') {
    if (!gridManager) return

    const inclusionGrid = gridManager.getGrid(this.inclusionGridValue)
    const exclusionGrid = gridManager.getGrid(this.exclusionGridValue)

    if (!inclusionGrid || !exclusionGrid) return

    const ids = (type === 'add') ? exclusionGrid.getSelectedIds() : inclusionGrid.getSelectedIds()
    if (ids.length === 0) return

    // Find the master grid via affiliation behavior
    const affiliation = inclusionGrid.behaviors.find((b: any) => b.name === 'affiliation')
    if (!affiliation) return

    const groupGrid = gridManager.getGrid(affiliation.master_grid_name)
    if (!groupGrid) return

    const groupId = groupGrid.getSelectedIds()[0]
    if (!groupId) return

    // Disable buttons during request
    this.element.querySelectorAll('button, span[data-lucide]').forEach(el => el.classList.add('disabled'))

    const url = type === 'add' ? '/wulin_master/include' : '/wulin_master/exclude'
    const payload = {
      group_model: groupGrid.model,
      group_id: groupId,
      include_model: inclusionGrid.model,
      exclude_model: exclusionGrid.model,
      ids: ids,
      authenticity_token: decodeURIComponent((window as any)._token || '')
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()
      if (result.status === 'OK') {
        inclusionGrid.loader.reloadData()
        exclusionGrid.loader.reloadData()
        inclusionGrid.resetActiveCell()
        exclusionGrid.resetActiveCell()
        displayNewNotification(result.message, 'success')
      } else {
        displayErrorMessage(result.message, 'Error')
      }
    } catch (error) {
      console.error('Move error:', error)
      displayErrorMessage('An unexpected error occurred.', 'Network Error')
    } finally {
      this.element.querySelectorAll('button, span[data-lucide]').forEach(el => el.classList.remove('disabled'))
    }
  }
}
