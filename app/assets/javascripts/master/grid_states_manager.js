/**
 * GridStatesManager handles saving and restoring grid states (width, order, visibility, sorting, filters).
 * Modernized to use Fetch API and native JS.
 */
const GridStatesManager = {
  /**
   * Saves the current state of a grid to the server.
   */
  saveStates: async function(gridName, type, value) {
    if (!gridName) return;

    let stateValue = {};
    const url = "/wulin_master/grid_states_manages/save";

    if (!type) {
      stateValue['order'] = {};
    } else if (typeof type === 'string') {
      stateValue[type] = value;
    } else if (typeof type === 'object' && !Array.isArray(type)) {
      stateValue = type;
    }

    const payload = {
      grid_name: gridName,
      state_value: stateValue,
      authenticity_token: window._token
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error saving grid states:', error);
    }
  },

  /**
   * Binds state-related events to a grid instance.
   */
  onStateEvents: function(grid) {
    // Save columns width when columns resized
    grid.onColumnsResized.subscribe(() => {
      const widthJson = {};
      grid.getColumns().forEach(column => {
        widthJson[column.id] = column.width;
      });
      this.saveStates(grid.name, "width", widthJson);
    });

    // Save columns sorting info when columns sorted
    grid.onSort.subscribe(() => {
      const loader = grid.loader;
      const sortJson = {
        sortCol: loader.getSortColumn(),
        sortDir: loader.getSortDirection()
      };
      // Update sort state and save it to db
      grid.states["sort"] = sortJson;
      this.saveStates(grid.name, "sort", sortJson);
    });

    // Save columns order when columns re-ordered
    grid.onColumnsReordered.subscribe(() => {
      const orderJson = {};
      grid.getColumns().forEach((column, index) => {
        orderJson[index] = column.id;
      });
      this.saveStates(grid.name, "order", orderJson);
    });

    // Save filter states
    if (grid.filterPanel) {
      grid.filterPanel.onFilterLoaded.subscribe((e, args) => {
        if (args.filterData.length === 0) {
          this.saveStates(grid.name, "filter", null);
        } else {
          const filterJson = {};
          args.filterData.forEach(data => {
            filterJson[data.id] = data.value;
          });
          this.saveStates(grid.name, "filter", filterJson);
        }
      });

      grid.filterPanel.onFilterPanelClosed.subscribe(() => {
        const headerRow = grid.getHeaderRow();
        if (headerRow) {
          headerRow.querySelectorAll('input[type="text"]').forEach(input => input.value = '');
        }
        this.saveStates(grid.name, "filter", {});
      });
    }

    // Save columns visibility
    if (grid.picker) {
      grid.picker.onColumnsPick.subscribe(() => {
        if (grid.filterPanel) {
          grid.filterPanel.generateFilters();
        }

        const visibleIds = grid.getColumns().map(c => c.id);
        const allIds = grid.columns.map(c => c.id);
        const hiddenIds = allIds.filter(id => !visibleIds.includes(id));

        this.saveStates(grid.name, "visibility", hiddenIds);
      });
    }
  },

  /**
   * Restores columns order from saved states.
   */
  restoreOrderStates: function(columns, orderStates) {
    if (!orderStates) return columns;

    const newColumns = [];
    const orderValues = Object.values(orderStates);

    orderValues.forEach(id => {
      const col = columns.find(c => c.id === id);
      if (col) newColumns.push(col);
    });

    // Push columns that are not in the state
    columns.forEach(col => {
      if (!newColumns.some(nc => nc.id === col.id)) {
        newColumns.push(col);
      }
    });

    return newColumns;
  },

  /**
   * Restores columns visibility from saved states.
   */
  restoreVisibilityStates: function(columns, visibilityStates) {
    if (!visibilityStates) return;

    columns.forEach(col => {
      col.visible = !visibilityStates.includes(col.id);
    });
  },

  /**
   * Restores columns width from saved states.
   */
  restoreWidthStates: function(columns, widthStates) {
    if (!widthStates) return;

    Object.entries(widthStates).forEach(([id, width]) => {
      const col = columns.find(c => c.id === id);
      if (col) {
        col.width = parseInt(width, 10);
      }
    });
  },

  /**
   * Restores columns sorting from saved states.
   */
  restoreSortingStates: function(grid, loader, sortingStates) {
    if (sortingStates) {
      grid.setSortColumn(sortingStates.sortCol, sortingStates.sortDir === 1);
      if (grid.options.eagerLoading !== false) {
        loader.setSort(sortingStates.sortCol, sortingStates.sortDir);
      }
    }
  },

  /**
   * Merges saved filter states into original filters.
   */
  applyFilters: function(originalFilters, filterStates) {
    const filters = originalFilters || [];
    if (filterStates) {
      Object.entries(filterStates).forEach(([column, value]) => {
        filters.push({ column, value, operator: 'equals' });
      });
    }
    return filters;
  }
};

// Global exposure for legacy compatibility
window.GridStatesManager = GridStatesManager;
export default GridStatesManager;
