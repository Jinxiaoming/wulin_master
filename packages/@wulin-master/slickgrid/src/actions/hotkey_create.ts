import { GridAction } from '@wulin-master/core';
import { BaseAction, ActionManager } from '../action_manager';

/**
 * Hotkey 'C' to create record
 */
const HotkeyCreateAction: GridAction = Object.assign({}, BaseAction, {
  name: 'hotkey_create',
  event: 'keypress',
  triggerElementIdentifier: '.grid_container',

  handler: function(this: GridAction, e: KeyboardEvent) {
    if (window.WulinMaster.Ui.addOrDeleteLocked()) return true;

    const grid = window.WulinMaster.Ui.findCurrentGrid();
    if (grid && (e.key === 'c' || e.key === 'C')) {
      window.WulinMaster.Ui.openDialog(grid, 'wulin_master_new_form', grid.options);

      const submitHandler = (evt: MouseEvent) => {
        const btn = evt.target as HTMLElement;
        if (!btn || (btn.id !== `${grid.name}_submit` && btn.id !== `${grid.name}_submit_continue`)) return;

        evt.preventDefault();
        const continueOn = btn.id === `${grid.name}_submit_continue`;
        window.WulinMaster.Requests.createByAjax(grid, continueOn);
      };

      document.body.removeEventListener('click', submitHandler as any);
      document.body.addEventListener('click', submitHandler as any);
    }
  }
});

ActionManager.register(HotkeyCreateAction);
export default HotkeyCreateAction;
