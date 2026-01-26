/**
 * Hotkey 'C' to create record
 */
WulinMaster.actions.HotkeyCreate = Object.assign({}, WulinMaster.actions.BaseAction, {
  name: 'hotkey_create',
  event: 'keypress',
  triggerElementIdentifier: '.grid_container',

  handler: function(e) {
    if (window.Ui.addOrDeleteLocked()) return true;

    const grid = window.Ui.findCurrentGrid();
    if (grid && (e.key === 'c' || e.key === 'C')) {
      window.Ui.openDialog(grid, 'wulin_master_new_form', grid.options);

      const submitHandler = (evt) => {
        const btn = evt.target;
        if (btn.id !== `${grid.name}_submit` && btn.id !== `${grid.name}_submit_continue`) return;

        evt.preventDefault();
        const continueOn = btn.id === `${grid.name}_submit_continue`;
        window.Requests.createByAjax(grid, continueOn);
      };

      document.body.removeEventListener('click', submitHandler);
      document.body.addEventListener('click', submitHandler);
    }
  }
});

// WulinMaster.ActionManager.register(WulinMaster.actions.HotkeyCreate);
