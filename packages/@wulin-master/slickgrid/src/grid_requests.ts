import { apiClient } from '@wulin-master/core';
import Ui from './ui_helper';

/**
 * Requests module handles CRUD operations for SlickGrid.
 * Modernized to use ApiClient.
 */
const Requests = {
  /**
   * Creates a new record via Fetch API.
   */
  createByAjax: async function(grid, continueOn, afterCreated) {
    const createFormElement = document.querySelector(`div#${grid.name}_form form`);
    if (!createFormElement) return;

    const submitButton = createFormElement.querySelector("input[type='submit']");
    const formData = new FormData(createFormElement);
    
    // Clear all error messages
    createFormElement.querySelectorAll(".field_error").forEach(el => el.textContent = "");
    createFormElement.querySelectorAll("input.invalid").forEach(el => el.classList.remove('invalid'));

    if (submitButton) submitButton.disabled = true;

    const url = `${grid.path}.json`;
    
    try {
      const request = await apiClient.request(url, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
          // Content-Type is not set for FormData to let the browser set the boundary
        }
      });

      if (typeof afterCreated === "function") {
        return afterCreated(request);
      }

      if (request.success) {
        grid.resetActiveCell();
        grid.operatedIds = [request.id];
        const vp = grid.getViewport();

        grid.loader.reloadData();
        grid.loader.ensureData(vp.top, vp.bottom);
        
        if ((grid.reloadMasterAfterUpdates || grid.options.reloadMasterAfterUpdates) && grid.master_grid) {
          grid.master_grid.loader.reloadData();
          grid.master_grid.loader.ensureData(vp.top, vp.bottom);
        }

        if (continueOn) {
          if (window._always_reset_form) {
            Ui.refreshCreateForm(grid);
          }
        } else {
          if (grid.loader.isDataLoaded()) {
            setTimeout(() => { Ui.closeModal(grid.name); }, 100);
          }
        }

        const successMessage = grid.options.success_message || `${grid.model} successfully created`;
        window.displayNewNotification(successMessage, 'success');
      } else {
        // Handle validation errors
        for (let k in request.error_message) {
          const field = createFormElement.querySelector(`.field[name="${k}"], .field[name="${k}_id"]`);
          if (field) {
            const errorEl = field.querySelector(".field_error");
            if (errorEl) errorEl.textContent = request.error_message[k].join();
            const input = field.querySelector("input:not(.numInput)");
            if (input) input.classList.add('invalid');
          }
        }
        
        if (request.error_message['base']) {
          const baseErrorEl = createFormElement.querySelector('.base_error');
          if (baseErrorEl) baseErrorEl.textContent = request.error_message['base'];
        }

        const errorMessage = grid.options.error_message || `Error creating ${grid.model.toLowerCase()}`;
        window.saveMessage(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Create error:', error);
      window.displayErrorMessage('An error occurred during creation.', 'Network Error');
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  },

  /**
   * Updates a record via Fetch API.
   */
  updateByAjax: async function(grid, item, editCommand) {
    delete item.slick_index;
    const currentRow = this.getCurrentRows(grid, [item.id])[1];

    const gridParams = {};
    grid.loader.getParams().forEach(([key, value]) => {
      gridParams[key] = value;
    });

    const url = `${grid.path}/${item.id}.json${grid.query}`;
    const payload = {
      _method: 'PUT',
      item: item,
      gridParams: gridParams
    };

    try {
      const msg = await apiClient.request(url, { method: 'POST', body: JSON.stringify(payload) });
      
      if (msg.success) {
        grid.onUpdatedByAjax.notify({ item, msg });
        const from = Math.floor(currentRow / 200) * 200;
        grid.loader.reloadData(from, currentRow);
        
        const successMessage = grid.options.update_success_message || `${grid.model} successfully updated`;
        window.displayNewNotification(successMessage, 'success');
      } else {
        window.displayErrorMessage(msg.error_message || 'Update failed', 'Error');
        if (editCommand) {
          editCommand.undo();
        } else {
          grid.loader.reloadData();
        }
      }
    } catch (error) {
      console.error('Update error:', error);
      window.displayErrorMessage('An error occurred during update.', 'Network Error');
      if (editCommand) editCommand.undo();
    }
  },

  /**
   * Deletes records via Fetch API.
   */
  deleteByAjax: async function(grid, ids, force = false) {
    if (ids.length > 350) {
      window.displayErrorMessage('You selected too many rows, please select less than 350 rows.', 'Selection Error');
      return;
    }
    
    const range = this.getCurrentRows(grid, ids);
    if (ids.length === 0) return;

    const url = `${grid.path}/${ids}.json${grid.query}&force=${force}`;
    const payload = { _method: 'DELETE' };

    try {
      const msg = await apiClient.request(url, { method: 'POST', body: JSON.stringify(payload) });
      
      if (msg.success) {
        grid.onDeletedByAjax.notify({ ids, msg });
        grid.resetActiveCell();
        const from = Math.floor(range[0] / 200) * 200;
        const to = range[1] + 1;
        grid.loader.reloadData(from, to);
        
        if ((grid.reloadMasterAfterUpdates || grid.options.reloadMasterAfterUpdates) && grid.master_grid) {
          grid.master_grid.loader.reloadData();
        }

        this.updateToolbarState(grid, ids);

        const recordSize = Array.isArray(ids) ? ids.length : String(ids).split(',').length;
        const modelName = grid.model ? grid.model.toLowerCase() : 'record';
        const message = recordSize > 1 ? `${recordSize} ${modelName}s deleted` : `1 ${modelName} deleted`;
        window.displayNewNotification(message, 'success');
      } else if (msg.confirm) {
        window.displayCustomizedConfirmModal({
          message: msg.warning_message || "Are you sure?",
          title: "Delete Confirmation",
          confirmCallBack: () => {
            this.deleteByAjax(grid, ids, true);
          }
        });
      } else {
        window.displayErrorMessage(msg.error_message || 'Delete failed', 'Error');
        window.saveMessage('Error deleting ' + (grid.model ? grid.model.toLowerCase() : 'record'), 'error');
      }
    } catch (error) {
      console.error('Delete error:', error);
      window.displayErrorMessage('An error occurred during deletion.', 'Network Error');
    }
  },

  /**
   * Updates the toolbar state after a deletion.
   */
  updateToolbarState: function(grid, ids) {
    const toolbarSelect = grid.container.querySelector('.toolbar-select');
    if (!toolbarSelect) return;

    const buttonMode = toolbarSelect.dataset.mode;
    
    if (buttonMode === 'split') {
      toolbarSelect.hidden = true;
    } else {
      toolbarSelect.querySelectorAll('.specific').forEach(el => {
        el.classList.add('toolbar_icon_disabled');
        el.classList.remove('specific');
        el.classList.add('static-waves-effect');
        el.classList.remove('waves-effect');
      });
    }
  },

  /**
   * Gets the range of indices for the given record IDs.
   */
  getCurrentRows: function(grid, ids) {
    const indexes = ids
      .map(id => grid.getRowByRecordId(id))
      .filter(row => row !== undefined)
      .map(row => parseInt(row.index, 10))
      .sort((a, b) => a - b);
    
    return [indexes[0], indexes[indexes.length - 1]];
  }
};

// Global exposure for legacy compatibility
window.Requests = Requests;
export default Requests;
