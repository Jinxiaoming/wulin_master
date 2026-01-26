/**
 * Detail Add Action
 * Opens a creation dialog for a detail grid and attempts to pre-fill the master association.
 */
WulinMaster.actions.DetailAdd = Object.assign({}, WulinMaster.actions.BaseAction, {
  name: 'detail_add',

  handler: function() {
    const grid = this.getGrid();
    this.grid = grid;

    window.Ui.openDialog(grid, 'wulin_master_new_form', grid.options);

    // Attempt to assign master after dialog opens
    setTimeout(() => this.assignMaster(grid), 1000);

    // Register button click events
    const submitHandler = (evt) => {
      const btn = evt.target;
      if (btn.id !== `${grid.name}_submit` && btn.id !== `${grid.name}_submit_continue`) return;

      evt.preventDefault();
      const continueOn = btn.id === `${grid.name}_submit_continue`;
      window.Requests.createByAjax(grid, continueOn);
    };

    document.body.removeEventListener('click', submitHandler);
    document.body.addEventListener('click', submitHandler);
  },

  /**
   * Logic to pre-fill the master association in the creation form.
   */
  assignMaster: function(grid) {
    // TODO: Implementation for pre-filling master ID
    // 1. Find the master grid and the selected record in master grid
    // 2. In the create dialog, find the master id dropdown
    // 3. Set the dropdown value as the selected record in master grid, and disable it
  }
});

WulinMaster.ActionManager.register(WulinMaster.actions.DetailAdd);
