import { WulinGrid, GridBehavior } from '@wulin-master/core';
import { BaseBehavior, BehaviorManager } from '../behavior_manager';

// when editor validate return false
const ValidateBehavior: GridBehavior = Object.assign({}, BaseBehavior, {
  name: 'validate',
  event: "onValidationError",

  subscribe: function(this: GridBehavior, target: WulinGrid) {
    const self = this;
    (target as any)[this.event].subscribe((e: any, args: any) => { 
      self.handler(args.validationResults); 
    });
  },

  handler: function(result: any) {
    if (result.msg) window.WulinMaster.displayErrorMessage(result.msg);
  }
});

BehaviorManager.register("validate", ValidateBehavior);
export default ValidateBehavior;
