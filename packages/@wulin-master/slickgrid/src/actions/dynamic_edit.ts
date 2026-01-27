import { GridAction } from '@wulin-master/core';
import { BaseAction, ActionManager } from '../action_manager';
import EditAction from './edit';

/**
 * Dynamic Edit Action
 * Triggers a batch update with a specific version.
 */
const DynamicEditAction: GridAction = Object.assign({}, BaseAction, {
  name: 'dynamic_edit',
  triggerElementIdentifier: '.dynamic_toolbar',

  handler: function(this: GridAction, e: MouseEvent) {
    const grid = this.target;
    if (!grid) return;
    const btn = e.currentTarget as HTMLElement;
    const version = btn.dataset.version;

    // Use the modernized batch update from Edit action
    if ((EditAction as any).batchUpdateByAjax) {
      (EditAction as any).batchUpdateByAjax(grid, version);
    }
    return false;
  }
});

ActionManager.register(DynamicEditAction);
export default DynamicEditAction;
