import { GridAction } from '@wulin-master/core';
import { BaseAction, ActionManager } from '../action_manager';

/**
 * Filter Default Grid States Action
 * Toggles filtering of default grid states.
 */
const FilterDefaultGridStatesAction: GridAction = Object.assign({}, BaseAction, {
  name: "filter_default_grid_states",

  activate: function (this: GridAction) {
    const grid = this.target;
    if (!grid) return false;

    const switcher = document.querySelector(".filter_default_grid_state input") as HTMLInputElement;
    if (!switcher) return false;

    switcher.onclick = () => {
      const value = switcher.checked ? "true" : "";
      grid.loader.setParam("default_grids", value, true);
    };
  },

  handler: () => {}
});

ActionManager.register(FilterDefaultGridStatesAction);
export default FilterDefaultGridStatesAction;
