import { WulinGrid, GridBehavior } from '@wulin-master/core';
import { BaseBehavior, BehaviorManager } from '../behavior_manager';

// two columns, has_many relationship
const ColumnFilterBehavior: GridBehavior = Object.assign({}, BaseBehavior, {
  name: 'column_filter',
  event: "onDataLoaded",

  subscribe: function(this: GridBehavior, target: WulinGrid) {
    const self = this;
    (target.loader as any)[this.event].subscribe(() => { self.handler(); });
  },

  handler: function() {
    // we can use this to get all context
  }
});

BehaviorManager.register("column_filter", ColumnFilterBehavior);
export default ColumnFilterBehavior;
