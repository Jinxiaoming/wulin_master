import { GridAction } from '@wulin-master/core';
import { BaseAction, ActionManager } from '../action_manager';

/**
 * Filter Action
 * Ensures the FilterPanel is initialized for the grid.
 */
const FilterAction: GridAction = Object.assign({}, BaseAction, {
  name: 'filter',

  /**
   * Overrides activate to initialize FilterPanel without a separate click handler.
   */
  activate: function(this: GridAction) {
    const grid = this.target;
    if (grid && !(grid as any).filterPanel) {
      (grid as any).filterPanel = new window.WulinMaster.FilterPanel(grid, grid.loader, (grid as any).states["filter"]);
    }
  },

  handler: () => {}
});

ActionManager.register(FilterAction);
export default FilterAction;
