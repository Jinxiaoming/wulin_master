import { WulinGrid, GridBehavior } from '@wulin-master/core';
import { BaseBehavior, BehaviorManager } from '../behavior_manager';

// master-detail grid relation, detail grid render the records which belongs to the selected row of master grid
const AffiliationBehavior: GridBehavior = Object.assign({}, BaseBehavior, {
  name: 'affiliation',
  event: "onSelectedRowsChanged",

  subscribe: function(this: GridBehavior, target: WulinGrid) {
    const self = this;

    this.detail_grids = this.detail_grids || [];
    if(this.detail_grids.indexOf(target) < 0) {
      this.detail_grids.push(target);
    }

    this.master_grid = window.WulinMaster.gridManager.getGrid(this.master_grid_name);
    if(this.master_grid) {
      (this.master_grid as any)[this.event].subscribe(() => { self.handler(); });
    }
  },

  handler: function(this: GridBehavior) {
    // get the selected id, then filter the detail grid
    const masterIds = (this.master_grid as any).getSelectedIds();
    if (masterIds.length != 1) return false;

    const association_key = this.through;
    for(let i=0; i < this.detail_grids.length; i++) {
      const detailGrid = this.detail_grids[i];
      // save the master relation info into detail grid
      detailGrid.master = {filter_column: association_key, filter_value: masterIds[0], filter_operator: this.operator};
      detailGrid.master_grid = this.master_grid;
      // apply sorting state if has
      const sortingStates = (detailGrid as any).states["sort"];
      if(sortingStates) {
        detailGrid.loader.setSortWithoutRefresh(sortingStates["sortCol"], sortingStates["sortDir"]);
      }
      // filter the detail grid
      detailGrid.resetActiveCell();

      const existingFilters = detailGrid.loader.getFilters().map((e: any) => e[0]);
      const candidateFilters = (detailGrid as any).candidateFilters || [];
      
      // Simple difference implementation to avoid jQuery dependency if possible, but keeping logic same
      const dif = existingFilters.filter((x: string) => !candidateFilters.includes(x));

      if(existingFilters.length > candidateFilters.length || dif.length === 0 || (dif.length === 1 && dif[0] == association_key)) {
        detailGrid.loader.addFilter(association_key, masterIds[0], this.operator);
      } else {
        detailGrid.loader.addFilterWithoutRefresh(association_key, masterIds[0], this.operator);
      }

      // Set master grid's style for selection
      const configuredMasterDetailColorTheme = window.WulinMaster.MASTER_DETAIL_COLOR_THEME || 'teal';
      const selectionColor = 'grid-selection-color-' + (this.master_grid.options['selectionColor'] || configuredMasterDetailColorTheme);
      this.master_grid.container.classList.add(selectionColor);

      // Set detail grid's style
      const colorTheme = 'grid-color-' + (detailGrid.options['colorTheme'] || configuredMasterDetailColorTheme);
      detailGrid.container.classList.add('detail-grid');
      detailGrid.container.classList.add(colorTheme);
      const bgColor = 'grid-bg-color-' + (detailGrid.options['bgColor'] || configuredMasterDetailColorTheme);
      detailGrid.container.classList.add(bgColor);
      detailGrid.container.querySelector('.grid-header')?.classList.remove('has-selected-rows');
    }
  }
});

BehaviorManager.register("affiliation", AffiliationBehavior);
export default AffiliationBehavior;
