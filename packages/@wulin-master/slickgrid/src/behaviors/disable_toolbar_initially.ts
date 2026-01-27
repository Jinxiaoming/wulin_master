import { WulinGrid, GridBehavior } from '@wulin-master/core';
import { BaseBehavior, BehaviorManager } from '../behavior_manager';

// Disable toolbar items after grid rendered for some cases (eg: eagerLoading is false)
const DisableToolbarInitiallyBehavior: GridBehavior = Object.assign({}, BaseBehavior, {
  name: 'disable_toolbar_initially',
  event: "onRendered",

  subscribe: function(this: GridBehavior, target: WulinGrid) {
    this.grid = target;
    const self = this;
    (target as any)[this.event].subscribe(() => { self.handler(); });
  },

  handler: function(this: GridBehavior) {
    const toolbarItems = this.grid.container.querySelectorAll(".toolbar_item a:not(.switch_action)");
    toolbarItems.forEach(el => el.classList.add("toolbar_icon_disabled"));
  }
});

BehaviorManager.register("disable_toolbar_initially", DisableToolbarInitiallyBehavior);
export default DisableToolbarInitiallyBehavior;
