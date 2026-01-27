import Requests from './grid_requests.js';

/**
 * ActionManager handles the registration and dispatching of grid actions (toolbar items).
 */
const ActionManager = (() => {
  const actions = {};

  return {
    /**
     * Registers a new action.
     */
    register: function(obj) {
      actions[obj.name] = obj;
    },

    /**
     * Unregisters an existing action.
     */
    unregister: function(obj) {
      delete actions[obj.name];
    },

    /**
     * Retrieves an action by name, returning a fresh copy.
     */
    getAction: function(name) {
      const proto = actions[name];
      return proto ? Object.assign({}, proto) : null;
    },

    /**
     * Dispatches actions to a target (usually a grid).
     */
    dispatchActions: function(target, configs) {
      if (!configs) return;
      for (let i in configs) {
        const action = this.getAction(configs[i].name);
        if (action) {
          Object.assign(action, configs[i], { target: target });
          if (action.init) action.init();
        }
      }
    }
  };
})();

/**
 * BaseAction provides the base logic for all grid actions.
 */
const BaseAction = {
  _isAction: true,
  name: null,
  event: "click",
  triggerElementIdentifier: null,
  target: null,

  /**
   * Initializes the action by locating its trigger element and activating it.
   */
  init: function() {
    // Try to find the trigger element
    this.triggerElement = document.querySelector(this.triggerElementIdentifier);
    
    if (!this.triggerElement) {
      this.triggerElement = document.getElementById(`${this.name}_action_on_${this.target.name}`);
    }

    if (this.triggerElement) {
      this.activate();
    }
  },

  /**
   * Returns the grid associated with this action.
   */
  getGrid: function() {
    if (this.target) return this.target;
    
    const toolbar = this.triggerElement?.closest(".toolbar");
    if (toolbar) {
      const gridName = toolbar.dataset.grid;
      return window.gridManager.getGrid(gridName);
    }
    return null;
  },

  /**
   * Activates the action by binding the trigger event.
   */
  activate: function() {
    if (!this.triggerElement) return;

    this.triggerElement.addEventListener(this.event, (e) => {
      if (this.triggerElement.classList.contains('toolbar_icon_disabled')) return false;
      this.handler(e);
    });
  },

  /**
   * Handles deleting records with a confirmation dialog.
   */
  deleteGridRecords: function(grid, ids, customMessage, customTitle) {
    const self = this;
    const modelName = grid.model || 'record';
    const recordCount = ids.length;
    
    const message = customMessage || this.confirm_message || (
      recordCount > 1 
        ? `Are you sure you want to delete these ${recordCount} ${modelName.toLowerCase()}s?`
        : `Are you sure you want to delete this ${modelName.toLowerCase()}?`
    );

    const title = customTitle || this.confirm_title || "Delete Confirmation";

    window.displayCustomizedConfirmModal({
      message: message,
      title: title,
      confirmCallBack: function() {
        Requests.deleteByAjax(grid, ids);
        // reload the master grid (for detach detail action)
        if (self.reload_master && grid.master_grid) {
          grid.master_grid.loader.reloadData();
        }
      }
    });
  },

  /**
   * Adjusts the grid height when displayed inside a modal.
   */
  setGridHeightInModal: function(modalDom) {
    const modal = modalDom;
    if (!modal) return;

    const headerHeight = modal.querySelector('.modal-header')?.offsetHeight || 0;
    const gridHeaderHeight = modal.querySelector('.grid-header')?.offsetHeight || 0;
    const slickHeaderHeight = modal.querySelector('.slick-header')?.offsetHeight || 0;
    const footerHeight = modal.querySelector('.modal-footer')?.offsetHeight || 0;
    const pagerHeight = modal.querySelector('.pager')?.offsetHeight || 0;
    const extraHeight = modal.querySelector('.extra-block')?.offsetHeight || 0;

    const viewport = modal.querySelector('.slick-viewport');
    if (viewport) {
      const canvasHeight = modal.offsetHeight - headerHeight - gridHeaderHeight - slickHeaderHeight - footerHeight - extraHeight - pagerHeight;
      viewport.style.height = `${canvasHeight}px`;
    }
    
    modal.querySelectorAll('.grid-canvas, .grid').forEach(el => el.style.height = 'auto');
  },

  handler: () => {}
};

// Global exposure for legacy compatibility
window.WulinMaster = window.WulinMaster || {};
window.WulinMaster.ActionManager = ActionManager;
window.WulinMaster.actions = window.WulinMaster.actions || {};
window.WulinMaster.actions.BaseAction = BaseAction;

export { ActionManager, BaseAction };
