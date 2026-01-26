/**
 * BehaviorManager handles the registration and dispatching of grid behaviors.
 */
const BehaviorManager = (() => {
  const behaviors = {};

  return {
    /**
     * Registers a new behavior.
     */
    register: function(name, obj) {
      behaviors[name] = obj;
    },

    /**
     * Unregisters an existing behavior.
     */
    unregister: function(name) {
      delete behaviors[name];
    },

    /**
     * Retrieves a behavior by name, returning a fresh copy.
     */
    getBehavior: function(name) {
      const proto = behaviors[name];
      return proto ? Object.assign({}, proto) : null;
    },

    /**
     * Dispatches behaviors to a target (usually a grid).
     */
    dispatchBehaviors: function(target, configs) {
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
const BaseBehavior = {
  _isBehavior: true,
  subscribe: () => {},
  unsubscribe: () => {}
};

// Global exposure for legacy compatibility
window.WulinMaster = window.WulinMaster || {};
window.WulinMaster.BehaviorManager = BehaviorManager;
window.WulinMaster.behaviors = window.WulinMaster.behaviors || {};
window.WulinMaster.behaviors.BaseBehavior = BaseBehavior;

export { BehaviorManager, BaseBehavior };
