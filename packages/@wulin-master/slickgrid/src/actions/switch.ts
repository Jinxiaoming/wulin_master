import { GridAction } from '@wulin-master/core';
import { BaseAction, ActionManager } from '../action_manager';

/**
 * Switch Screen Action
 * Navigates to a different screen using Turbo Drive.
 */
const SwitchAction: GridAction = Object.assign({}, BaseAction, {
  name: "switch",

  handler: function (this: GridAction) {
    if (!this.switch_to) return;
    
    const url = `${this.switch_to.path}?screen=${this.switch_to.screen}`;
    
    // Use Turbo for modern navigation
    if (window.WulinMaster.Turbo) {
      window.WulinMaster.Turbo.visit(url);
    } else {
      window.location.href = url;
    }
  },
});

ActionManager.register(SwitchAction);
export default SwitchAction;
