/**
 * SlickGrid Extensions for WulinMaster
 * 
 * This file adds missing methods to the SlickGrid class that are expected
 * by the WulinMaster framework.
 */

export function extendSlickGrid(SlickGrid) {
  if (!SlickGrid) {
    console.error('SlickGrid not found for extension');
    return;
  }
  
  const prototype = SlickGrid.prototype;

  /**
   * Performs initial rendering of the grid.
   */
  if (!prototype.initialRender) {
    prototype.initialRender = function() {
      this.render();
      if (this.filterPanel) {
        this.filterPanel.generateFilters();
      }
    };
  }

  /**
   * Renders filter input boxes in the header row.
   */
  if (!prototype.renderFilteredInputs) {
    prototype.renderFilteredInputs = function() {
      const columns = this.getColumns();
      const headerRow = this.getHeaderRow();
      if (!headerRow) return;

      // Clear existing content
      headerRow.innerHTML = '';

      columns.forEach(column => {
        const headerCell = document.createElement('div');
        headerCell.className = 'slick-headerrow-column l' + column.id + ' r' + column.id;
        
        if (column.filterable !== false && column.id !== "_checkbox_selector") {
          const input = document.createElement('input');
          input.type = 'text';
          input.dataset.id = column.id;
          input.placeholder = column.name || '';
          headerCell.appendChild(input);
        }

        headerRow.appendChild(headerCell);
      });
    };
  }

  /**
   * Compatibility alias for getHeaderRow
   */
  if (!prototype.getHeaders) {
    prototype.getHeaders = function() {
      return this.getHeaderRow();
    };
  }

  /**
   * Renders loading placeholders for rows.
   */
  if (!prototype.renderLoadingRows) {
    prototype.renderLoadingRows = function(range) {
      // Basic implementation: do nothing or show a simple indicator
      // In modern SlickGrid, this is often handled by the DataView or custom CSS
      console.log('Rendering loading rows:', range);
    };
  }

  /**
   * Compatibility alias for getCanvasNode
   */
  if (!prototype.getCanvasNode) {
    prototype.getCanvasNode = function() {
      // Modern SlickGrid uses getCanvasElement()
      return this.getCanvasElement();
    };
  }

  /**
   * Compatibility alias for getTextSelection
   */
  if (!prototype.getTextSelection) {
    prototype.getTextSelection = function() {
      // Modern browsers use window.getSelection()
      const sel = window.getSelection();
      return sel ? sel.toString() : '';
    };
  }
}
