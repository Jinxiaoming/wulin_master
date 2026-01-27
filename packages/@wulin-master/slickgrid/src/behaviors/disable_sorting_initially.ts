import { WulinGrid, GridBehavior } from '@wulin-master/core';
import { BaseBehavior, BehaviorManager } from '../behavior_manager';

// Disable sorting after grid rendered for some cases (eg: eagerLoading is false)
const DisableSortingInitiallyBehavior: GridBehavior = Object.assign({}, BaseBehavior, {
  name: 'disable_sorting_initially',
  event: "onRendered",

  subscribe: function(this: GridBehavior, target: WulinGrid) {
    this.grid = target;
    const self = this;
    (target as any)[this.event].subscribe(() => { self.handler(); });
  },

  handler: function(this: GridBehavior) {
    const columns = this.grid.getColumns();
    for(const i in columns) {
      // remember the column which is initially unsortable
      if((columns[i] as any)['sortable'] === false) {
        (columns[i] as any)['origin_sortable'] = false;
      }
      (columns[i] as any)['sortable'] = false;
    }
  }
});

BehaviorManager.register("disable_sorting_initially", DisableSortingInitiallyBehavior);
export default DisableSortingInitiallyBehavior;
