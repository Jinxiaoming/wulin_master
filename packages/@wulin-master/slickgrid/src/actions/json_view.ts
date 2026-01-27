import { GridAction } from '@wulin-master/core';
import { BaseAction, ActionManager } from '../action_manager';

/**
 * JSON View Action
 * Displays the JSON content of a 'jsonb' column in a modal.
 */
const JsonViewAction: GridAction = Object.assign({}, BaseAction, {
  name: 'json_view',

  handler: function(this: GridAction) {
    const grid = this.target;
    if (!grid) return;
    const selectedRows = grid.getSelectedRows();

    if (selectedRows.length === 1) {
      const columns = grid.getColumns();
      const currentData = grid.getData()[selectedRows[0]];
      let jsonData = null;

      const jsonColumn = columns.find((col: any) => col.type === 'jsonb');
      if (jsonColumn) {
        const rawValue = (currentData as any)[(jsonColumn as any).column_name];
        try {
          jsonData = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
        } catch (e) {
          console.error("Error parsing JSON:", e);
        }
      }

      if (jsonData) {
        window.WulinMaster.Ui.createJsonViewModal(jsonData);
      } else {
        window.WulinMaster.displayErrorMessage('No JSON data found in this record.', 'View Error');
      }
    } else {
      window.WulinMaster.displayErrorMessage('Please select exactly one record.', 'Selection Error');
    }
  }
});

ActionManager.register(JsonViewAction);
export default JsonViewAction;
