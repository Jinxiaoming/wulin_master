// Toolbar Item 'Delete'
WulinMaster.actions.Delete = Object.assign({}, WulinMaster.actions.BaseAction, {
  name: 'delete',

  handler: function() {
    const grid = this.getGrid();
    const ids = grid.getSelectedIds();

    if (ids.length > 0) {
      this.deleteGridRecords(grid, ids);
      return false;
    } else {
      window.displayErrorMessage("Please select a record.", "Selection Error");
    }
  }
});

WulinMaster.ActionManager.register(WulinMaster.actions.Delete);
