import RemoteModel from './remotemodel.js';

/**
 * GridManager manages the collection of SlickGrid instances on the page.
 * It handles grid creation, retrieval, and global resizing.
 */
export default class GridManager {
  constructor() {
    this.gridElementPrefix = "#grid_";
    this.gridElementSuffix = " .grid";
    this.pagerElementSuffix = " .pager";
    this.grids = [];

    this.defaultOptions = {
      enableAddRow: false,
      enableCellNavigation: true,
      asyncEditorLoading: false,
      autoEdit: false,
      cellFlashingCssClass: "master_flashing",
      rowHeight: 26,
      checkbox: {
        enable: false,
        triggerAfterCheck: null,
        triggerEventName: null,
        maxSelectRows: null
      }
    };

    // Global resize listener
    window.addEventListener('resize', () => this.resizeGrids());
  }

  /**
   * Returns the appropriate editor class for a given data type.
   */
  getEditorForType(type) {
    switch (type.toLowerCase()) {
      case "enum": return window.SelectEditor;
      case "string": return window.TextEditor;
      case "text": return window.TextAreaEditor;
      case "datetime": return window.DateTimeEditor;
      case "time": return window.TimeEditor;
      case "date": return window.DateEditor;
      case "integer": return window.IntegerEditor;
      case "decimal": return window.DecimalEditor;
      case "boolean": return window.YesNoCheckboxEditor;
      case "belongs_to":
      case "has_one":
      case "has_and_belongs_to_many": return window.OtherRelationEditor;
      case "has_many": return window.HasManyEditor;
      default: return window.TextEditor;
    }
  }

  /**
   * Appends editor and formatter information to column definitions.
   */
  appendEditor(columns) {
    columns.forEach(column => {
      if (column.id === "_checkbox_selector") return;

      const typeStr = (column.type || "").toLowerCase();

      // 1. Append editor
      if (typeof column.editor === 'string') {
        column.editor = eval(column.editor);
      } else if (typeof column.editor !== 'object') {
        if (column.distinct) {
          column.editor = window.DistinctEditor;
        } else {
          column.editor = this.getEditorForType(column.type);
        }
      }

      // 2. Append cssClass
      if (typeStr === "boolean") {
        column.cssClass = 'cell-effort-driven';
      }

      // 3. Append formatter
      if (typeStr === "boolean" && !column.formatter) {
        column.formatter = window.GraphicBoolCellFormatter;
      }

      if (!column.formatter) {
        column.formatter = window.BaseFormatter;
      }

      if (typeof column.formatter === 'string') {
        column.formatter = eval(column.formatter);
      }
    });
  }

  /**
   * Creates a new SlickGrid instance and initializes its components.
   */
  createNewGrid(name, model, screen, path, filters, columns, states, actions, behaviors, extend_options, select_toolbar_items, user_id) {
    const options = Object.assign({}, this.defaultOptions, extend_options);
    
    // Add checkbox column if enabled
    if (options.checkbox.enable) {
      const checkboxSelector = new Slick.CheckboxSelectColumn({
        cssClass: "slick-cell-checkboxsel"
      });
      const checkboxColumn = checkboxSelector.getColumnDefinition();
      checkboxColumn.style_class = "slick-cell-checkboxsel";
      checkboxColumn.width = options.checkbox.columnWidth || 70;
      columns = [checkboxColumn, ...columns];
      options.checkboxSelector = checkboxSelector; // Store for registration
    }

    const originColumns = JSON.parse(JSON.stringify(columns));
    const gridSelector = `${this.gridElementPrefix}${name}${this.gridElementSuffix}`;
    const gridElement = document.querySelector(gridSelector);

    if (!gridElement) {
      console.error(`Grid element not found: ${gridSelector}`);
      return;
    }

    this.appendEditor(columns);

    // Apply states
    filters = window.GridStatesManager.applyFilters(filters, states["filter"]);
    const pathWithoutQuery = path.split(".json")[0];
    const query = path.split(".json")[1];

    const loader = new RemoteModel(path, filters, columns);
    columns = window.GridStatesManager.restoreOrderStates(columns, states["order"]);
    window.GridStatesManager.restoreVisibilityStates(columns, states["visibility"]);
    window.GridStatesManager.restoreWidthStates(columns, states["width"]);

    // Row detail plugin
    let rowDetailView;
    if (options.rowDetail) {
      rowDetailView = new Slick.Plugins.RowDetailView({
        loadOnce: options.rowDetail.loadOnce !== false,
        useRowClick: options.rowDetail.useRowClick,
        panelRows: options.rowDetail.panelRows,
        hideRow: options.rowDetail.hideRow,
        cssClass: options.rowDetail.cssClass,
        preTemplate: options.rowDetail.loadingTemplate,
        postTemplate: window['RowDetailTemplates'][options.rowDetail.postTemplate],
        process: (item) => rowDetailView.onAsyncResponse.notify({ 'itemDetail': item })
      });

      const triggerColumn = rowDetailView.getColumnDefinition();
      if (!options.rowDetail.showTriggerColumn) {
        triggerColumn.rowDetailIconVisible = false;
        triggerColumn.width = 0;
        triggerColumn.minWidth = 1;
      }
      columns.unshift(triggerColumn);
    }

    // Create Grid
    const grid = new Slick.Grid(gridElement, loader.data, columns, options);

    // Context Menu (Native implementation)
    grid.onContextMenu.subscribe((e) => {
      e.preventDefault();
      this.showContextMenu(grid, e);
    });

    // Attach attributes
    Object.assign(grid, {
      name, model, screen, loader, columns, originColumns, query,
      path: pathWithoutQuery,
      container: gridElement.parentElement,
      states, actions, behaviors, select_toolbar_items, options
    });

    if (options.rowDetail) grid.rowDetailView = rowDetailView;

    grid.setSelectionModel(new Slick.RowSelectionModel());

    const columnpicker = new Slick.Controls.ColumnPicker(columns, grid, user_id, options);
    grid.columnpicker = columnpicker;
    grid.allColumns = columnpicker.getAllColumns();

    grid.filterPanel = new window.WulinMaster.FilterPanel(grid, loader, states["filter"]);
    loader.setGrid(grid);

    const pagerElement = document.querySelector(`${this.gridElementPrefix}${name}${this.pagerElementSuffix}`);
    if (pagerElement) {
      grid.pager = new Slick.Controls.Pager(loader, grid, $(pagerElement)); // Pager still might need jQuery
    }

    // Sorting
    if (options.defaultSortingState) {
      grid.setSortColumn(options.defaultSortingState.column, options.defaultSortingState.direction === 'ASC');
      if (options.eagerLoading !== false) {
        loader.setSort(options.defaultSortingState.column, options.defaultSortingState.direction === 'ASC');
      }
    }
    window.GridStatesManager.restoreSortingStates(grid, loader, states["sort"]);

    // Dispatch
    window.WulinMaster.ActionManager.dispatchActions(grid, actions);
    window.WulinMaster.BehaviorManager.dispatchBehaviors(grid, behaviors);

    this.setGridBodyHeight(gridElement);
    grid.initialRender();
    grid.onViewportChanged.notify();

    // Manage grid collection
    this.grids = this.grids.filter(g => g.name !== name);
    this.grids.push(grid);

    if (states) window.GridStatesManager.onStateEvents(grid);

    // Plugins
    grid.registerPlugin(new Slick.AutoTooltips());
    if (options.rowDetail) grid.registerPlugin(rowDetailView);
    if (options.checkbox.enable) {
      grid.setSelectionModel(new Slick.RowSelectionModel({ selectActiveRow: false }));
      grid.registerPlugin(options.checkboxSelector);
    }
  }

  /**
   * Native implementation of the grid context menu.
   */
  showContextMenu(grid, e) {
    let contextMenu = document.getElementById('contextMenu');
    if (!contextMenu) {
      contextMenu = document.createElement('ul');
      contextMenu.id = 'contextMenu';
      contextMenu.className = 'context-menu';
      contextMenu.style.display = 'none';
      contextMenu.style.position = 'absolute';
      contextMenu.tabIndex = 0;
      document.body.appendChild(contextMenu);
    }

    const cell = grid.getCellFromEvent(e);
    const node = grid.getCellNode(cell.row, cell.cell);
    const text = (node.textContent || "").trim();

    // Reset active states
    grid.getContainerNode().querySelectorAll(".slick-cell, .slick-row").forEach(el => el.classList.remove("active"));

    if (!node.classList.contains("selected")) {
      grid.setActiveCell(cell.row, cell.cell);
    } else {
      node.classList.add("active");
      node.parentElement.classList.add("active");
      grid.setActiveRow(cell.row);
      grid.setActiveCellPosX(cell.cell);
      grid.setActiveCellNode(cell);
    }

    contextMenu.innerHTML = '';
    contextMenu.style.top = `${e.pageY}px`;
    contextMenu.style.left = `${e.pageX}px`;
    contextMenu.style.display = 'block';
    contextMenu.focus();

    // Copy item
    const copyItem = document.createElement('li');
    copyItem.innerHTML = `<i class='material-icons'>content_copy</i>Copy Cell`;
    copyItem.onclick = () => {
      navigator.clipboard.writeText(text);
      M.toast({ html: `${text} copied.` });
      contextMenu.style.display = 'none';
    };
    contextMenu.appendChild(copyItem);

    // Dynamic actions
    const contextActions = [...grid.select_toolbar_items].sort((a, b) => a.title[1].localeCompare(b.title[1]));
    contextActions.forEach(action => {
      const gridAction = grid.actions.find(item => action.title === (item.title || item.name[0].toUpperCase() + item.name.slice(1)));
      if (!gridAction) return;

      const item = document.createElement('li');
      const actionName = action.title.toLowerCase();
      item.innerHTML = `<i class='material-icons'>${action.icon || 'help'}</i>${actionName[0].toUpperCase() + actionName.slice(1)}`;
      item.onclick = () => {
        const triggerBtn = document.getElementById(`${gridAction.name}_action_on_${grid.name}`);
        if (triggerBtn) triggerBtn.click();
        contextMenu.style.display = 'none';
      };
      contextMenu.appendChild(item);
    });

    const closeMenu = () => {
      contextMenu.style.display = 'none';
      document.removeEventListener('click', closeMenu);
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 10);
  }

  getGrid(name) {
    return this.grids.find(g => g.name === name) || null;
  }

  setGridBodyHeight(gridElement) {
    const container = gridElement.parentElement;
    const ch = container.offsetHeight;
    const hh = container.querySelector(".grid-header")?.offsetHeight || 0;
    const ph = container.querySelector(".pager")?.offsetHeight || 0;
    gridElement.style.height = `${ch - hh - ph - 1}px`;
  }

  resizeGrids() {
    this.grids.forEach(grid => {
      const gridElement = document.querySelector(`${this.gridElementPrefix}${grid.name}${this.gridElementSuffix}`);
      if (gridElement) {
        this.setGridBodyHeight(gridElement);
        grid.resizeCanvas();
      }
    });
  }
}

// Global exposure for legacy compatibility
window.GridManager = GridManager;
window.gridManager = new GridManager();
