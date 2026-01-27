/**
 * FilterPanel handles the grid's filter inputs and logic.
 * Modernized to use ES6 class and native DOM APIs.
 */
export default class FilterPanel {
  constructor(grid, loader, currentFilters) {
    this.grid = grid;
    this.loader = loader;
    this.currentFilters = currentFilters || {};
    this.currentFiltersApplied = [];
    this.filterWidthOffset = -3;

    // Events
    this.onFilterLoaded = new Slick.Event();
    this.onFilterPanelClosed = new Slick.Event();

    this.init();
  }

  init() {
    this.generateFilters();

    this.grid.onColumnsReordered.subscribe(() => {
      this.setupEventHandler();
      this.grid.setupColumnSort();
      this.generateFilters();
    });

    this.grid.onColumnsResized.subscribe(() => {
      this.generateFilters();
    });

    this.setupEventHandler();
  }

  setupEventHandler() {
    let timer = 0;
    const delay = (callback, ms) => {
      clearTimeout(timer);
      timer = setTimeout(callback, ms);
    };

    const headers = this.grid.getHeaders();
    if (!headers) return;

    // Remove old listener if any
    headers.removeEventListener('keyup', this._keyupHandler);

    this._keyupHandler = (e) => {
      if (!e.target.matches('input')) return;

      const input = e.target;
      const containerWidth = this.grid.container.offsetWidth;
      const viewport = this.grid.getCanvasNode().parentElement;
      
      const inputRect = input.getBoundingClientRect();
      const viewportRect = viewport.getBoundingClientRect();
      
      const inputLeft = input.offsetLeft;
      const inputRight = inputLeft - viewport.scrollLeft + input.offsetWidth;
      
      const ignoreKeyCodes = ['Tab', 'Meta', 'Enter'];

      if (containerWidth - inputRight < 0) {
        viewport.scrollLeft = inputLeft - containerWidth;
      }

      if (!ignoreKeyCodes.includes(e.key)) {
        delay(() => {
          this.updateCurrentFilters();
          this.applyCurrentFilters(this.currentFilters);
          this.setCurrentFilter();
          this.onFilterLoaded.notify({ filterData: this.currentFiltersApplied });
        }, 1000);
      }
    };

    headers.addEventListener('keyup', this._keyupHandler);
  }

  generateFilters() {
    const headers = this.grid.getHeaders();
    if (!headers) return;

    this.applyCurrentFilters(this.currentFilters);
    this.setOriginalFilter();

    // Restore values to existing inputs if they exist
    if (this.currentFiltersApplied.length > 0) {
      this.currentFiltersApplied.forEach(v => {
        const input = headers.querySelector(`input[data-id="${v.id}"]`);
        if (input) {
          input.value = v.value;
          input.focus();
        }
      });
    }

    const columns = this.grid.getColumns();
    // In WulinMaster, the actual rendering of inputs is often handled by grid.renderFilteredInputs()
    // which might use the HTML generated here or similar logic.
    this.grid.renderFilteredInputs();
  }

  updateCurrentFilters() {
    this.currentFilters = {};
    const headers = this.grid.getHeaders();
    if (!headers) return;

    headers.querySelectorAll('input').forEach(input => {
      if (input.value !== '') {
        this.currentFilters[input.dataset.id || input.id] = input.value;
      }
    });
  }

  setOriginalFilter() {
    const originalFilters = this.loader.getFilters();
    if (this.currentFiltersApplied.length !== 0) {
      this.currentFiltersApplied.forEach(f => {
        const operator = f.operator || 'equals';
        const exists = originalFilters.some(orig => 
          orig[0] === f.id && orig[1] === f.value && orig[2] === operator
        );
        if (!exists) {
          originalFilters.push([f.id, f.value, operator]);
        }
      });
      this.loader.setFilterWithoutRefresh(originalFilters);
    }
  }

  setCurrentFilter() {
    const filters = [];
    
    // Add current UI filters
    this.currentFiltersApplied.forEach(f => {
      filters.push([f.id, f.value, 'equals']);
    });

    // Add master grid filters
    const master = this.grid.master;
    if (master) {
      if (Array.isArray(master)) {
        master.forEach(m => filters.push(m));
      } else {
        filters.push([master.filter_column, master.filter_value, master.filter_operator || "equals"]);
      }
    }
    
    this.loader.setFilter(filters);
  }

  applyCurrentFilters(filters) {
    this.currentFiltersApplied = [];
    if (filters) {
      Object.entries(filters).forEach(([id, value]) => {
        if (value !== '') {
          this.currentFiltersApplied.push({ id, value });
        }
      });
    }
  }

  reapply() {
    this.currentFiltersApplied = [];
    this.updateCurrentFilters();
    this.applyCurrentFilters(this.currentFilters);
    this.setCurrentFilter();
  }
}

// Global exposure for legacy compatibility
window.WulinMaster = window.WulinMaster || {};
window.WulinMaster.FilterPanel = FilterPanel;
