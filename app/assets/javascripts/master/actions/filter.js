/**
 * Filter Action
 * Ensures the FilterPanel is initialized for the grid.
 */
WulinMaster.actions.Filter = Object.assign({}, WulinMaster.actions.BaseAction, {
  name: 'filter',

  /**
   * Overrides activate to initialize FilterPanel without a separate click handler.
   */
  activate: function() {
    const grid = this.getGrid();
    if (grid && !grid.filterPanel) {
      grid.filterPanel = new window.WulinMaster.FilterPanel(grid, grid.loader, grid.states["filter"]);
    }
  }
});

WulinMaster.ActionManager.register(WulinMaster.actions.Filter);
