import { WulinGrid, GridBehavior } from '@wulin-master/core';
import { BaseBehavior, BehaviorManager } from '../behavior_manager';

// Enable toolbar items after data loaded
const EnableToolbarAfterLoadingBehavior: GridBehavior = Object.assign({}, BaseBehavior, {
  name: 'enable_toolbar_after_loading',
  event: "onDataLoaded",

  subscribe: function(this: GridBehavior, target: WulinGrid) {
    this.grid = target;
    (target.loader as any)[this.event].subscribe(() => this.handler());
  },

  handler: function(this: GridBehavior) {
    const toolbarItems = this.grid.container.querySelectorAll(".toolbar_item a");
    toolbarItems.forEach(item => {
      if (!item.classList.contains('toolbar_manually_enable')) {
        item.classList.remove("toolbar_icon_disabled");
      }
    });
  }
});

BehaviorManager.register("enable_toolbar_after_loading", EnableToolbarAfterLoadingBehavior);
export default EnableToolbarAfterLoadingBehavior;
