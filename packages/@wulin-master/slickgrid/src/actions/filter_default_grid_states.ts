/**
 * Filter Default Grid States Action
 * Toggles filtering of default grid states.
 */
WulinMaster.actions.FilterDefaultGridStates = Object.assign({}, WulinMaster.actions.BaseAction, {
  name: "filter_default_grid_states",

  activate: function () {
    const grid = this.getGrid();
    if (!grid) return false;

    const switcher = document.querySelector(".filter_default_grid_state input");
    if (!switcher) return false;

    switcher.onclick = () => {
      const value = switcher.checked ? "true" : "";
      grid.loader.setParam("default_grids", value, true);
    };
  },
});

WulinMaster.ActionManager.register(WulinMaster.actions.FilterDefaultGridStates);
