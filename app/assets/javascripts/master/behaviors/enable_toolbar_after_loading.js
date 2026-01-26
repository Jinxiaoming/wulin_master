// Enable toolbar items after data loaded

WulinMaster.behaviors.enableToolbarAfterLoading = Object.assign({}, WulinMaster.behaviors.BaseBehavior, {
  event: "onDataLoaded",

  subscribe: function(target) {
    this.grid = target;
    target.loader[this.event].subscribe(() => this.handler());
  },

  unsubscribe: function() {},

  handler: function() {
    const toolbarItems = this.grid.container.querySelectorAll(".toolbar_item a");
    toolbarItems.forEach(item => {
      if (!item.classList.contains('toolbar_manually_enable')) {
        item.classList.remove("toolbar_icon_disabled");
      }
    });
  }
});

WulinMaster.BehaviorManager.register("enable_toolbar_after_loading", WulinMaster.behaviors.enableToolbarAfterLoading);
