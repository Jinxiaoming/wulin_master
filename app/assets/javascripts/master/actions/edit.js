// Toolbar Item: 'Edit'
WulinMaster.actions.Edit = Object.assign({}, WulinMaster.actions.BaseAction, {
  name: 'edit',

  handler: function () {
    const grid = this.getGrid();
    this.batchUpdateByAjax(grid);
    return false;
  },

  /**
   * Opens the edit form and initializes batch update logic.
   */
  batchUpdateByAjax: function (grid, version) {
    const selectedIndexes = grid.getSelectedRows();
    const name = grid.name;

    if (!selectedIndexes || selectedIndexes.length === 0) {
      window.displayErrorMessage('Please select a record', 'Selection Error');
      return;
    }

    const ids = grid.getSelectedIds();
    if (ids.length > 350) {
      window.displayErrorMessage('You selected too many rows, please select less than 350 rows.', 'Selection Error');
      return;
    }

    let url = `${grid.path}/wulin_master_edit_form${grid.query}`;
    if (version) url += `&update_version=${version}`;

    fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then(response => response.text())
      .then(html => {
        window.Ui.createModelModal(grid, html, {
          dismissible: false,
          onOpenEnd: (modal) => {
            window.Ui.setupForm(grid, true, selectedIndexes);
            window.Ui.setupComponents(grid);
            this.showFlagCheckBox(modal, ids);
            this.checkTheBox(name, modal);
            this.submitForm(grid, ids, selectedIndexes, modal);
            grid.onOpenEditModalEnd.notify({ modal });
          },
          onCloseStart: (modal) => {
            if (typeof jQuery !== 'undefined' && jQuery.fn.materialnote) {
              $(modal).find(".materialnote").materialnote('destroy');
            }
            document.querySelectorAll(".note-popover").forEach(el => el.remove());
          }
        });
      });
  },

  /**
   * Shows/hides update flags based on selection count.
   */
  showFlagCheckBox: function (scope, ids) {
    const container = scope.querySelectorAll('.target_flag_container');
    container.forEach(el => el.style.display = ids.length > 1 ? 'block' : 'none');
  },

  /**
   * Binds events to automatically check the "update" flag when a field is modified.
   */
  checkTheBox: function (name, modal) {
    const form = modal.querySelector('form');
    if (!form) return;

    const markAsChanged = (e) => {
      const targetId = e.target.dataset.targetId;
      if (!targetId) return;
      const flag = form.querySelector(`input.target_flag:checkbox[data-target-id="${targetId}"]`);
      if (flag) flag.checked = true;
    };

    form.addEventListener('keyup', (e) => {
      if (e.target.matches('input:not([type="checkbox"]), textarea')) markAsChanged(e);
    });

    form.addEventListener('change', (e) => {
      if (e.target.matches('input:not(.target_flag), select, textarea')) markAsChanged(e);
    });

    // Handle flag unchecking
    form.addEventListener('change', (e) => {
      if (e.target.classList.contains('target_flag') && !e.target.checked) {
        const targetId = e.target.dataset.targetId;
        const inputs = form.querySelectorAll(`[data-target-id="${targetId}"]:not(.target_flag)`);
        inputs.forEach(input => {
          if (['button', 'submit', 'reset', 'hidden'].includes(input.type)) return;
          input.value = '';
          if (input.type === 'checkbox' || input.type === 'radio') input.checked = false;
          input.dispatchEvent(new Event('change'));
        });
      }
    });
  },

  /**
   * Handles form submission for batch updates.
   */
  submitForm: function (grid, ids, selectedIndexes, modal) {
    const form = modal.querySelector('form');
    const submitBtn = modal.querySelector('.update_btn');
    if (!submitBtn || !form) return;

    submitBtn.onclick = (e) => {
      e.preventDefault();
      
      const gridParams = Object.fromEntries(grid.loader.getParams());
      const formData = new FormData(form);
      
      // Filter out fields that aren't flagged for update (in batch mode)
      if (ids.length > 1) {
        const flaggedIds = Array.from(form.querySelectorAll('input.target_flag:checked')).map(f => f.dataset.targetId);
        // This is tricky with FormData, we might need to manually construct the body
        // or remove unflagged fields from FormData if possible.
        // For now, let's assume the backend handles it or we use a plain object.
      }

      submitBtn.disabled = true;
      const url = `${grid.path}/${ids.join(',')}.json${grid.query}`;
      
      // Construct body with gridParams
      const bodyObj = { 
        _method: 'PUT', 
        gridParams: gridParams,
        authenticity_token: decodeURIComponent(window._token || '')
      };
      
      // Add form data to bodyObj
      for (let [key, value] of formData.entries()) {
        // Only include if flagged or if it's a single record update
        const input = form.querySelector(`[name="${key}"]`);
        const targetId = input?.dataset.targetId;
        if (ids.length === 1 || !targetId || form.querySelector(`input.target_flag:checkbox[data-target-id="${targetId}"]`)?.checked) {
          bodyObj[key] = value;
        }
      }

      fetch(url, {
        method: 'POST', // Rails uses _method: 'PUT' in body
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': decodeURIComponent(window._token || ''),
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(bodyObj)
      })
      .then(r => r.json())
      .then(msg => {
        if (msg.success) {
          window.Ui.resetForm(grid.name);
          grid.loader.reloadData();
          if ((grid.reloadMasterAfterUpdates || grid.options.reloadMasterAfterUpdates) && grid.master_grid) {
            grid.master_grid.loader.reloadData();
          }
          const count = selectedIndexes.length;
          const message = count > 1 ? `${count} ${grid.model.toLowerCase()}s updated` : `1 ${grid.model.toLowerCase()} updated`;
          window.displayNewNotification(message, 'success');
          window.M.Modal.getInstance(modal).close();
        } else {
          window.displayErrorMessage(msg.error_message || 'Update failed', 'Error');
          grid.loader.reloadData();
        }
      })
      .catch(err => {
        console.error('Update error:', err);
        window.displayErrorMessage('An error occurred during update.', 'Network Error');
      })
      .finally(() => {
        submitBtn.disabled = false;
      });
    };
  }
});

/**
 * Fills form values from grid data.
 */
window.fillValues = function (scope, grid, selectedIndexes) {
  const container = scope instanceof jQuery ? scope[0] : scope;
  if (!container) return;

  let data = {};
  if (selectedIndexes.length === 1) {
    data = grid.loader.data[selectedIndexes[0]];
    const cols = grid.options["needDuplicateColumns"];
    if (cols && cols.length > 0) {
      data = Object.fromEntries(Object.entries(data).filter(([key]) => cols.includes(key)));
    }
  } else {
    // Find common values for batch update
    const dataArr = selectedIndexes.map(i => grid.loader.data[i]);
    if (dataArr.length > 0) {
      const first = dataArr[0];
      for (let k in first) {
        if (k === 'id' || k === 'slick_index') continue;
        const val = first[k];
        const allMatch = dataArr.every(d => {
          if (typeof val === 'object' && val !== null) {
            return JSON.stringify(val) === JSON.stringify(d[k]);
          }
          return d[k] === val;
        });
        if (allMatch) data[k] = val;
      }
    }
  }

  window.loadValue(container, data);

  // Activate labels for fields with values
  container.querySelectorAll('.field').forEach(field => {
    if (field.querySelector('input')?.value) {
      field.querySelector('label')?.classList.add('active');
    }
  });
};

/**
 * Loads values into form inputs.
 */
window.loadValue = function (scope, data) {
  for (let i in data) {
    const value = data[i];
    const inputs = scope.querySelectorAll(`[data-field="${i}"]`);
    
    inputs.forEach(input => {
      if (input.tagName === 'SELECT') {
        const val = (typeof value === 'object' && value !== null) ? value.id : value;
        input.value = Array.isArray(val) ? val : [val].flat();
        input.dispatchEvent(new Event('change'));
        input.nextElementSibling?.classList.add('active');
      } else if (input.type === 'checkbox') {
        input.checked = !!value;
      } else {
        input.value = value || '';
        input.labels?.forEach(l => l.classList.toggle('active', !!value));
        
        // Handle materialnote (legacy)
        if (input.classList.contains('materialnote') && typeof jQuery !== 'undefined' && jQuery.fn.materialnote) {
          $(input).materialnote('code', value);
        }
      }
    });
  }
};

WulinMaster.ActionManager.register(WulinMaster.actions.Edit);
