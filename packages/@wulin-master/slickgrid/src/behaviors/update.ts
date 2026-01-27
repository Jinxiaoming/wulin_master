import { WulinGrid, GridBehavior } from '@wulin-master/core';
import { BaseBehavior, BehaviorManager } from '../behavior_manager';
import Requests from '../grid_requests';

// cell update events
const UpdateBehavior: GridBehavior = Object.assign({}, BaseBehavior, {
  name: 'update',
  event: "onCellChange",

  subscribe: function(this: GridBehavior, target: WulinGrid) {
    this.grid = target;
    const self = this;
    (target as any)[this.event].subscribe((e: any, args: any) => { 
      self.handler(args); 
    });
  },

  handler: function(this: GridBehavior, args: any) {
    // send update request
    Requests.updateByAjax(this.grid, args.item);
  }
});

BehaviorManager.register("update", UpdateBehavior);
export default UpdateBehavior;
