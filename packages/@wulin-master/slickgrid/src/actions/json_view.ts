/**
 * JSON View Action
 * Displays the JSON content of a 'jsonb' column in a modal.
 */
WulinMaster.actions.JsonView = Object.assign({}, WulinMaster.actions.BaseAction, {
  name: 'json_view',

  handler: function() {
    const grid = this.getGrid();
    const selectedRows = grid.getSelectedRows();

    if (selectedRows.length === 1) {
      const columns = grid.getColumns();
      const currentData = grid.getData()[selectedRows[0]];
      let jsonData = null;

      const jsonColumn = columns.find(col => col.type === 'jsonb');
      if (jsonColumn) {
        const rawValue = currentData[jsonColumn.column_name];
        try {
          jsonData = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
        } catch (e) {
          console.error("Error parsing JSON:", e);
        }
      }

      if (jsonData) {
        window.Ui.createJsonViewModal(jsonData);
      } else {
        window.displayErrorMessage('No JSON data found in this record.', 'View Error');
      }
    } else {
      window.displayErrorMessage('Please select exactly one record.', 'Selection Error');
    }
  }
});

WulinMaster.ActionManager.register(WulinMaster.actions.JsonView);
