import { WulinGrid, GridAction } from '@wulin-master/core';
import Requests from './grid_requests.js';

/**
 * ActionManager handles the registration and dispatching of grid actions (toolbar items).
 */
export const ActionManager = (() => {
  const actions: Record<string, GridAction> = {};

  return {
    /**
     * Registers a new action.
     */
    register: function(obj: GridAction) {
      actions[obj.name] = obj;
    },

    /**
     * Unregisters an existing action.
     */
    unregister: function(obj: GridAction) {
      delete actions[obj.name];
    },

    /**
     * Retrieves an action by name, returning a fresh copy.
     */
    getAction: function(name: string): GridAction | null {
      const proto = actions[name];
      return proto ? Object.assign({}, proto) : null;
    },

    /**
     * Dispatches actions to a target (usually a grid).
     */
    dispatchActions: function(target: WulinGrid, configs: any[]) {
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
export const BaseAction: Partial<GridAction> = {
  _isAction: true,
  name: '',
  event: "click",
  triggerElementIdentifier: null,
  target: undefined,

  /**
   * Initializes the action by locating its trigger element and activating it.
   */
  init: function(this: GridAction) {
    // Try to find the trigger element
    let triggerElement = document.querySelector(this.triggerElementIdentifier) as HTMLElement;
    
    if (!triggerElement && this.target) {
      triggerElement = document.getElementById(`${this.name}_action_on_${this.target.name}`) as HTMLElement;
    }

    if (triggerElement) {
      this.activate(triggerElement);
    }
  },

  /**
   * Returns the grid associated with this action.
   */
  getGrid: function(this: GridAction): WulinGrid | null {
    if (this.target) return this.target;
    return null;
  },

  /**
   * Activates the action by binding the trigger event.
   */
  activate: function(this: GridAction, element: HTMLElement) {
    element.addEventListener(this.event || 'click', (e) => {
      if (element.classList.contains('toolbar_icon_disabled')) return false;
      this.handler(e);
    });
  },

  /**
   * Handles deleting records with a confirmation dialog.
   */
  deleteGridRecords: function(this: GridAction, grid: WulinGrid, ids: any[], customMessage?: string, customTitle?: string) {
    const self = this;
    const modelName = grid.model || 'record';
    const recordCount = ids.length;
    
    const message = customMessage || this.confirm_message || (
      recordCount > 1 
        ? `Are you sure you want to delete these ${recordCount} ${modelName.toLowerCase()}s?`
        : `Are you sure you want to delete this ${modelName.toLowerCase()}?`
    );

    const title = customTitle || this.confirm_title || "Delete Confirmation";

    window.WulinMaster.displayCustomizedConfirmModal({
      message: message,
      title: title,
      confirmCallBack: function() {
        Requests.deleteByAjax(grid, ids);
        // reload the master grid (for detach detail action)
        if (self.reload_master && (grid as any).master_grid) {
          (grid as any).master_grid.loader.reloadData();
        }
      }
    });
  },

  handler: () => {}
};

// Global exposure for legacy compatibility
(window as any).WulinMaster = (window as any).WulinMaster || {};
(window as any).WulinMaster.ActionManager = ActionManager;
(window as any).WulinMaster.actions = (window as any).WulinMaster.actions || {};
(window as any).WulinMaster.actions.BaseAction = BaseAction;
