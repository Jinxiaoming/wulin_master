import { WulinGrid, GridBehavior } from '@wulin-master/core';
import { BaseBehavior, BehaviorManager } from '../behavior_manager';

// push selected IDs to operatedIds when selected row changed
const GetOperateIdsBehavior: GridBehavior = Object.assign({}, BaseBehavior, {
  name: 'get_operate_ids',
  event: "onSelectedRowsChanged",

  subscribe: function(this: GridBehavior, target: WulinGrid) {
    this.grid = target;
    const self = this;
    (target as any)[this.event].subscribe(() => { self.handler(); });
  },

  handler: function(this: GridBehavior) {
    (this.grid as any).operatedIds = (this.grid as any).getSelectedIds();
  }
});

BehaviorManager.register("get_operate_ids", GetOperateIdsBehavior);
export default GetOperateIdsBehavior;
