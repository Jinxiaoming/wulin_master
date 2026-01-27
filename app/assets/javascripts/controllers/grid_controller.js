import { Controller } from "@hotwired/stimulus"

/**
 * GridController manages the initialization of a SlickGrid instance.
 */
export default class extends Controller {
  static values = {
    name: String,
    model: String,
    screen: String,
    path: String,
    filters: Array,
    columns: Array,
    states: Object,
    actions: Array,
    behaviors: Array,
    options: Object,
    selectToolbarItems: Array,
    userId: String
  }

  connect() {
    this.initializeGrid()
    this.initializeTooltips()
  }

  disconnect() {
    if (this.grid) {
      this.grid.destroy()
    }
    if (window.gridManager && this.nameValue) {
      window.gridManager.destroyGrid(this.nameValue)
    }
  }

  /**
   * Calls GridManager to create the SlickGrid instance.
   */
  initializeGrid() {
    if (window.gridManager) {
      this.grid = window.gridManager.createNewGrid(
        this.nameValue,
        this.modelValue,
        this.screenValue,
        this.pathValue,
        this.filtersValue,
        this.columnsValue,
        this.statesValue,
        this.actionsValue,
        this.behaviorsValue,
        this.optionsValue,
        this.selectToolbarItemsValue,
        this.userIdValue
      )
    }
  }

  /**
   * Destroys the grid instance via GridManager.
   */
  destroyGrid() {
    if (window.gridManager && this.nameValue) {
      window.gridManager.destroyGrid(this.nameValue)
    }
  }

  /**
   * Initializes Materialize tooltips for the grid.
   */
  initializeTooltips() {
    const tooltips = this.element.querySelectorAll('.tooltipped')
    if (tooltips.length > 0 && window.M) {
      window.M.Tooltip.init(tooltips)
    }
  }
}
