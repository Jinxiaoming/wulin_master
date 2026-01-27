import { GridAction } from '@wulin-master/core';
import { BaseAction, ActionManager } from '../action_manager';

/**
 * Hotkey 'D' to delete record
 */
const HotkeyDeleteAction: GridAction = Object.assign({}, BaseAction, {
  name: 'hotkey_delete',
  event: 'keypress',
  triggerElementIdentifier: '.grid_container',

  handler: function(this: GridAction, e: KeyboardEvent) {
    if (window.WulinMaster.Ui.addOrDeleteLocked()) return true;

    const grid = window.WulinMaster.Ui.findCurrentGrid();
    if (grid && (e.key === 'd' || e.key === 'D')) {
      const ids = (grid as any).getSelectedIds();
      if (ids && ids.length > 0) {
        this.deleteGridRecords(grid, ids);
        return false;
      } else {
        window.WulinMaster.displayErrorMessage("Please select a record.", "Selection Error");
      }
    }
  }
});

ActionManager.register(HotkeyDeleteAction);
export default HotkeyDeleteAction;
