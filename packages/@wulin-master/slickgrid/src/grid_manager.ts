import { RemoteModel, registry } from '@wulin-master/core';

/**
 * GridManager manages the collection of SlickGrid instances on the page.
 * It handles grid creation, retrieval, and global resizing.
 */
export class GridManager {
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
      case "enum": return registry.getEditor("SelectEditor");
      case "string": return registry.getEditor("TextEditor");
      case "text": return registry.getEditor("TextAreaEditor");
      case "datetime": return registry.getEditor("DateTimeEditor");
      case "time": return registry.getEditor("TimeEditor");
      case "date": return registry.getEditor("DateEditor");
      case "integer": return registry.getEditor("IntegerEditor");
      case "decimal": return registry.getEditor("DecimalEditor");
      case "boolean": return registry.getEditor("YesNoCheckboxEditor");
      case "belongs_to":
      case "has_one":
      case "has_and_belongs_to_many": return registry.getEditor("OtherRelationEditor");
      case "has_many": return registry.getEditor("HasManyEditor");
      default: return registry.getEditor("TextEditor");
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
        column.editor = this.resolveGlobalSymbol(column.editor);
      } else if (typeof column.editor !== 'object') {
        if (column.distinct) {
          column.editor = registry.getEditor("DistinctEditor");
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
        column.formatter = registry.getFormatter("GraphicBoolCellFormatter");
      }

      if (!column.formatter) {
        column.formatter = registry.getFormatter("BaseFormatter");
      }

      if (typeof column.formatter === 'string') {
        column.formatter = registry.getFormatter(column.formatter);
      }
    });
  }

  /**
   * Resolves a global symbol string (e.g., "Slick.Formatters.Text") to its value.
   */
  resolveGlobalSymbol(str) {
    if (!str) return null;
    return str.split('.').reduce((obj, prop) => obj?.[prop], window);
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
      grid.pager = new Slick.Controls.Pager(loader, grid, pagerElement);
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

    return grid;
  }

  getGrid(name) {
    return this.grids.find(g => g.name === name) || null;
  }

  /**
   * Destroys a grid instance and removes it from the collection.
   */
  destroyGrid(name) {
    const gridIndex = this.grids.findIndex(g => g.name === name);
    if (gridIndex !== -1) {
      const grid = this.grids[gridIndex];
      grid.destroy();
      this.grids.splice(gridIndex, 1);
    }
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
const gridManager = new GridManager();
window.GridManager = GridManager;
window.gridManager = gridManager;

export { GridManager, gridManager };
export default GridManager;
