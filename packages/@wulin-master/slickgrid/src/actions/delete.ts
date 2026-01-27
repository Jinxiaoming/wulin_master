import { WulinGrid, GridAction } from '@wulin-master/core';
import { BaseAction, ActionManager } from '../action_manager';

// Toolbar Item 'Delete'
const DeleteAction: GridAction = Object.assign({}, BaseAction, {
  name: 'delete',

  handler: function(this: GridAction) {
    const grid = this.target;
    if (!grid) return;
    
    const ids = (grid as any).getSelectedIds();

    if (ids && ids.length > 0) {
      this.deleteGridRecords(grid, ids);
      return false;
    } else {
      window.WulinMaster.displayErrorMessage("Please select a record.", "Selection Error");
    }
  }
});

ActionManager.register(DeleteAction);
export default DeleteAction;
