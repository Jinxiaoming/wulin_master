/**
 * Switch Screen Action
 * Navigates to a different screen using Turbo Drive.
 */
WulinMaster.actions.Switch = Object.assign({}, WulinMaster.actions.BaseAction, {
  name: "switch",

  handler: function () {
    if (!this.switch_to) return;
    
    const url = `${this.switch_to.path}?screen=${this.switch_to.screen}`;
    
    // Use Turbo for modern navigation
    if (window.Turbo) {
      window.Turbo.visit(url);
    } else {
      window.location.href = url;
    }
  },
});

WulinMaster.ActionManager.register(WulinMaster.actions.Switch);
