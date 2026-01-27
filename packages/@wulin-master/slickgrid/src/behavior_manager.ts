import { WulinGrid, GridBehavior } from '@wulin-master/core';

/**
 * BehaviorManager handles the registration and dispatching of grid behaviors.
 */
export const BehaviorManager = (() => {
  const behaviors: Record<string, GridBehavior> = {};

  return {
    /**
     * Registers a new behavior.
     */
    register: function(name: string, obj: GridBehavior) {
      behaviors[name] = obj;
    },

    /**
     * Unregisters an existing behavior.
     */
    unregister: function(name: string) {
      delete behaviors[name];
    },

    /**
     * Retrieves a behavior by name, returning a fresh copy.
     */
    getBehavior: function(name: string): GridBehavior | null {
      const proto = behaviors[name];
      return proto ? Object.assign({}, proto) : null;
    },

    /**
     * Dispatches behaviors to a target (usually a grid).
     */
    dispatchBehaviors: function(target: WulinGrid, configs: any[]) {
      if (!configs) return;
      for (let i = 0; i < configs.length; i++) {
        const behavior = this.getBehavior(configs[i].name);
        if (behavior) {
          Object.assign(behavior, configs[i]);
          behavior.subscribe(target);
        }
      }
    }
  };
})();

/**
 * BaseBehavior provides the interface for all grid behaviors.
 */
export const BaseBehavior: GridBehavior = {
  name: 'base',
  subscribe: () => {},
  unsubscribe: () => {}
};

// Global exposure for legacy compatibility
(window as any).WulinMaster = (window as any).WulinMaster || {};
(window as any).WulinMaster.BehaviorManager = BehaviorManager;
(window as any).WulinMaster.behaviors = (window as any).WulinMaster.behaviors || {};
(window as any).WulinMaster.behaviors.BaseBehavior = BaseBehavior;
