/**
 * Hotkey 'D' to delete record
 */
WulinMaster.actions.HotkeyDelete = Object.assign({}, WulinMaster.actions.BaseAction, {
  name: 'hotkey_delete',
  event: 'keypress',
  triggerElementIdentifier: '.grid_container',

  handler: function(e) {
    if (window.Ui.addOrDeleteLocked()) return true;

    const grid = window.Ui.findCurrentGrid();
    if (grid && (e.key === 'd' || e.key === 'D')) {
      const ids = grid.getSelectedIds();
      if (ids.length > 0) {
        this.deleteGridRecords(grid, ids);
        return false;
      } else {
        window.displayErrorMessage("Please select a record.", "Selection Error");
      }
    }
  }
});

// WulinMaster.ActionManager.register(WulinMaster.actions.HotkeyDelete);
