/**
 * UI Helper tools for WulinMaster.
 * Modernized to use native JS and remove jQuery dependencies.
 */
const Ui = {
  /**
   * Checks if any UI dialog is currently open.
   */
  isOpen: function () {
    return document.querySelectorAll('.ui-dialog:not([style*="display: none"]), .modal.open').length > 0;
  },

  /**
   * Checks if any grid is currently being edited.
   */
  isEditing: function () {
    if (!window.gridManager || !window.gridManager.grids) return false;
    return window.gridManager.grids.some(grid => grid.getCellEditor() != null);
  },

  /**
   * Resizes the grid and its components.
   */
  resizeGrid: function (grid) {
    if (!grid) return;
    grid.resizeCanvas();
    grid.autosizeColumns();
    if (grid.filterPanel) grid.filterPanel.generateFilters();
    
    const onResize = () => {
      grid.resizeCanvas();
      grid.autosizeColumns();
      if (grid.filterPanel) grid.filterPanel.generateFilters();
    };
    window.removeEventListener('resize', onResize);
    window.addEventListener('resize', onResize);
  },

  /**
   * Checks if the filter panel is open.
   */
  filterPanelOpen: function () {
    const headerRow = document.querySelector('.slick-headerrow-columns:not([style*="display: none"])');
    return !!headerRow && document.activeElement?.closest('.slick-headerrow-columns') != null;
  },

  /**
   * Checks if the grid is currently being filtered.
   */
  isFiltering: function () {
    return document.activeElement?.closest('.slick-header-column') != null;
  },

  /**
   * Checks if add or delete operations are locked.
   */
  addOrDeleteLocked: function () {
    return this.isEditing() || this.isOpen() || this.isFiltering();
  },

  /**
   * Returns an array of active grid names.
   */
  selectGridNames: function () {
    const gridContainers = document.querySelectorAll('.grid_container');
    return Array.from(gridContainers).map(container => {
      const id = container.id || "";
      return id.split('grid_')[1]?.trim();
    }).filter(Boolean);
  },

  /**
   * Refreshes the create form for a grid.
   */
  refreshCreateForm: function (grid) {
    const name = grid.name;
    const url = `${grid.path}/wulin_master_new_form${grid.query}`;

    fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then(response => response.text())
      .then(html => {
        const formVisible = document.querySelector(`#${name}_form`);
        if (formVisible) {
          const modalContent = formVisible.closest('.modal-content');
          if (modalContent) {
            modalContent.innerHTML = html;
            setTimeout(() => {
              this.setupForm(grid, false);
              this.setupComponents(grid);
              grid.onOpenCreateModalEnd.notify();
            }, 350);
          }
        }
      });
  },

  /**
   * Resets a form's input fields.
   */
  resetForm: function (name) {
    const form = document.getElementById(`${name}_form`) || document.getElementById(`new_${name}`);
    if (!form) return;

    form.querySelectorAll('input, select, textarea').forEach(el => {
      if (['button', 'submit', 'reset', 'hidden'].includes(el.type)) return;
      if (el.readOnly) return;

      el.value = '';
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
      if (el.tagName === 'SELECT') {
        el.selectedIndex = -1;
        if (typeof jQuery !== 'undefined' && (jQuery.fn.select2 || jQuery.fn.chosen)) {
          $(el).trigger('change').trigger('chosen:updated');
        }
      }
    });

    // Cleanup for chosen (legacy)
    form.querySelectorAll('ul.chzn-choices li.search-choice').forEach(el => el.remove());
  },

  /**
   * Opens a dialog for a grid action.
   */
  openDialog: function (grid, action) {
    const url = `${grid.path}/${action}${grid.query}`;

    fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then(response => response.text())
      .then(data => {
        this.createModelModal(grid, data, {
          dismissible: false,
          onOpenEnd: () => {
            const selectedIndexes = grid.options['needDuplicateSelectedRows'] ? grid.getSelectedRows() : undefined;
            this.setupForm(grid, false, selectedIndexes);
            this.setupComponents(grid);
            grid.onOpenCreateModalEnd.notify();
          },
          onCloseStart: (modal) => {
            // Cleanup for materialnote (legacy)
            if (typeof jQuery !== 'undefined' && jQuery.fn.materialnote) {
              $(modal).find(".materialnote").materialnote("destroy");
            }
            document.querySelectorAll(".note-popover").forEach(el => el.remove());
            grid.options['needDuplicateSelectedRows'] = false;
          },
        });
      });
  },

  /**
   * Sets up UI components (Select2, Flatpickr, etc.) within a scope.
   */
  setupComponents: function (grid, scope) {
    const name = grid.name;
    const scopeSelector = scope || `#${name}_form`;
    const container = document.querySelector(scopeSelector);
    if (!container) return;

    // Cleanup Select2 empty options
    container.querySelectorAll('select.select2[data-required=false][multiple]').forEach(select => {
      select.querySelectorAll("option[value='']").forEach(opt => opt.remove());
    });

    // Init Select2 (Still requires jQuery for now as Select2 is a jQuery plugin)
    if (typeof jQuery !== 'undefined' && jQuery.fn.select2) {
      $(container).find('select.select2').each((_, e) => {
        const $el = $(e);
        $el.select2({
          placeholder: "",
          allowClear: true,
          width: "100%"
        }).on("select2:unselecting", function() {
          $(this).data("unselecting", true);
        }).on("select2:opening", function(e) {
          if ($(this).data("unselecting")) {
            const field = $(this).closest(".field");
            field.find("label").removeClass("active");
            $(this).removeData("unselecting");
            e.preventDefault();
          }
        }).on("select2:open", (evt) => {
          $(evt.target).closest(".field").find("label").addClass("active");
        }).on("select2:close", (evt) => {
          if (!$(evt.target).val()) {
            $(evt.target).closest(".field").find("label").removeClass("active");
          }
          const targetFlagId = evt.target.dataset.targetId;
          const targetFlag = container.querySelector(`input.target_flag:checkbox[data-target-id="${targetFlagId}"]`);
          if (targetFlag) targetFlag.checked = true;
        });
      });
    }

    // Make labels active for inputs with values
    container.querySelectorAll('.field').forEach(field => {
      const input = field.querySelector('input, select, textarea');
      if (input && (input.value || (input.tagName === 'SELECT' && input.selectedOptions.length > 0))) {
        field.querySelector('label')?.classList.add('active');
      }
    });

    // Setup Datepickers (Flatpickr)
    container.querySelectorAll('input[data-datetime]').forEach(el => {
      if (typeof jQuery !== 'undefined' && jQuery.fn.inputmask) $(el).inputmask('wulinDateTime');
      flatpickr(el, Object.assign({}, window.fpConfigFormDateTime || {}, window.onCalendarOpenClose));
    });

    container.querySelectorAll('input[data-date]').forEach(el => {
      const isUS = typeof window.USDateFormat === 'function' && window.USDateFormat();
      if (typeof jQuery !== 'undefined' && jQuery.fn.inputmask) $(el).inputmask(isUS ? 'wulinUSDate' : 'wulinDate');
      flatpickr(el, Object.assign({}, isUS ? window.fpConfigFormUSDate : window.fpConfigFormDate || {}, window.onCalendarOpenClose));
    });

    container.querySelectorAll('input[data-time]').forEach(el => {
      if (typeof jQuery !== 'undefined' && jQuery.fn.inputmask) $(el).inputmask('wulinTime');
      flatpickr(el, Object.assign({}, window.fpConfigFormTime || {}, { appendTo: el.parentElement }));
    });
  },

  /**
   * Sets up the form state and remote options.
   */
  setupForm: function (grid, monitor, selectedIndexes, scope) {
    const name = grid.name;
    const scopeSelector = scope || `#${name}_form`;
    const container = document.querySelector(scopeSelector);
    if (!container) return;

    const formType = container.dataset.action;
    const columns = window[`${name}_columns`] || grid.allColumns;
    let currentData = {};

    if (grid.loader && grid.getSelectedRows().length > 0) {
      currentData = grid.loader.data[grid.getSelectedRows()[0]] || {};
    }

    const remotePath = [];
    const choicesColumn = [];
    const distinctColumn = [];

    columns.forEach(n => {
      if (n.choices && typeof n.choices === 'string') {
        if (n.distinct && formType !== 'create') {
          distinctColumn.push([n.field, n.choices]);
        } else {
          const formable = n.formable !== false;
          let editorChoices = n.choices;

          if (n.editor?.source) {
            const match = /^.*(source=.*)$/gim.exec(n.choices);
            if (match) {
              editorChoices = n.choices.replace(match[1], `source=${n.editor.source}`);
            }
          } else if (currentData && n.depend_column && currentData[n.depend_column]) {
            const masterModel = n.depend_column;
            const masterId = currentData[n.depend_column].id;
            editorChoices = `${editorChoices}&master_model=${masterModel}&master_id=${masterId}`;
          }
          remotePath.push([n.field, editorChoices, formable]);
        }
      } else if (currentData && n.choices_column) {
        choicesColumn.push([n.field, currentData[n.choices_column]]);
      }
    });

    let fillValuesWillRun = false;

    // Remote options
    remotePath.forEach(([field, path, formable]) => {
      if (!path || !formable) return;
      const target = container.querySelector(`select[data-field='${field}']`);
      if (target) {
        target.querySelectorAll('option:not([value=""])').forEach(opt => opt.remove());
        fetch(path, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
          .then(r => r.json())
          .then(data => {
            const source = target.dataset.source || 'name';
            data.forEach(value => {
              const opt = document.createElement('option');
              if (typeof value === 'object' && value !== null) {
                opt.value = value.id;
                opt.textContent = value[source];
              } else {
                opt.value = value;
                opt.textContent = value;
              }
              target.appendChild(opt);
            });
            this.setupChosen(grid, target, container, selectedIndexes);
          });
        fillValuesWillRun = true;
      }
    });

    // Distinct options
    distinctColumn.forEach(([field, path]) => {
      if (!path) return;
      const target = container.querySelector(`select[data-field='${field}']`);
      if (target) {
        target.querySelectorAll('option:not([value=""])').forEach(opt => opt.remove());
        fetch(path, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
          .then(r => r.json())
          .then(data => {
            const source = target.dataset.source || 'name';
            data.forEach(value => {
              const opt = document.createElement('option');
              if (typeof value === 'object' && value !== null) {
                opt.value = value.id;
                opt.textContent = value[source];
              } else {
                opt.value = value;
                opt.textContent = value;
              }
              target.appendChild(opt);
            });
            const addOpt = document.createElement('option');
            addOpt.textContent = 'Add new Option';
            target.appendChild(addOpt);
            this.setupChosen(grid, target, container, selectedIndexes);
          });
        fillValuesWillRun = true;
      }
    });

    // Choices from data
    choicesColumn.forEach(([field, choices]) => {
      const target = container.querySelector(`select[data-field='${field}']`);
      if (target) {
        target.querySelectorAll('option:not([value=""])').forEach(opt => opt.remove());
        choices.forEach(value => {
          const opt = document.createElement('option');
          opt.value = value;
          opt.textContent = value;
          target.appendChild(opt);
        });
        this.setupChosen(grid, target, container, selectedIndexes);
        fillValuesWillRun = true;
      }
    });

    if (!fillValuesWillRun && selectedIndexes !== undefined) {
      if (typeof window.fillValues === 'function') window.fillValues($(container), grid, selectedIndexes);
    }

    const firstInput = container.querySelector('input:not([type="hidden"]), select, textarea');
    if (firstInput) firstInput.focus();

    if (grid.master?.filter_column && grid.master?.filter_value) {
      const hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = grid.master.filter_column;
      hidden.value = grid.master.filter_value;
      container.querySelector('form')?.appendChild(hidden);
    }

    this.preventPressEnterKeySubmitForm(`${scopeSelector} form`);
  },

  preventPressEnterKeySubmitForm: function (formSelector) {
    document.body.addEventListener("keypress", (event) => {
      if (!event.target.closest(formSelector)) return;
      const isTextarea = event.target.tagName === 'TEXTAREA' || event.target.classList.contains("note-editable");
      if (!isTextarea && event.key === 'Enter') {
        event.preventDefault();
        return false;
      }
    });
  },

  setupChosen: function (grid, target, scope, selectedIndexes) {
    if (selectedIndexes !== undefined && typeof window.fillValues === 'function') {
      window.fillValues($(scope), grid, selectedIndexes);
    }
    target.dispatchEvent(new Event('change'));
    // Trigger legacy chosen update if present
    if (typeof jQuery !== 'undefined' && jQuery.fn.chosen) $(target).trigger('chosen:updated');
    this.unCheckEmpty(target);
    this.addNewOption(target);
  },

  addNewOption: function (target) {
    const chosenId = `${target.id}_chosen`;
    const chosenEl = document.getElementById(chosenId);
    if (!chosenEl) return;

    chosenEl.addEventListener('click', (e) => {
      if (e.target.textContent.includes("Add new Option")) {
        const closeBtn = chosenEl.querySelector('.chosen-single .search-choice-close');
        if (closeBtn) {
          const mouseUp = new MouseEvent('mouseup', { bubbles: true });
          closeBtn.dispatchEvent(mouseUp);
        }
        this.createAddOptionModal(target);
      }
    });
  },

  unCheckEmpty: function (target) {
    if (!target.value) {
      const targetId = target.dataset.targetId;
      const flag = document.querySelector(`input.target_flag:checkbox[data-target-id="${targetId}"]`);
      if (flag) flag.checked = false;
    }
  },

  closeModal: function (name) {
    const form = document.getElementById(`${name}_form`);
    if (!form) return;
    window._focused = {};
    const modal = form.closest('.modal');
    if (modal) {
      const instance = M.Modal.getInstance(modal);
      instance?.close();
      modal.remove();
    }
  },

  flashNotice: function (ids, action) {
    const recordSize = Array.isArray(ids) ? ids.length : String(ids).split(',').length;
    const recordUnit = recordSize > 1 ? 'records' : 'record';
    const actionDesc = action === 'delete' ? 'has been deleted!' : 'has been created!';

    if (recordSize > 0) {
      document.querySelectorAll('.notice_flash').forEach(el => el.remove());
      const flash = document.createElement('div');
      flash.className = 'notice_flash';
      flash.textContent = `${recordSize} ${recordUnit} ${actionDesc}`;
      
      const indicators = document.getElementById('indicators');
      if (indicators) {
        indicators.parentElement.insertBefore(flash, indicators);
      } else {
        document.body.appendChild(flash);
      }

      setTimeout(() => {
        flash.style.transition = 'opacity 1s';
        flash.style.opacity = '0';
        setTimeout(() => flash.remove(), 1000);
      }, 6000);
    }
  },

  findCurrentGrid: function () {
    let currentGrid = null;
    const activeEl = document.activeElement;
    const container = activeEl?.closest('.grid_container');
    
    if (container) {
      const gridName = container.id.split('grid_')[1];
      currentGrid = window.gridManager.getGrid(gridName);
    }

    if (!currentGrid && window.gridManager.grids.length > 0) {
      if (window.gridManager.grids.length === 1) {
        currentGrid = window.gridManager.grids[0];
      } else {
        currentGrid = window.gridManager.grids.find(g => g.getSelectedRows().length > 0);
      }
    }
    return currentGrid;
  },

  getModalSize: function (grid, data, willBeRemovedContainerClassName = 'create_form') {
    const temp = document.createElement('div');
    temp.style.visibility = 'hidden';
    temp.style.position = 'absolute';
    temp.innerHTML = data;
    document.body.appendChild(temp);
    
    const container = temp.querySelector(`.${willBeRemovedContainerClassName}`);
    if (!container) {
      temp.remove();
      return { width: 900, height: 600 };
    }

    const titleH = container.querySelector('.title')?.offsetHeight || 0;
    const formH = container.querySelector('form')?.offsetHeight || 0;
    const submitH = container.querySelector('.submit')?.offsetHeight || 0;
    
    const modalHeight = titleH + formH + submitH + 100;
    const width = grid.options?.form_dialog_width || 900;
    const height = grid.options?.form_dialog_height || modalHeight;
    
    temp.remove();
    return { width, height };
  },

  baseModal: function (options = {}) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    const content = document.createElement('div');
    content.className = 'modal-content';
    modal.appendChild(content);
    document.body.appendChild(modal);

    const onCloseEnd = options.onCloseEnd;
    options.onCloseEnd = (el) => {
      const activeRow = modal.querySelector(".ui-widget-content.active.slick-row");
      if (activeRow && typeof window.cleanUpEditors === 'function') {
        window.cleanUpEditors(activeRow.dataset.id);
      }
      if (onCloseEnd) onCloseEnd(el);
      modal.remove();
    };

    const instance = M.Modal.init(modal, options);
    if (options.openNow !== false) instance.open();

    return modal;
  },

  headerModal: function (title, options = {}) {
    const modal = this.baseModal(options);
    modal.classList.add('modal-fixed-footer');
    modal.style.overflow = 'hidden';

    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `<span>${title}</span><span class="modal-close material-icons right">close</span>`;
    modal.insertBefore(header, modal.firstChild);

    return modal;
  },

  modalFooter: function (btnName) {
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    footer.innerHTML = `
      <div class="confirm-btn btn right">${btnName}</div>
      <div class="btn-flat modal-close">Cancel</div>
    `;
    return footer;
  },

  appendModalFooter: function (btnName, modal) {
    const footer = this.modalFooter(btnName);
    modal.appendChild(footer);
    this.resetHeightOfModalContent(modal.querySelector('.modal-content'));
    return footer;
  },

  resetHeightOfModalContent: function (content) {
    if (!content) return;
    const headerH = content.parentElement.querySelector('.modal-header')?.offsetHeight || 0;
    const footerH = content.parentElement.querySelector('.modal-footer')?.offsetHeight || 0;
    content.style.height = `calc(100% - ${headerH + footerH}px)`;
  },

  pdfDownloadFooter: function (pdfUrl) {
    const footer = this.modalFooter('Download PDF');
    footer.querySelector('.confirm-btn').onclick = () => {
      window.open(pdfUrl);
      M.Modal.getInstance(footer.parentElement)?.close();
    };
    return footer;
  },

  createModelModal: function (grid, data, options = {}, willBeRemovedContainerClassName) {
    options.startingTop = options.endingTop = '5%';
    const size = this.getModalSize(grid, data, willBeRemovedContainerClassName);
    
    const modal = this.baseModal(options);
    modal.style.width = `${size.width}px`;
    modal.style.height = `${size.height}px`;
    modal.style.maxHeight = '90%';
    modal.classList.add('modal-fixed-footer');

    window.__globalWillAppend = true;
    modal.querySelector('.modal-content').innerHTML = data;
    
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    footer.id = 'modal-footer';
    modal.appendChild(footer);

    window.__globalWillAppend = false;
    return modal;
  },

  createJsonViewModal: function (jsonData) {
    const modal = this.headerModal('JSON View');
    if (typeof jQuery !== 'undefined' && jQuery.fn.jsonViewer) {
      $(modal).find('.modal-content').jsonViewer(jsonData);
    } else {
      const pre = document.createElement('pre');
      pre.textContent = JSON.stringify(jsonData, null, 2);
      modal.querySelector('.modal-content').appendChild(pre);
    }
  },

  createAddOptionModal: function (inputBox) {
    const modal = this.baseModal({
      onOpenEnd: (el) => {
        const content = el.querySelector('.modal-content');
        content.innerHTML = `
          <h5>Add new option</h5>
          <div class="input-field">
            <label for="distinct_field">New Option</label>
            <input id="distinct_field" type="text" name="distinct_field">
          </div>
        `;
      }
    });
    modal.style.width = '400px';

    const footer = this.appendModalFooter('Add Option', modal);
    footer.querySelector('.confirm-btn').onclick = () => {
      const val = modal.querySelector('#distinct_field').value;
      if (val) {
        const opt = document.createElement('option');
        opt.value = opt.textContent = val;
        
        const addOpt = Array.from(inputBox.options).find(o => o.textContent === 'Add new Option');
        inputBox.insertBefore(opt, addOpt);
        inputBox.value = val;

        const targetId = inputBox.dataset.targetId;
        const flag = document.querySelector(`input.target_flag:checkbox[data-target-id="${targetId}"]`);
        if (flag) flag.checked = true;

        if (typeof jQuery !== 'undefined' && jQuery.fn.chosen) $(inputBox).trigger('chosen:updated');
        M.Modal.getInstance(modal)?.close();
      } else {
        alert('New option can not be blank!');
      }
    };
  },

  formatData: function (grid, arrayData) {
    const data = {};
    const columns = grid.loader.getColumns();
    columns.forEach((col, i) => {
      data[col.id] = arrayData[i];
    });
    return data;
  },
};

// Global exposure for legacy compatibility
window.Ui = Ui;
export default Ui;
