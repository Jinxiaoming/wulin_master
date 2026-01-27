/**
 * Copy Grid States Action
 * Copies selected grid states to selected users.
 */
WulinMaster.actions.CopyGridStates = Object.assign({}, WulinMaster.actions.BaseAction, {
  name: 'copy_grid_states',

  handler: async function() {
    const stateGrid = window.gridManager.getGrid("state_grid_in_grid_states");
    const userGrid = window.gridManager.getGrid("user_in_grid_states");
    
    if (!stateGrid || !userGrid) return false;

    const selectedStateIds = stateGrid.getSelectedIds();
    const selectedUserIds = userGrid.getSelectedIds();

    if (selectedStateIds.length === 0 || selectedUserIds.length === 0) {
      window.displayErrorMessage("You must select both grid states and users.", "Selection Error");
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
      stateGrid.resetActiveCell();
      userGrid.resetActiveCell();

      if (result.success) {
        stateGrid.loader.reloadData();
        window.displayNewNotification("Grid states successfully copied to the users.", "success");
      } else {
        window.displayErrorMessage(result.error_message || "Copy failed", "Error");
      }
    } catch (error) {
      console.error('Copy grid states error:', error);
      window.displayErrorMessage('An error occurred while copying grid states.', 'Network Error');
    }
  }
});

WulinMaster.ActionManager.register(WulinMaster.actions.CopyGridStates);
