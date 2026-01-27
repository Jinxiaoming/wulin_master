import { WulinGrid, GridAction } from '@wulin-master/core';
import { BaseAction, ActionManager } from '../action_manager';

/**
 * Detail Add Action
 * Opens a creation dialog for a detail grid and attempts to pre-fill the master association.
 */
const DetailAddAction: GridAction = Object.assign({}, BaseAction, {
  name: 'detail_add',

  handler: function(this: GridAction) {
    const grid = this.target;
    if (!grid) return;

    window.WulinMaster.Ui.openDialog(grid, 'wulin_master_new_form', grid.options);

    // Attempt to assign master after dialog opens
    setTimeout(() => this.assignMaster(grid), 1000);

    // Register button click events
    const submitHandler = (evt: MouseEvent) => {
      const btn = evt.target as HTMLElement;
      if (!btn || (btn.id !== `${grid.name}_submit` && btn.id !== `${grid.name}_submit_continue`)) return;

      evt.preventDefault();
      const continueOn = btn.id === `${grid.name}_submit_continue`;
      window.WulinMaster.Requests.createByAjax(grid, continueOn);
    };

    document.body.removeEventListener('click', submitHandler as any);
    document.body.addEventListener('click', submitHandler as any);
  },

  /**
   * Logic to pre-fill the master association in the creation form.
   */
  assignMaster: function(this: GridAction, grid: WulinGrid) {
    // TODO: Implementation for pre-filling master ID
    // 1. Find the master grid and the selected record in master grid
    // 2. In the create dialog, find the master id dropdown
    // 3. Set the dropdown value as the selected record in master grid, and disable it
  }
});

ActionManager.register(DetailAddAction);
export default DetailAddAction;
