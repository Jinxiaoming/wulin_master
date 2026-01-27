import { WulinGrid, GridAction } from '@wulin-master/core';
import { BaseAction, ActionManager } from '../action_manager';

// Toolbar Item 'Create'
const CreateAction: GridAction = Object.assign({}, BaseAction, {
  name: 'create',

  handler: function(this: GridAction) {
    const grid = this.target;
    if (!grid) return;
    const hiddenColumns = (this as any).hidden_columns;

    window.WulinMaster.Ui.openDialog(grid, 'wulin_master_new_form', grid.options);

    // Register 'Create' button click event
    const submitHandler = (evt: MouseEvent) => {
      const btn = evt.target as HTMLElement;
      if (!btn || (btn.id !== `${grid.name}_submit` && btn.id !== `${grid.name}_submit_continue`)) return;

      evt.preventDefault();
      const form = btn.closest('form');
      if (!form) return;

      if (hiddenColumns) this.fillHiddenColumns(grid, hiddenColumns);

      let cancel = false;
      const beforeSubmitEvent = new CustomEvent('beforesubmit.wulin', {
        detail: { 
          target: btn,
          cancel: () => { cancel = true; }
        },
        bubbles: true,
        cancelable: true
      });

      form.dispatchEvent(beforeSubmitEvent);

      if (cancel) return false;

      const continueOn = btn.id === `${grid.name}_submit_continue`;
      window.WulinMaster.Requests.createByAjax(grid, continueOn);
    };

    // Use a single listener on body for dynamic elements
    document.body.removeEventListener('click', submitHandler as any);
    document.body.addEventListener('click', submitHandler as any);
  },

  fillHiddenColumns: function(this: GridAction, grid: WulinGrid, hiddenColumns: string[]) {
    if (!Array.isArray(hiddenColumns)) return false;

    const currentFilters = grid.loader.getFilters();
    currentFilters.forEach((filter: [string, any, string]) => {
      if (hiddenColumns.includes(filter[0])) {
        this.addHiddenColumn(filter[0], filter[1]);
      }
    });
  },

  addHiddenColumn: function(column: string, value: any) {
    const createForm = document.querySelector(".create_form form");
    if (!createForm) return;

    const model = createForm.id.replace("new_", "");
    const inputId = `${model}_${column}`;
    
    let input = document.getElementById(inputId) as HTMLInputElement;
    if (!input) {
      input = document.createElement('input');
      input.id = inputId;
      input.type = 'hidden';
      input.name = `${model}[${column}]`;
      createForm.appendChild(input);
    }
    input.value = value;
  }
});

ActionManager.register(CreateAction);
export default CreateAction;
