import { IconManager, WulinGrid, WulinUi } from '@wulin-master/core';

/**
 * UI Helper tools for WulinMaster.
 * Modernized to use native JS.
 */
const Ui: WulinUi = {
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
    if (!window.WulinMaster.gridManager || !window.WulinMaster.gridManager.grids) return false;
    return window.WulinMaster.gridManager.grids.some((grid: WulinGrid) => grid.getCellEditor() != null);
  },

  /**
   * Resizes the grid and its components.
   */
  resizeGrid: function (grid: WulinGrid) {
    if (!grid) return;
    grid.resizeCanvas();
    grid.autosizeColumns();
    if ((grid as any).filterPanel) (grid as any).filterPanel.generateFilters();
    
    const onResize = () => {
      grid.resizeCanvas();
      grid.autosizeColumns();
      if ((grid as any).filterPanel) (grid as any).filterPanel.generateFilters();
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
  refreshCreateForm: function (grid: WulinGrid) {
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
              (grid as any).onOpenCreateModalEnd.notify();
            }, 350);
          }
        }
      });
  },

  /**
   * Resets a form's input fields.
   */
  resetForm: function (name: string) {
    const form = document.getElementById(`${name}_form`) || document.getElementById(`new_${name}`);
    if (!form) return;

    form.querySelectorAll('input, select, textarea').forEach((el: any) => {
      if (['button', 'submit', 'reset', 'hidden'].includes(el.type)) return;
      if (el.readOnly) return;

      el.value = '';
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
      if (el.tagName === 'SELECT') {
        el.selectedIndex = -1;
        if (el.tomselect) el.tomselect.clear();
      }
    });
  },

  /**
   * Opens a dialog for a grid action.
   */
  openDialog: function (grid: WulinGrid, action: string) {
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
            (grid as any).onOpenCreateModalEnd.notify();
          },
          onCloseStart: () => {
            document.querySelectorAll(".note-popover").forEach(el => el.remove());
            grid.options['needDuplicateSelectedRows'] = false;
          },
        });
      });
  },

  /**
   * Sets up UI components (Select2, Flatpickr, etc.) within a scope.
   */
  setupComponents: function (grid: WulinGrid, scope?: string) {
    const name = grid.name;
    const scopeSelector = scope || `#${name}_form`;
    const container = document.querySelector(scopeSelector);
    if (!container) return;

    // Cleanup Select2 empty options
    container.querySelectorAll('select.select2[data-required=false][multiple]').forEach(select => {
      select.querySelectorAll("option[value='']").forEach(opt => opt.remove());
    });

    // Init TomSelect (Replacing Select2)
    container.querySelectorAll('select.select2').forEach((select: any) => {
      if (select.tomselect) select.tomselect.destroy();
      
      const ts = new window.TomSelect(select, {
        placeholder: "",
        allowEmptyOption: true,
        width: "100%",
        onDropdownOpen: () => {
          select.closest(".field")?.querySelector("label")?.classList.add("active");
        },
        onDropdownClose: () => {
          if (!select.value) {
            select.closest(".field")?.querySelector("label")?.classList.remove("active");
          }
          const targetFlagId = select.dataset.targetId;
          const targetFlag = container.querySelector(`input.target_flag:checkbox[data-target-id="${targetFlagId}"]`) as HTMLInputElement;
          if (targetFlag) targetFlag.checked = true;
        }
      });
    });

    // Make labels active for inputs with values
    container.querySelectorAll('.field').forEach(field => {
      const input = field.querySelector('input, select, textarea') as any;
      if (input && (input.value || (input.tagName === 'SELECT' && input.selectedOptions.length > 0))) {
        field.querySelector('label')?.classList.add('active');
      }
    });

    // Setup Datepickers (Flatpickr)
    container.querySelectorAll('input[data-datetime]').forEach((el: any) => {
      if (window.Inputmask) new window.Inputmask('wulinDateTime').mask(el);
      window.flatpickr(el, Object.assign({}, (window as any).fpConfigFormDateTime || {}, (window as any).onCalendarOpenClose));
    });

    container.querySelectorAll('input[data-date]').forEach((el: any) => {
      const isUS = typeof window.USDateFormat === 'function' && window.USDateFormat();
      if (window.Inputmask) new window.Inputmask(isUS ? 'wulinUSDate' : 'wulinDate').mask(el);
      window.flatpickr(el, Object.assign({}, isUS ? (window as any).fpConfigFormUSDate : (window as any).fpConfigFormDate || {}, (window as any).onCalendarOpenClose));
    });

    container.querySelectorAll('input[data-time]').forEach((el: any) => {
      if (window.Inputmask) new window.Inputmask('wulinTime').mask(el);
      window.flatpickr(el, Object.assign({}, (window as any).fpConfigFormTime || {}, { appendTo: el.parentElement }));
    });
  },

  /**
   * Sets up the form state and remote options.
   */
  setupForm: function (grid: WulinGrid, monitor: boolean, selectedIndexes?: number[], scope?: string) {
    const name = grid.name;
    const scopeSelector = scope || `#${name}_form`;
    const container = document.querySelector(scopeSelector) as HTMLElement;
    if (!container) return;

    const formType = container.dataset.action;
    const columns = (window as any)[`${name}_columns`] || grid.allColumns;
    let currentData: any = {};

    if (grid.loader && grid.getSelectedRows().length > 0) {
      currentData = grid.loader.data[grid.getSelectedRows()[0]] || {};
    }

    const remotePath: any[] = [];
    const choicesColumn: any[] = [];
    const distinctColumn: any[] = [];

    columns.forEach((n: any) => {
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
      const target = container.querySelector(`select[data-field='${field}']`) as HTMLSelectElement;
      if (target) {
        target.querySelectorAll('option:not([value=""])').forEach(opt => opt.remove());
        fetch(path, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
          .then(r => r.json())
          .then(data => {
            const source = target.dataset.source || 'name';
            data.forEach((value: any) => {
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
      const target = container.querySelector(`select[data-field='${field}']`) as HTMLSelectElement;
      if (target) {
        target.querySelectorAll('option:not([value=""])').forEach(opt => opt.remove());
        fetch(path, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
          .then(r => r.json())
          .then(data => {
            const source = target.dataset.source || 'name';
            data.forEach((value: any) => {
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
      const target = container.querySelector(`select[data-field='${field}']`) as HTMLSelectElement;
      if (target) {
        target.querySelectorAll('option:not([value=""])').forEach(opt => opt.remove());
        choices.forEach((value: any) => {
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
      if (typeof window.fillValues === 'function') window.fillValues(container, grid, selectedIndexes);
    }

    const firstInput = container.querySelector('input:not([type="hidden"]), select, textarea') as HTMLElement;
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }

    if ((grid as any).master?.filter_column && (grid as any).master?.filter_value) {
      const hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = (grid as any).master.filter_column;
      hidden.value = (grid as any).master.filter_value;
      container.querySelector('form')?.appendChild(hidden);
    }

    this.preventPressEnterKeySubmitForm(`${scopeSelector} form`);
  },

  preventPressEnterKeySubmitForm: function (formSelector: string) {
    document.body.addEventListener("keypress", (event: any) => {
      if (!event.target.closest(formSelector)) return;
      const isTextarea = event.target.tagName === 'TEXTAREA' || event.target.classList.contains("note-editable");
      if (!isTextarea && event.key === 'Enter') {
        event.preventDefault();
        return false;
      }
    });
  },

  setupChosen: function (grid: WulinGrid, target: HTMLElement, scope: HTMLElement, selectedIndexes?: number[]) {
    if (selectedIndexes !== undefined && typeof window.fillValues === 'function') {
      window.fillValues(scope, grid, selectedIndexes);
    }
    target.dispatchEvent(new Event('change'));
    this.unCheckEmpty(target);
    this.addNewOption(target);
  },

  addNewOption: function (target: HTMLElement) {
    const chosenId = `${target.id}_chosen`;
    const chosenEl = document.getElementById(chosenId);
    if (!chosenEl) return;

    chosenEl.addEventListener('click', (e: any) => {
      if (e.target.textContent.includes("Add new Option")) {
        const closeBtn = chosenEl.querySelector('.chosen-single .search-choice-close');
        if (closeBtn) {
          const mouseUp = new MouseEvent('mouseup', { bubbles: true });
          closeBtn.dispatchEvent(mouseUp);
        }
        this.createAddOptionModal(target as HTMLSelectElement);
      }
    });
  },

  unCheckEmpty: function (target: HTMLElement) {
    if (!(target as any).value) {
      const targetId = (target as any).dataset.targetId;
      const flag = document.querySelector(`input.target_flag:checkbox[data-target-id="${targetId}"]`) as HTMLInputElement;
      if (flag) flag.checked = false;
    }
  },

  closeModal: function (name: string) {
    const form = document.getElementById(`${name}_form`);
    if (!form) return;
    window._focused = {};
    const modal = form.closest('.modal');
    if (modal) {
      const instance = window.WulinMaster.M.Modal.getInstance(modal);
      instance?.close();
      modal.remove();
    }
  },

  flashNotice: function (ids: any[] | string, action: string) {
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
        indicators.parentElement?.insertBefore(flash, indicators);
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
    let currentGrid: WulinGrid | null = null;
    const activeEl = document.activeElement;
    const container = activeEl?.closest('.grid_container');
    
    if (container) {
      const gridName = container.id.split('grid_')[1];
      currentGrid = window.WulinMaster.gridManager.getGrid(gridName);
    }

    if (!currentGrid && window.WulinMaster.gridManager.grids.length > 0) {
      if (window.WulinMaster.gridManager.grids.length === 1) {
        currentGrid = window.WulinMaster.gridManager.grids[0];
      } else {
        currentGrid = window.WulinMaster.gridManager.grids.find((g: WulinGrid) => g.getSelectedRows().length > 0);
      }
    }
    return currentGrid;
  },

  getModalSize: function (grid: WulinGrid, data: string, willBeRemovedContainerClassName = 'create_form') {
    const temp = document.createElement('div');
    temp.style.visibility = 'hidden';
    temp.style.position = 'absolute';
    temp.innerHTML = data;
    document.body.appendChild(temp);
    
    const container = temp.querySelector(`.${willBeRemovedContainerClassName}`) as HTMLElement;
    if (!container) {
      temp.remove();
      return { width: 900, height: 600 };
    }

    const titleH = (container.querySelector('.title') as HTMLElement)?.offsetHeight || 0;
    const formH = (container.querySelector('form') as HTMLElement)?.offsetHeight || 0;
    const submitH = (container.querySelector('.submit') as HTMLElement)?.offsetHeight || 0;
    
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

    const onCloseEnd = (options as any).onCloseEnd;
    (options as any).onCloseEnd = (el: HTMLElement) => {
      const activeRow = modal.querySelector(".ui-widget-content.active.slick-row") as HTMLElement;
      if (activeRow && typeof window.cleanUpEditors === 'function') {
        window.cleanUpEditors(activeRow.dataset.id);
      }
      if (onCloseEnd) onCloseEnd(el);
      modal.remove();
    };

    const instance = window.WulinMaster.M.Modal.init(modal, options);
    if ((options as any).openNow !== false) instance.open();

    return modal;
  },

  headerModal: function (title: string, options = {}) {
    const modal = this.baseModal(options);
    modal.classList.add('modal-fixed-footer');
    modal.style.overflow = 'hidden';

    const header = document.createElement('div');
    header.className = 'modal-header';
    const closeIcon = IconManager.getIconHtml('x', { class: 'modal-close right cursor-pointer' });
    header.innerHTML = `<span>${title}</span>${closeIcon}`;
    modal.insertBefore(header, modal.firstChild);

    return modal;
  },

  modalFooter: function (btnName: string) {
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    footer.innerHTML = `
      <div class="confirm-btn btn right">${btnName}</div>
      <div class="btn-flat modal-close">Cancel</div>
    `;
    return footer;
  },

  appendModalFooter: function (btnName: string, modal: HTMLElement) {
    const footer = this.modalFooter(btnName);
    modal.appendChild(footer);
    this.resetHeightOfModalContent(modal.querySelector('.modal-content'));
    return footer;
  },

  resetHeightOfModalContent: function (content: HTMLElement | null) {
    if (!content) return;
    const headerH = (content.parentElement?.querySelector('.modal-header') as HTMLElement)?.offsetHeight || 0;
    const footerH = (content.parentElement?.querySelector('.modal-footer') as HTMLElement)?.offsetHeight || 0;
    content.style.height = `calc(100% - ${headerH + footerH}px)`;
  },

  pdfDownloadFooter: function (pdfUrl: string) {
    const footer = this.modalFooter('Download PDF');
    (footer.querySelector('.confirm-btn') as HTMLElement).onclick = () => {
      window.open(pdfUrl);
      window.WulinMaster.M.Modal.getInstance(footer.parentElement as HTMLElement)?.close();
    };
    return footer;
  },

  createModelModal: function (grid: WulinGrid, data: string, options = {}, willBeRemovedContainerClassName?: string) {
    (options as any).startingTop = (options as any).endingTop = '5%';
    const size = this.getModalSize(grid, data, willBeRemovedContainerClassName);
    
    const modal = this.baseModal(options);
    modal.style.width = `${size.width}px`;
    modal.style.height = `${size.height}px`;
    modal.style.maxHeight = '90%';
    modal.classList.add('modal-fixed-footer');

    window.__globalWillAppend = true;
    (modal.querySelector('.modal-content') as HTMLElement).innerHTML = data;
    
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    footer.id = 'modal-footer';
    modal.appendChild(footer);

    window.__globalWillAppend = false;
    return modal;
  },

  createJsonViewModal: function (jsonData: any) {
    const modal = this.headerModal('JSON View');
    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify(jsonData, null, 2);
    (modal.querySelector('.modal-content') as HTMLElement).appendChild(pre);
  },

  createAddOptionModal: function (inputBox: HTMLSelectElement) {
    const modal = this.baseModal({
      onOpenEnd: (el: HTMLElement) => {
        const content = el.querySelector('.modal-content') as HTMLElement;
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
    (footer.querySelector('.confirm-btn') as HTMLElement).onclick = () => {
      const val = (modal.querySelector('#distinct_field') as HTMLInputElement).value;
      if (val) {
        const opt = document.createElement('option');
        opt.value = opt.textContent = val;
        
        const addOpt = Array.from(inputBox.options).find(o => o.textContent === 'Add new Option');
        inputBox.insertBefore(opt, addOpt || null);
        inputBox.value = val;

        const targetId = inputBox.dataset.targetId;
        const flag = document.querySelector(`input.target_flag:checkbox[data-target-id="${targetId}"]`) as HTMLInputElement;
        if (flag) flag.checked = true;

        window.WulinMaster.M.Modal.getInstance(modal)?.close();
      } else {
        alert('New option can not be blank!');
      }
    };
  },

  formatData: function (grid: WulinGrid, arrayData: any[]) {
    const data: any = {};
    const columns = grid.loader.getColumns();
    columns.forEach((col: any, i: number) => {
      data[col.id] = arrayData[i];
    });
    return data;
  },
};

// Global exposure for legacy compatibility
(window as any).Ui = Ui;
(window as any).WulinMaster = (window as any).WulinMaster || {};
(window as any).WulinMaster.Ui = Ui;

export default Ui;
