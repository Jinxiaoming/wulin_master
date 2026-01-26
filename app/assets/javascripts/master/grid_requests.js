// ------------------------------ CRUD -------------------------------------
var Requests = {
  // Record create by ajax
  createByAjax: function(grid, continue_on, afterCreated) {
    const createFormElement = document.querySelector(`div#${grid.name}_form form`);
    if (!createFormElement) return;

    const submitButton = createFormElement.querySelector("input[type='submit']");
    const formData = new FormData(createFormElement);
    
    // Clear all the error messages
    createFormElement.querySelectorAll(".field_error").forEach(el => el.textContent = "");
    createFormElement.querySelectorAll("input.invalid").forEach(el => el.classList.remove('invalid'));

    if (submitButton) submitButton.disabled = true;

    const url = `${grid.path}.json`;
    
    fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'X-CSRF-Token': decodeURIComponent(window._token || ''),
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(request => {
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

        if (continue_on) {
          if (window._always_reset_form) {
            Ui.refreshCreateForm(grid);
          }
        } else {
          if (grid.loader.isDataLoaded()) {
            setTimeout(() => { Ui.closeModal(grid.name); }, 100);
          }
        }

        const successMessage = grid.options.success_message || `${grid.model} successfully created`;
        displayNewNotification(successMessage, 'success');
      } else {
        // Handle validation errors
        for(let k in request.error_message){
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
        saveMessage(errorMessage, 'error');
      }
    })
    .catch(error => {
      console.error('Create error:', error);
      displayErrorMessage('An error occurred during creation.', 'Network Error');
    })
    .finally(() => {
      if (submitButton) submitButton.disabled = false;
    });
  },

  /**
   * Performs an AJAX request using the modern Fetch API.
   * This is a step towards removing the jQuery dependency.
   * 
   * @param {string} url - The endpoint URL
   * @param {Object} options - Fetch options (method, body, etc.)
   * @returns {Promise<Object>} The JSON response
   */
  async fetchJson(url, options = {}) {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': decodeURIComponent(window._token || ''),
        'X-Requested-With': 'XMLHttpRequest'
      }
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  },

  // Record update by ajax
  updateByAjax: function(grid, item, editCommand) {
    delete item.slick_index;
    const currentRow = this.getCurrentRows(grid, [item.id])[1];

    const gridParams = {};
    $.each(grid.loader.getParams(), function(_, value) {
      gridParams[value[0]] = value[1];
    });

    const url = `${grid.path}/${item.id}.json${grid.query}`;
    const body = JSON.stringify({
      _method: 'PUT',
      item: item,
      authenticity_token: decodeURIComponent(window._token),
      gridParams: gridParams
    });

    this.fetchJson(url, { method: 'POST', body })
      .then(msg => {
        if(msg.success) {
          grid.onUpdatedByAjax.notify({item, msg});
          const from = parseInt(currentRow / 200, 10) * 200;
          grid.loader.reloadData(from, currentRow);
          
          const successMessage = grid.options.update_success_message || `${grid.model} successfully updated`;
          displayNewNotification(successMessage, 'success');
        } else {
          displayErrorMessage(msg.error_message || 'Update failed', 'Error');
          if(editCommand) {
            editCommand.undo();
          } else {
            grid.loader.reloadData();
          }
        }
      })
      .catch(error => {
        console.error('Update error:', error);
        displayErrorMessage('An error occurred during update.', 'Network Error');
        if(editCommand) editCommand.undo();
      });
  },

  // Delete rows along ajax
  deleteByAjax: function(grid, ids, force = false) {
    if (ids.length > 350) {
      displayErrorMessage('You selected too many rows, please select less than 350 rows.', 'Selection Error');
      return;
    }
    
    const range = this.getCurrentRows(grid, ids);
    if (ids.length === 0) return;

    const url = `${grid.path}/${ids}.json${grid.query}&force=${force}`;
    const body = JSON.stringify({
      _method: 'DELETE',
      authenticity_token: window._token
    });

    this.fetchJson(url, { method: 'POST', body })
      .then(msg => {
        if(msg.success) {
          grid.onDeletedByAjax.notify({ids, msg});
          grid.resetActiveCell();
          const from = parseInt(range[0] / 200, 10) * 200;
          const to = range[1] + 1;
          grid.loader.reloadData(from, to);
          if ((grid.reloadMasterAfterUpdates || grid.options.reloadMasterAfterUpdates) && grid.master_grid) {
            grid.master_grid.loader.reloadData();
          }

          this.updateToolbarState(grid, ids);

          const recordSize = $.isArray(ids) ? ids.length : ids.split(',').length;
          const modelName = grid.model ? grid.model.toLowerCase() : 'record';
          const message = recordSize > 1 ? `${recordSize} ${modelName}s deleted` : `1 ${modelName} deleted`;
          displayNewNotification(message, 'success');
        } else if(msg.confirm) {
          displayCustomizedConfirmModal({
            message: msg.warning_message || "Are you sure?",
            title: "Delete Confirmation",
            confirmCallBack: () => {
              Requests.deleteByAjax(grid, ids, true);
            }
          });
        } else {
          displayErrorMessage(msg.error_message || 'Delete failed', 'Error');
          saveMessage('Error deleting ' + (grid.model ? grid.model.toLowerCase() : 'record'), 'error');
        }
      })
      .catch(error => {
        console.error('Delete error:', error);
        displayErrorMessage('An error occurred during deletion.', 'Network Error');
      });
  },

  /**
   * Updates the toolbar state after a deletion.
   */
  updateToolbarState: function(grid, ids) {
    const toolbarSelect = grid.container.find('.toolbar-select');
    const buttonMode = toolbarSelect.data('mode');
    
    if(buttonMode === 'split') {
      toolbarSelect.attr('hidden', true);
    } else {
      toolbarSelect
        .find('.specific')
        .addClass('toolbar_icon_disabled')
        .removeClass('specific')
        .addClass('static-waves-effect')
        .removeClass('waves-effect');
    }
  },

  getCurrentRows: function(grid, ids) {
    var indexes = ids.filter((id) => {
      grid.getRowByRecordId(id)
    }).map((id) => parseInt(grid.getRowByRecordId(id).index, 10));
    indexes = indexes.sort();
    return [indexes[0], indexes[indexes.length-1]];
  }
}; // Requests

// Expose Requests to global window object
window.Requests = Requests;
