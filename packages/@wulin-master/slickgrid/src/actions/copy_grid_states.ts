import { GridAction } from '@wulin-master/core';
import { BaseAction, ActionManager } from '../action_manager';

/**
 * Copy Grid States Action
 * Copies selected grid states to selected users.
 */
const CopyGridStatesAction: GridAction = Object.assign({}, BaseAction, {
  name: 'copy_grid_states',

  handler: async function(this: GridAction) {
    const stateGrid = window.WulinMaster.gridManager.getGrid("state_grid_in_grid_states");
    const userGrid = window.WulinMaster.gridManager.getGrid("user_in_grid_states");
    
    if (!stateGrid || !userGrid) return false;

    const selectedStateIds = (stateGrid as any).getSelectedIds();
    const selectedUserIds = (userGrid as any).getSelectedIds();

    if (selectedStateIds.length === 0 || selectedUserIds.length === 0) {
      window.WulinMaster.displayErrorMessage("You must select both grid states and users.", "Selection Error");
      return false;
    }

    const url = "/wulin_master/grid_states/copy";
    const payload = {
      state_ids: selectedStateIds,
      user_ids: selectedUserIds,
      authenticity_token: decodeURIComponent(window._token || '')
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      (stateGrid as any).resetActiveCell();
      (userGrid as any).resetActiveCell();

      if (result.success) {
        stateGrid.loader.reloadData();
        window.WulinMaster.displayNewNotification("Grid states successfully copied to the users.", "success");
      } else {
        window.WulinMaster.displayErrorMessage(result.error_message || "Copy failed", "Error");
      }
    } catch (error) {
      console.error('Copy grid states error:', error);
      window.WulinMaster.displayErrorMessage('An error occurred while copying grid states.', 'Network Error');
    }
  }
});

ActionManager.register(CopyGridStatesAction);
export default CopyGridStatesAction;
