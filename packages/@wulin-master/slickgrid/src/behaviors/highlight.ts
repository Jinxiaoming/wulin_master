import { WulinGrid, GridBehavior } from '@wulin-master/core';
import { BaseBehavior, BehaviorManager } from '../behavior_manager';

// highlight the selected rows
const HighlightBehavior: GridBehavior = Object.assign({}, BaseBehavior, {
  name: 'highlight',
  event: "onDataLoaded",

  subscribe: function(this: GridBehavior, target: WulinGrid) {
    this.grid = target;
    const self = this;
    (target.loader as any)[this.event].subscribe(() => { self.handler(); });
  },

  handler: function(this: GridBehavior) {
    const grid = this.grid;
    const data = grid.getData();
    const selectedIndexes: number[] = [];
    
    for (const i in data) {
      const item = data[i];
      if (item && (grid as any).operatedIds && (grid as any).operatedIds.indexOf(item.id) !== -1) {
        selectedIndexes.push(item.slick_index);
      }
    }
    // highlight selected rows, at this moment, the onSelectedRowsChanged event will be triggered
    grid.setSelectedRows(selectedIndexes);
  }
});

BehaviorManager.register("highlight", HighlightBehavior);
export default HighlightBehavior;
