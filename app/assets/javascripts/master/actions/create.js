// Toolbar Item 'Create'
WulinMaster.actions.Create = Object.assign({}, WulinMaster.actions.BaseAction, {
  name: 'create',

  handler: function() {
    const self = this;
    const grid = this.getGrid();
    const hiddenColumns = this.hidden_columns;

    window.Ui.openDialog(grid, 'wulin_master_new_form', grid.options);

    // Register 'Create' button click event
    const submitHandler = (evt) => {
      const btn = evt.target;
      if (btn.id !== `${grid.name}_submit` && btn.id !== `${grid.name}_submit_continue`) return;

      evt.preventDefault();
      const form = btn.closest('form');
      if (!form) return;

      if (hiddenColumns) self.fillHiddenColumns(grid, hiddenColumns);

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
      window.Requests.createByAjax(grid, continueOn);
    };

    // Use a single listener on body for dynamic elements
    document.body.removeEventListener('click', submitHandler);
    document.body.addEventListener('click', submitHandler);
  },

  fillHiddenColumns: function(grid, hiddenColumns) {
    if (!Array.isArray(hiddenColumns)) return false;

    const currentFilters = grid.loader.getFilters();
    currentFilters.forEach(filter => {
      if (hiddenColumns.includes(filter[0])) {
        this.addHiddenColumn(filter[0], filter[1]);
      }
    });
  },

  addHiddenColumn: function(column, value) {
    const createForm = document.querySelector(".create_form form");
    if (!createForm) return;

    const model = createForm.id.replace("new_", "");
    const inputId = `${model}_${column}`;
    
    let input = document.getElementById(inputId);
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

WulinMaster.ActionManager.register(WulinMaster.actions.Create);
