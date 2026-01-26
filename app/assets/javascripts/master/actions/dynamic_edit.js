/**
 * Dynamic Edit Action
 * Triggers a batch update with a specific version.
 */
WulinMaster.actions.DynamicEdit = Object.assign({}, WulinMaster.actions.BaseAction, {
  name: 'dynamic_edit',
  triggerElementIdentifier: '.dynamic_toolbar',

  handler: function(e) {
    const grid = this.getGrid();
    const btn = e.currentTarget;
    const version = btn.dataset.version;

    // Use the modernized batch update from Edit action
    if (WulinMaster.actions.Edit?.batchUpdateByAjax) {
      WulinMaster.actions.Edit.batchUpdateByAjax(grid, version);
    }
    return false;
  }
});

WulinMaster.ActionManager.register(WulinMaster.actions.DynamicEdit);
