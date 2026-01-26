/**
 * SlickGrid Editors for WulinMaster.
 * Modernized to use ES6 classes and native DOM APIs.
 */

class BaseEditor {
  constructor(args) {
    this.args = args;
    this.column = args.column;
    this.element = null;
    this.wrapper = null;
    this.defaultValue = null;
  }

  destroy() {
    if (this.wrapper) {
      this.wrapper.remove();
    } else if (this.element) {
      this.element.remove();
    }
  }

  focus() {
    this.element?.focus();
  }

  applyValue(item, state) {
    item[this.column.field] = state;
  }

  serializeValue() {
    return this.element?.value;
  }

  loadValue(item) {
    this.defaultValue = item[this.column.field];
    if (this.element) {
      this.element.value = this.defaultValue || "";
      this.element.select();
    }
  }

  isValueChanged() {
    return this.element?.value !== this.defaultValue;
  }

  validate() {
    return { valid: true, msg: null };
  }

  validateNumber() {
    const val = this.element?.value;
    if (isNaN(val)) {
      if (this.element) this.element.value = this.defaultValue;
      return { valid: false, msg: "Please enter a valid number." };
    }
    return { valid: true, msg: null };
  }

  getValue() {
    return this.element?.value;
  }

  setValue(val) {
    if (this.element) this.element.value = val;
  }

  getCell() {
    return this.element?.parentElement;
  }

  callValidator(value) {
    const validator = this.column.validator;
    if (typeof validator === 'function') {
      return validator(this.args, value);
    } else if (typeof validator === 'string') {
      return eval(validator)(this.args, value);
    }
    return { valid: true, msg: null };
  }

  setOffset(element, offsetWidth) {
    if (element.classList.contains("editor-text")) return;

    const winWidth = window.innerWidth;
    const rect = element.getBoundingClientRect();
    const offsetLeft = rect.left + window.pageXOffset;

    if (winWidth - offsetLeft < offsetWidth) {
      element.style.left = `${winWidth - offsetWidth}px`;
    }
  }

  adjustPosition(element, container, ignoreCellHeight = true) {
    const coordinate = container.getBoundingClientRect();
    const elementWidth = element.offsetWidth;
    const elementHeight = element.offsetHeight;

    element.style.position = "absolute";
    element.style.left = `${coordinate.left + window.pageXOffset}px`;

    let coordinateY = ignoreCellHeight ? coordinate.top : coordinate.bottom;
    coordinateY += window.pageYOffset;

    const docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);

    if (docHeight - coordinateY < elementHeight) {
      coordinateY = coordinate.top + window.pageYOffset - elementHeight;
    }

    if (coordinate.right + elementWidth > window.innerWidth && element.classList.contains("flatpickr-calendar")) {
      element.style.left = `${coordinate.right + window.pageXOffset - elementWidth}px`;
    }
    
    element.style.top = `${coordinateY}px`;
  }
}

class InputElementEditor extends BaseEditor {
  constructor(args) {
    super(args);
    this.boxWidth = this.column.width;
    this.offsetWidth = this.boxWidth + 28;
  }

  initElements() {
    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.className = 'editor-text';
    this.input.style.width = `${this.boxWidth}px`;
    this.input.style.border = 'none';
    this.element = this.input;

    this.input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.stopImmediatePropagation();
      }
    });

    this.args.container.classList.add("input-field");
    this.args.container.appendChild(this.input);
    this.input.focus();
    this.input.select();
  }

  initMdAutoComplete(input) {
    if (this.column.hide_autocomplete || !this.column.choices) return;

    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.stopPropagation();
      }
    });

    fetch(this.column.choices)
      .then(r => r.json())
      .then(dataArray => {
        const dataObject = {};
        dataArray.forEach(item => dataObject[item] = null);

        input.classList.add("autocomplete");
        if (window.M && window.M.Autocomplete) {
          window.M.Autocomplete.init(input, {
            data: dataObject,
            limit: 5,
            minLength: this.column.autocomplete_minlength || 1,
          });
        }
      });
  }

  isValueChanged() {
    const val = this.input.value;
    return (!(val === "" && this.defaultValue === null)) && (val !== this.defaultValue);
  }
}

class IntegerEditor extends InputElementEditor {
  constructor(args) {
    super(args);
    this.initElements();
    this.setOffset(this.input, this.offsetWidth);
  }

  serializeValue() {
    return parseInt(this.input.value, 10) || 0;
  }

  validate() {
    return this.validateNumber();
  }
}

class DecimalEditor extends InputElementEditor {
  constructor(args) {
    super(args);
    this.initElements();
    this.setOffset(this.input, this.offsetWidth);
  }

  serializeValue() {
    return this.input.value || '';
  }

  validate() {
    return this.validateNumber();
  }
}

class YesNoCheckboxEditor extends BaseEditor {
  constructor(args) {
    super(args);
    const id = `checkbox-${this.args.item.id}`;
    
    const label = document.createElement('label');
    label.className = 'checkbox-editor';
    
    this.checkbox = document.createElement('input');
    this.checkbox.type = 'checkbox';
    this.checkbox.className = 'filled-in';
    this.checkbox.id = id;
    
    const span = document.createElement('span');
    span.setAttribute('for', id);
    
    label.appendChild(this.checkbox);
    label.appendChild(span);
    
    this.args.container.appendChild(label);
    this.element = this.checkbox;
  }

  loadValue(item) {
    this.defaultValue = !!item[this.column.field];
    this.checkbox.checked = this.defaultValue;
  }

  serializeValue() {
    return this.checkbox.checked;
  }

  isValueChanged() {
    return this.checkbox.checked !== this.defaultValue;
  }
}

class SelectElementEditor extends BaseEditor {
  constructor(args) {
    super(args);
    this.choices = this.column.choices;
    if (this.column.editor?.source) {
      const match = /^.*(source=.*)$/igm.exec(this.column.choices);
      if (match) {
        this.choices = this.column.choices.replace(match[1], `source=${this.column.editor.source}`);
      }
    }

    this.field = this.args.item[this.column.field];
    this.originColumn = this.args.grid.originColumns.find(c => c.name === this.column.name) || this.column;

    this.boxWidth = Math.max(this.column.width, this.originColumn.width);
    this.offsetWidth = this.boxWidth + 28;
  }

  initElements() {
    const parentDataId = this.args.container.parentElement.dataset.id;
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'select-editor';
    this.wrapper.dataset.id = parentDataId;
    document.body.appendChild(this.wrapper);

    this.select = document.createElement('select');
    this.select.className = 'chzn-select';
    this.select.style.width = `${this.boxWidth}px`;
    this.element = this.select;
    this.wrapper.appendChild(this.select);
    
    this.setOffset(this.wrapper, this.offsetWidth);
    this.adjustPosition(this.wrapper, this.args.container);

    this.select.appendChild(document.createElement('option'));
    this.select.focus();
  }

  openDropDown() {
    setTimeout(() => {
      const gridView = this.args.container.closest('.slick-viewport');
      
      // TomSelect (Replacing Chosen)
      if (window.TomSelect) {
        this.ts = new TomSelect(this.select, {
          allowEmptyOption: !this.column.required,
          onDropdownOpen: () => {
            if (gridView) gridView.style.overflow = 'hidden';
          },
          onDropdownClose: () => {
            if (gridView) gridView.style.overflow = 'auto';
          }
        });
        this.ts.focus();
      }
    });
  }

  setAllowSingleDeselect() {
    // Handled in openDropDown for TomSelect
  }
}

class SelectEditor extends SelectElementEditor {
  constructor(args) {
    super(args);
    this.initElements();

    let choices = this.column.choices;
    if (this.column.choices_column) {
      choices = this.args.item[this.column.choices_column];
    }

    let selectOptions = [];
    if (Array.isArray(choices)) {
      selectOptions = choices.map(e => (typeof e === 'object' && e !== null) ? e : { id: e, name: e });
    } else if (typeof choices === 'object' && choices !== null) {
      if (this.column.depend_column) {
        const dependVal = this.args.item[this.column.depend_column];
        const options = choices[dependVal] || [];
        selectOptions = options.map(e => ({ id: e, name: e }));
      }
    }

    const currentValue = this.args.item[this.column.field];
    if (currentValue) {
      const opt = document.createElement('option');
      opt.style.display = 'none';
      opt.value = opt.textContent = currentValue;
      this.select.appendChild(opt);
      this.select.value = currentValue;
    }

    selectOptions.forEach(opt => {
      const option = document.createElement('option');
      option.value = option.textContent = opt.name || opt.id;
      this.select.appendChild(option);
    });

    this.setAllowSingleDeselect();
    this.openDropDown();
  }
}

class DistinctEditor extends SelectElementEditor {
  constructor(args) {
    super(args);
    this.source = this.column.source || 'name';
    this.addOptionText = 'Add new Option';
    
    this.initElements();
    
    fetch(this.choices)
      .then(r => r.json())
      .then(itemdata => {
        itemdata.forEach(value => {
          const opt = document.createElement('option');
          opt.value = opt.textContent = value;
          this.select.appendChild(opt);
        });

        const addOpt = document.createElement('option');
        addOpt.textContent = this.addOptionText;
        this.select.appendChild(addOpt);

        this.select.value = this.args.item[this.column.field] || "";
        this.setAllowSingleDeselect();
        
        if (window.TomSelect) {
          this.ts = new TomSelect(this.select, {
            allowEmptyOption: !this.column.required,
            onChange: (value) => {
              if (value === this.addOptionText) {
                window.Ui.createAddOptionModal(this.select);
              }
            }
          });
        }
      });
      
    this.openDropDown();
  }
}

class RelationEditor extends SelectElementEditor {
  constructor(args) {
    super(args);
    this.source = this.column.editor?.source || this.column.source || 'name';
    this.relationColumn = ['has_and_belongs_to_many', 'has_many'].includes(this.column.type);
  }

  isValueChanged() {
    const selectedValue = Array.from(this.select.selectedOptions).map(o => o.value);
    if (this.relationColumn) {
      const defaultIds = (this.defaultValue || []).map(String);
      if (selectedValue.length !== defaultIds.length) return true;
      return selectedValue.some(v => !defaultIds.includes(v));
    }
    return this.select.value != this.defaultValue;
  }

  serializeValue() {
    const obj = { id: this.select.value };
    const selectedOptions = Array.from(this.select.selectedOptions);
    
    if (this.column.type === 'has_and_belongs_to_many') {
      obj[this.source] = selectedOptions.map(o => o.textContent).join(', ');
    } else {
      obj[this.source] = selectedOptions[0]?.textContent || '';
    }
    return obj;
  }

  loadValue(item) {
    this.defaultValue = item[this.column.field]?.id;
    this.select.value = this.defaultValue || "";
  }

  applyValue(item, state) {
    const field = item[this.column.field] || {};
    field.id = state.id;
    field[this.source] = state[this.source];
    item[this.column.field] = field;
  }

  getOptions() {
    let url = this.choices;
    if (this.args.column.depend_column) {
      const relationId = this.args.item[this.args.column.depend_column]?.id;
      url += `&master_model=${this.args.column.depend_column}&master_id=${relationId}`;
    }

    this.args.grid.onRelationCellEdit.notify({ relationEditor: this });

    fetch(url).then(r => r.json()).then(data => this.setOptions(data));
  }

  setOptions(dataset) {
    dataset.forEach(value => {
      if (!this.field || this.field.id != value.id) {
        const opt = document.createElement('option');
        opt.value = value.id;
        opt.textContent = value[this.source];
        this.select.appendChild(opt);
      }
    });
    this.openDropDown();
  }

  appendOptions(target, value) {
    const opt = document.createElement('option');
    opt.value = value.id;
    opt.textContent = value[this.source];
    target.appendChild(opt);
  }
}

class OtherRelationEditor extends RelationEditor {
  constructor(args) {
    super(args);
    this.initElements();

    if (this.relationColumn) {
      this.select.multiple = true;
    }

    if (this.column.type === "has_and_belongs_to_many") {
      fetch(this.choices)
        .then(r => r.json())
        .then(items => {
          items.forEach(item => this.appendOptions(this.select, item));

          const column = this.column.column_name;
          const recordId = this.args.item.id;
          const link = `${this.args.grid.path}.json${this.args.grid.query}&` + new URLSearchParams({
            "filters[][column]": "id",
            "filters[][value]": recordId,
            "filters[][operator]": "equals",
            "columns": `id,${column}`
          });

          fetch(link).then(r => r.json()).then(data => {
            const row = data.rows?.[0];
            if (row) {
              // Find the data by column name
              const colIdx = this.args.grid.getColumns().findIndex(c => c.column_name === column);
              const val = row[colIdx];
              if (val?.id) {
                this.select.value = val.id;
                this.defaultValue = val.id;
                this.setAllowSingleDeselect();
              }
            }
          }).finally(() => this.openDropDown());
        });
      return;
    }

    this.select.appendChild(document.createElement('option'));
    if (this.field?.id) {
      this.appendOptions(this.select, this.field);
      this.select.value = this.field.id;
    }

    if (Array.isArray(this.choices)) {
      this.setOptions(this.choices);
    } else {
      this.getOptions();
    }

    this.openDropDown();
  }
}

class HasManyEditor extends RelationEditor {
  constructor(args) {
    super(args);
    this.initElements();

    if (this.relationColumn) this.select.multiple = true;

    this.select.innerHTML = '';
    this.select.appendChild(document.createElement('option'));

    this.args.grid.onHasManyCellEdit.notify({ editor: this });

    fetch(this.choices).then(r => r.json()).then(itemdata => {
      itemdata.forEach(value => this.appendOptions(this.select, value));

      const column = this.column.column_name;
      const recordId = this.args.item.id;
      const link = `${this.args.grid.path}.json${this.args.grid.query}&` + new URLSearchParams({
        "filters[][column]": "id",
        "filters[][value]": recordId,
        "filters[][operator]": "equals",
        "columns": `id,${column}`
      });

      fetch(link).then(r => r.json()).then(data => {
        const row = data.rows?.[0];
        if (row) {
          const colIdx = this.args.grid.getColumns().findIndex(c => c.column_name === column);
          const val = row[colIdx];
          if (val?.id) {
            this.select.value = val.id;
            this.defaultValue = val.id;
            this.setAllowSingleDeselect();
          }
        }
      }).finally(() => this.openDropDown());
    });
  }

  applyValue(item, state) {
    item[this.column.field] = state.id === null ? 'null' : state;
  }
}

class TextEditor extends InputElementEditor {
  constructor(args) {
    super(args);
    this.initElements();
    this.setOffset(this.input, this.boxWidth);
    this.initMdAutoComplete(this.input);
    args.grid.onTextEditorInit.notify({ editor: this, ...args });
  }

  validate() {
    if (this.column.validator) {
      const results = this.callValidator(this.input.value);
      if (!results.valid) return results;
    }
    return { valid: true, msg: null };
  }
}

class TextEditorForForm extends InputElementEditor {
  constructor(args) {
    super(args);
    this.args.container.setAttribute('autocomplete', 'off');
    this.initMdAutoComplete(this.args.container);
  }
}

class TextAreaEditor extends BaseEditor {
  constructor(args) {
    super(args);
    this.boxWidth = 250;
    this.offsetWidth = this.boxWidth + 18;

    const parentDataId = this.args.container.parentElement.dataset.id;
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'textarea-wrapper';
    this.wrapper.dataset.id = parentDataId;
    document.body.appendChild(this.wrapper);

    this.textArea = document.createElement('textarea');
    this.textArea.className = 'textarea-in-grid';
    this.textArea.rows = 5;
    this.textArea.style.width = `${this.boxWidth}px`;
    this.element = this.textArea;
    this.wrapper.appendChild(this.textArea);

    const btnContainer = document.createElement('div');
    const btnSave = document.createElement('button');
    btnSave.textContent = 'Save';
    btnSave.className = 'btn btn-small right';
    btnSave.onclick = () => this.args.commitChanges();

    const btnCancel = document.createElement('button');
    btnCancel.textContent = 'Cancel';
    btnCancel.className = 'btn btn-small right';
    btnCancel.onclick = () => {
      this.textArea.value = this.defaultValue;
      this.args.cancelChanges();
    };

    btnContainer.appendChild(btnCancel);
    btnContainer.appendChild(btnSave);
    this.wrapper.appendChild(btnContainer);

    this.textArea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.ctrlKey) {
        this.args.commitChanges();
      } else if (e.key === "Escape") {
        e.preventDefault();
        this.textArea.value = this.defaultValue;
        this.args.cancelChanges();
      } else if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) this.args.grid.navigatePrev();
        else this.args.grid.navigateNext();
      }
    });

    this.position(args.position);
    this.textArea.focus();
    this.textArea.select();
  }

  hide() { this.wrapper.style.display = 'none'; }
  show() { this.wrapper.style.display = 'block'; }

  position(pos) {
    this.wrapper.style.top = `${pos.top - 5}px`;
    this.wrapper.style.left = `${pos.left - 5}px`;
    
    const winWidth = window.innerWidth;
    const rect = this.wrapper.getBoundingClientRect();
    if (winWidth - rect.left < this.offsetWidth) {
      this.wrapper.style.left = `${winWidth - this.offsetWidth}px`;
    }
  }

  isValueChanged() {
    const val = this.textArea.value;
    return (!(val === "" && this.defaultValue === null)) && (val !== this.defaultValue);
  }
}

class DateTimeBaseEditor extends InputElementEditor {
  constructor(args) {
    super(args);
    const date = this.args.item[this.column.field];
    this.boxWidth -= 24;

    this.fpConfigGrid = window.fpMergeConfigs({}, window.fpConfigInit || {}, {
      clickOpens: false,
      onReady: (selectedDates, dateStr, instance) => {
        instance.open();
        instance.update(date);
      },
      onOpen: (selectedDates, dateStr, instance) => {
        this.adjustPosition(instance.calendarContainer, this.args.container, false);
        const gridView = this.args.container.closest('.slick-viewport');
        if (gridView) gridView.style.overflow = 'hidden';
      },
      onClose: (selectedDates, dateStr, instance) => {
        const gridView = this.args.container.closest('.slick-viewport');
        if (gridView) gridView.style.overflow = 'auto';
      }
    });
  }
}

class DateTimeEditor extends DateTimeBaseEditor {
  constructor(args) {
    super(args);
    this.initElements();
    // Inputmask
    if (window.Inputmask) new Inputmask('wulinDateTime').mask(this.input);

    if (!this.column.hide_calendar) {
      const config = window.fpMergeConfigs(this.fpConfigGrid, window.fpConfigFormDateTime);
      flatpickr(this.input, config);
    }
  }
}

class DateEditor extends DateTimeBaseEditor {
  constructor(args) {
    super(args);
    this.initElements();
    const isUS = typeof window.USDateFormat === 'function' && window.USDateFormat();
    if (window.Inputmask) new Inputmask(isUS ? 'wulinUSDate' : 'wulinDate').mask(this.input);

    if (!this.column.hide_calendar) {
      const config = window.fpMergeConfigs(this.fpConfigGrid, isUS ? window.fpConfigFormUSDate : window.fpConfigFormDate);
      flatpickr(this.input, config);
    }
  }
}

class TimeEditor extends DateTimeBaseEditor {
  constructor(args) {
    super(args);
    this.initElements();
    if (window.Inputmask) new Inputmask('wulinTime').mask(this.input);

    if (!this.column.hide_calendar) {
      const config = window.fpMergeConfigs(this.fpConfigGrid, window.fpConfigFormTime);
      flatpickr(this.input, config);
    }
  }
}

class RichTextEditor extends InputElementEditor {
  constructor(args) {
    super(args);
    this.initElements();
    this.setOffset(this.input, this.offsetWidth);
  }

  validate() {
    if (this.column.validator) {
      const results = this.callValidator(this.input.value);
      if (!results.valid) return results;
    }
    return { valid: true, msg: null };
  }
}

// Export to window for SlickGrid compatibility
window.WulinEditors = {
  BaseEditor,
  InputElementEditor,
  IntegerEditor,
  DecimalEditor,
  YesNoCheckboxEditor,
  SelectElementEditor,
  SelectEditor,
  DistinctEditor,
  RelationEditor,
  OtherRelationEditor,
  HasManyEditor,
  TextEditor,
  TextEditorForForm,
  TextAreaEditor,
  DateTimeBaseEditor,
  DateTimeEditor,
  DateEditor,
  TimeEditor,
  RichTextEditor
};

// Also export individual editors to window root as SlickGrid expects them there
Object.assign(window, window.WulinEditors);
