import { WulinGrid, GridBehavior } from '@wulin-master/core';
import { BaseBehavior, BehaviorManager } from '../behavior_manager';

// When close the filter panel, clear the grid filters filtered by user (don't clear the default filter like the master filter in detail grid)
const ClearFiltersBehavior: GridBehavior = Object.assign({}, BaseBehavior, {
  name: 'clear_filters',
  event: "onFilterPanelClosed",

  subscribe: function(this: GridBehavior, target: WulinGrid) {
    this.grid = target;
    if ((target as any).filterPanel) {
      (target as any).filterPanel[this.event].subscribe(() => this.handler());
    }
  },

  handler: function(this: GridBehavior) {
    const grid = this.grid;
    const headerRow = grid.getHeaderRow();
    const fulledInputs = headerRow.querySelectorAll('input[value]:not([value=""])');
    
    if (fulledInputs.length > 0) {
      const master = (grid as any).master;
      // if the grid has no master grid, simply clear all filters, otherwise keep the master grid related filters
      if (!master) {
        grid.loader.setFilter([]);
      } else {
        grid.loader.setFilterWithoutRefresh([]);
        if (Array.isArray(master)) {
          grid.loader.addFilters(master);
        } else {
          grid.loader.addFilter(master.filter_column, master.filter_value, master.filter_operator);
        }
      }
    }

    grid.resetActiveCell();
  }
});

BehaviorManager.register("clear_filters", ClearFiltersBehavior);
export default ClearFiltersBehavior;
