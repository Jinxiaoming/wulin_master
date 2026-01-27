import { WulinGrid, GridBehavior } from '@wulin-master/core';
import { BaseBehavior, BehaviorManager } from '../behavior_manager';

// master-detail grid relation, detail grid clear data when master grid has no selection
const EmptyDetailBehavior: GridBehavior = Object.assign({}, BaseBehavior, {
  name: 'empty_detail',
  event: "onDataLoaded",

  subscribe: function(this: GridBehavior, target: WulinGrid) {
    const self = this;

    this.detail_grids = this.detail_grids || [];
    if(this.detail_grids.indexOf(target) < 0) {
      this.detail_grids.push(target);
    }

    this.master_grid = window.WulinMaster.gridManager.getGrid(this.master_grid_name);
    if(this.master_grid) {
      (this.master_grid.loader as any)[this.event].subscribe(() => { self.handler(); });
    }
  },

  handler: function(this: GridBehavior) {
    // get the selected id, then filter the detail grid
    const rows = this.master_grid.getSelectedRows();
    if(rows.length === 0) {
      for(let i=0; i< this.detail_grids.length; i++) {
        const detailGrid = this.detail_grids[i];
        detailGrid.resetActiveCell();
        detailGrid.loader.clear();
        detailGrid.render();
      }
    }
  }
});

BehaviorManager.register("empty_detail", EmptyDetailBehavior);
export default EmptyDetailBehavior;
