import { WulinGrid, GridBehavior } from '@wulin-master/core';
import { BaseBehavior, BehaviorManager } from '../behavior_manager';

// Enable columns sorting after data loaded
const EnableSortingAfterLoadingBehavior: GridBehavior = Object.assign({}, BaseBehavior, {
  name: 'enable_sorting_after_loading',
  event: "onDataLoaded",

  subscribe: function(this: GridBehavior, target: WulinGrid) {
    this.grid = target;
    const self = this;
    (target.loader as any)[this.event].subscribe(() => { self.handler(); });
  },

  handler: function(this: GridBehavior) {
    const columns = this.grid.getColumns();
    for(const i in columns) {
      if((columns[i] as any)['origin_sortable'] === false) continue;
      (columns[i] as any)['sortable'] = true;
    }
  }
});

BehaviorManager.register("enable_sorting_after_loading", EnableSortingAfterLoadingBehavior);
export default EnableSortingAfterLoadingBehavior;
