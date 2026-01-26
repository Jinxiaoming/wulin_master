/**
 * Show All Action
 * Clears all filters and reloads the grid data.
 */
WulinMaster.actions.ShowAll = Object.assign({}, WulinMaster.actions.BaseAction, {
  name: 'show_all',

  handler: function() {
    const grid = this.getGrid();
    if (grid?.loader) {
      grid.loader.setFilter([]);
    }
  }
});

WulinMaster.ActionManager.register(WulinMaster.actions.ShowAll);
