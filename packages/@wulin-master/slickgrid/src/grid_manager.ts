import { RemoteModel, registry } from '@wulin-master/core';

/**
 * GridManager manages the collection of SlickGrid instances on the page.
 * It handles grid creation, retrieval, and global resizing.
 */
export class GridManager {
  private gridElementPrefix: string = "#grid_";
  private gridElementSuffix: string = " .grid";
  private pagerElementSuffix: string = " .pager";
  public grids: any[] = [];

  private defaultOptions: any = {
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

  constructor() {
    // Global resize listener
    window.addEventListener('resize', () => this.resizeGrids());
  }

  /**
   * Returns the appropriate editor class for a given data type.
   */
  getEditorForType(type: string): any {
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
  appendEditor(columns: any[]): void {
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
  resolveGlobalSymbol(str: string): any {
    if (!str) return null;
    return str.split('.').reduce((obj, prop) => obj?.[prop], window as any);
  }

  /**
   * Creates a new SlickGrid instance and initializes its components.
   */
  createNewGrid(name: string, model: string, screen: string, path: string, filters: any[], columns: any[], states: any, actions: any[], behaviors: any[], extend_options: any, select_toolbar_items: any[], user_id: string): any {
    const options = Object.assign({}, this.defaultOptions, extend_options);
    
    const Slick = (window as any).Slick;

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
    const gridElement = document.querySelector(gridSelector) as HTMLElement;

    if (!gridElement) {
      console.error(`Grid element not found: ${gridSelector}`);
      return;
    }

    this.appendEditor(columns);

    const win = window as any;

    // Apply states
    filters = win.GridStatesManager.applyFilters(filters, states["filter"]);
    const pathWithoutQuery = path.split(".json")[0];
    const query = path.split(".json")[1];

    const loader = new RemoteModel(path, filters, columns);
    columns = win.GridStatesManager.restoreOrderStates(columns, states["order"]);
    win.GridStatesManager.restoreVisibilityStates(columns, states["visibility"]);
    win.GridStatesManager.restoreWidthStates(columns, states["width"]);

    // Row detail plugin
    let rowDetailView: any;
    if (options.rowDetail) {
      rowDetailView = new Slick.Plugins.RowDetailView({
        loadOnce: options.rowDetail.loadOnce !== false,
        useRowClick: options.rowDetail.useRowClick,
        panelRows: options.rowDetail.panelRows,
        hideRow: options.rowDetail.hideRow,
        cssClass: options.rowDetail.cssClass,
        preTemplate: options.rowDetail.loadingTemplate,
        postTemplate: win['RowDetailTemplates'][options.rowDetail.postTemplate],
        process: (item: any) => rowDetailView.onAsyncResponse.notify({ 'itemDetail': item })
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
    grid.onContextMenu.subscribe((e: MouseEvent) => {
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

    grid.filterPanel = new win.WulinMaster.FilterPanel(grid, loader, states["filter"]);
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
    win.GridStatesManager.restoreSortingStates(grid, loader, states["sort"]);

    // Dispatch
    win.WulinMaster.ActionManager.dispatchActions(grid, actions);
    win.WulinMaster.BehaviorManager.dispatchBehaviors(grid, behaviors);

    this.setGridBodyHeight(gridElement);
    grid.initialRender();
    grid.onViewportChanged.notify();

    // Manage grid collection
    this.grids = this.grids.filter(g => g.name !== name);
    this.grids.push(grid);

    if (states) win.GridStatesManager.onStateEvents(grid);

    // Plugins
    grid.registerPlugin(new Slick.AutoTooltips());
    if (options.rowDetail) grid.registerPlugin(rowDetailView);
    if (options.checkbox.enable) {
      grid.setSelectionModel(new Slick.RowSelectionModel({ selectActiveRow: false }));
      grid.registerPlugin(options.checkboxSelector);
    }

    return grid;
  }

  /**
   * Native implementation of the grid context menu.
   */
  showContextMenu(grid: any, e: MouseEvent): void {
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
    grid.getContainerNode().querySelectorAll(".slick-cell, .slick-row").forEach((el: HTMLElement) => el.classList.remove("active"));

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

    const win = window as any;

    // Copy item
    const copyItem = document.createElement('li');
    copyItem.innerHTML = `<i class='wulin-icon' data-lucide='copy'></i>Copy Cell`;
    copyItem.onclick = () => {
      navigator.clipboard.writeText(text);
      win.M.toast({ html: `${text} copied.` });
      if (contextMenu) contextMenu.style.display = 'none';
    };
    contextMenu.appendChild(copyItem);

    // Dynamic actions
    const contextActions = [...grid.select_toolbar_items].sort((a, b) => a.title[1].localeCompare(b.title[1]));
    contextActions.forEach(action => {
      const gridAction = grid.actions.find((item: any) => action.title === (item.title || item.name[0].toUpperCase() + item.name.slice(1)));
      if (!gridAction) return;

      const item = document.createElement('li');
      const actionName = action.title.toLowerCase();
      item.innerHTML = `<i class='wulin-icon' data-lucide='${action.icon || 'help-circle'}'></i>${actionName[0].toUpperCase() + actionName.slice(1)}`;
      item.onclick = () => {
        const triggerBtn = document.getElementById(`${gridAction.name}_action_on_${grid.name}`);
        if (triggerBtn) triggerBtn.click();
        if (contextMenu) contextMenu.style.display = 'none';
      };
      contextMenu.appendChild(item);
    });

    // Scan for icons
    win.IconManager.scan(contextMenu);

    const closeMenu = () => {
      if (contextMenu) contextMenu.style.display = 'none';
      document.removeEventListener('click', closeMenu);
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 10);
  }

  getGrid(name: string): any {
    return this.grids.find(g => g.name === name) || null;
  }

  /**
   * Destroys a grid instance and removes it from the collection.
   */
  destroyGrid(name: string): void {
    const gridIndex = this.grids.findIndex(g => g.name === name);
    if (gridIndex !== -1) {
      const grid = this.grids[gridIndex];
      grid.destroy();
      this.grids.splice(gridIndex, 1);
    }
  }

  setGridBodyHeight(gridElement: HTMLElement): void {
    const container = gridElement.parentElement as HTMLElement;
    const ch = container.offsetHeight;
    const hh = (container.querySelector(".grid-header") as HTMLElement)?.offsetHeight || 0;
    const ph = (container.querySelector(".pager") as HTMLElement)?.offsetHeight || 0;
    gridElement.style.height = `${ch - hh - ph - 1}px`;
  }

  resizeGrids(): void {
    this.grids.forEach(grid => {
      const gridElement = document.querySelector(`${this.gridElementPrefix}${grid.name}${this.gridElementSuffix}`) as HTMLElement;
      if (gridElement) {
        this.setGridBodyHeight(gridElement);
        grid.resizeCanvas();
      }
    });
  }
}

// Global exposure for legacy compatibility
const gridManager = new GridManager();
const win = window as any;
win.GridManager = GridManager;
win.gridManager = gridManager;

export { gridManager };
export default GridManager;
