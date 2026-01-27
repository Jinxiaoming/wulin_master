import { WulinGrid, GridBehavior } from '@wulin-master/core';
import { BaseBehavior, BehaviorManager } from '../behavior_manager';

/**
 * Events for inclusion and exclusion grids:
 * - 1. remove row highlight for opponent grid when select a row in current grid
 * - 2. enable/disable 'Add' or 'Remove' button when select a row in the grid
 */
const IncludeExcludeTriviaBehavior: GridBehavior = Object.assign({}, BaseBehavior, {
  name: 'include_exclude_trivia',
  event: "onSelectedRowsChanged",

  subscribe: function(this: GridBehavior, target: WulinGrid) {
    this.grid = target;
    const self = this;
    (target as any)[this.event].subscribe(() => self.handler());
  },

  handler: function(this: GridBehavior) {
    const panelButtons = document.querySelector(".panel_btns[data-inclusion-grid]") as HTMLElement;
    if (!panelButtons) return;

    const addButton = panelButtons.querySelector("#add_btn");
    const removeButton = panelButtons.querySelector("#remove_btn");
    const inclusionGridName = panelButtons.dataset.inclusionGrid;
    const exclusionGridName = panelButtons.dataset.exclusionGrid;
    const inclusionGrid = window.WulinMaster.gridManager.getGrid(inclusionGridName || "");
    const exclusionGrid = window.WulinMaster.gridManager.getGrid(exclusionGridName || "");

    if (!inclusionGrid || !exclusionGrid) return;

    if (this.grid.name === inclusionGridName && this.grid.getSelectedRows().length > 0) {
      addButton?.classList.add('disabled');
      removeButton?.classList.remove('disabled');
      exclusionGrid.resetActiveCell(); // remove highlight
    } else if (this.grid.name === exclusionGridName && this.grid.getSelectedRows().length > 0) {
      removeButton?.classList.add('disabled');
      addButton?.classList.remove('disabled');
      inclusionGrid.resetActiveCell(); // remove highlight
    } else if (inclusionGrid.getSelectedRows().length === 0 && exclusionGrid.getSelectedRows().length === 0) {
      addButton?.classList.add('disabled');
      removeButton?.classList.add('disabled');
    }
  }
});

BehaviorManager.register("include_exclude_trivia", IncludeExcludeTriviaBehavior);
export default IncludeExcludeTriviaBehavior;
