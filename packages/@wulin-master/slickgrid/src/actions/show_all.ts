import { GridAction } from '@wulin-master/core';
import { BaseAction, ActionManager } from '../action_manager';

/**
 * Show All Action
 * Clears all filters and reloads the grid data.
 */
const ShowAllAction: GridAction = Object.assign({}, BaseAction, {
  name: 'show_all',

  handler: function(this: GridAction) {
    const grid = this.target;
    if (grid?.loader) {
      grid.loader.setFilter([]);
    }
  }
});

ActionManager.register(ShowAllAction);
export default ShowAllAction;
