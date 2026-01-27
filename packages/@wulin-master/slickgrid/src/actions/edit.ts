import { WulinGrid, GridAction } from '@wulin-master/core';
import { BaseAction, ActionManager } from '../action_manager';

// Toolbar Item: 'Edit'
const EditAction: GridAction = Object.assign({}, BaseAction, {
  name: 'edit',

  handler: function (this: GridAction) {
    const grid = this.target;
    if (!grid) return;
    this.batchUpdateByAjax(grid);
    return false;
  },

  /**
   * Opens the edit form and initializes batch update logic.
   */
  batchUpdateByAjax: function (this: GridAction, grid: WulinGrid, version?: string) {
    const selectedIndexes = grid.getSelectedRows();
    const name = grid.name;

    if (!selectedIndexes || selectedIndexes.length === 0) {
      window.WulinMaster.displayErrorMessage('Please select a record', 'Selection Error');
      return;
    }

    const ids = (grid as any).getSelectedIds();
    if (ids.length > 350) {
      window.WulinMaster.displayErrorMessage('You selected too many rows, please select less than 350 rows.', 'Selection Error');
      return;
    }

    let url = `${grid.path}/wulin_master_edit_form${grid.query}`;
    if (version) url += `&update_version=${version}`;

    fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then(response => response.text())
      .then(html => {
        window.WulinMaster.Ui.createModelModal(grid, html, {
          dismissible: false,
          onOpenEnd: (modal: HTMLElement) => {
            window.WulinMaster.Ui.setupForm(grid, true, selectedIndexes);
            window.WulinMaster.Ui.setupComponents(grid);
            this.showFlagCheckBox(modal, ids);
            this.checkTheBox(name, modal);
            this.submitForm(grid, ids, selectedIndexes, modal);
            (grid as any).onOpenEditModalEnd.notify({ modal });
          },
          onCloseStart: () => {
            document.querySelectorAll(".note-popover").forEach(el => el.remove());
          }
        });
      });
  },

  /**
   * Shows/hides update flags based on selection count.
   */
  showFlagCheckBox: function (scope: HTMLElement, ids: any[]) {
    const container = scope.querySelectorAll('.target_flag_container');
    container.forEach((el: any) => el.style.display = ids.length > 1 ? 'block' : 'none');
  },

  /**
   * Binds events to automatically check the "update" flag when a field is modified.
   */
  checkTheBox: function (name: string, modal: HTMLElement) {
    const form = modal.querySelector('form');
    if (!form) return;

    const markAsChanged = (e: any) => {
      const targetId = e.target.dataset.targetId;
      if (!targetId) return;
      const flag = form.querySelector(`input.target_flag:checkbox[data-target-id="${targetId}"]`) as HTMLInputElement;
      if (flag) flag.checked = true;
    };

    form.addEventListener('keyup', (e: any) => {
      if (e.target.matches('input:not([type="checkbox"]), textarea')) markAsChanged(e);
    });

    form.addEventListener('change', (e: any) => {
      if (e.target.matches('input:not(.target_flag), select, textarea')) markAsChanged(e);
    });

    // Handle flag unchecking
    form.addEventListener('change', (e: any) => {
      if (e.target.classList.contains('target_flag') && !e.target.checked) {
        const targetId = e.target.dataset.targetId;
        const inputs = form.querySelectorAll(`[data-target-id="${targetId}"]:not(.target_flag)`);
        inputs.forEach((input: any) => {
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
  submitForm: function (this: GridAction, grid: WulinGrid, ids: any[], selectedIndexes: number[], modal: HTMLElement) {
    const form = modal.querySelector('form');
    const submitBtn = modal.querySelector('.update_btn') as HTMLButtonElement;
    if (!submitBtn || !form) return;

    submitBtn.onclick = (e) => {
      e.preventDefault();
      
      const gridParams = Object.fromEntries(grid.loader.getParams());
      const formData = new FormData(form as HTMLFormElement);
      
      submitBtn.disabled = true;
      const url = `${grid.path}/${ids.join(',')}.json${grid.query}`;
      
      // Construct body with gridParams
      const bodyObj: any = { 
        _method: 'PUT', 
        gridParams: gridParams,
        authenticity_token: decodeURIComponent(window._token || '')
      };
      
      // Add form data to bodyObj
      for (let [key, value] of formData.entries()) {
        // Only include if flagged or if it's a single record update
        const input = form.querySelector(`[name="${key}"]`) as HTMLElement;
        const targetId = input?.dataset.targetId;
        if (ids.length === 1 || !targetId || (form.querySelector(`input.target_flag:checkbox[data-target-id="${targetId}"]`) as HTMLInputElement)?.checked) {
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
          window.WulinMaster.Ui.resetForm(grid.name);
          grid.loader.reloadData();
          if (((grid as any).reloadMasterAfterUpdates || grid.options.reloadMasterAfterUpdates) && (grid as any).master_grid) {
            (grid as any).master_grid.loader.reloadData();
          }
          const count = selectedIndexes.length;
          const message = count > 1 ? `${count} ${grid.model.toLowerCase()}s updated` : `1 ${grid.model.toLowerCase()} updated`;
          window.WulinMaster.displayNewNotification(message, 'success');
          window.WulinMaster.M.Modal.getInstance(modal).close();
        } else {
          window.WulinMaster.displayErrorMessage(msg.error_message || 'Update failed', 'Error');
          grid.loader.reloadData();
        }
      })
      .catch(err => {
        console.error('Update error:', err);
        window.WulinMaster.displayErrorMessage('An error occurred during update.', 'Network Error');
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
(window as any).fillValues = function (scope: HTMLElement, grid: WulinGrid, selectedIndexes: number[]) {
  const container = scope;
  if (!container) return;

  let data: any = {};
  if (selectedIndexes.length === 1) {
    data = grid.loader.data[selectedIndexes[0]];
    const cols = (grid.options as any)["needDuplicateColumns"];
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

  (window as any).loadValue(container, data);

  // Activate labels for fields with values
  container.querySelectorAll('.field').forEach(field => {
    if ((field.querySelector('input') as HTMLInputElement)?.value) {
      field.querySelector('label')?.classList.add('active');
    }
  });
};

/**
 * Loads values into form inputs.
 */
(window as any).loadValue = function (scope: HTMLElement, data: any) {
  for (let i in data) {
    const value = data[i];
    const inputs = scope.querySelectorAll(`[data-field="${i}"]`);
    
    inputs.forEach((input: any) => {
      if (input.tagName === 'SELECT') {
        const val = (typeof value === 'object' && value !== null) ? value.id : value;
        input.value = Array.isArray(val) ? val : [val].flat();
        input.dispatchEvent(new Event('change'));
        input.nextElementSibling?.classList.add('active');
      } else if (input.type === 'checkbox') {
        input.checked = !!value;
      } else {
        input.value = value || '';
        input.labels?.forEach((l: HTMLElement) => l.classList.toggle('active', !!value));
      }
    });
  }
};

ActionManager.register(EditAction);
export default EditAction;
