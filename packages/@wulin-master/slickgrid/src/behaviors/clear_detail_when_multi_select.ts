import { WulinGrid, GridBehavior } from '@wulin-master/core';
import { BaseBehavior, BehaviorManager } from '../behavior_manager';

// master-detail grid relation, detail grid clear data when master grid has multi selection
const ClearDetailWhenMultiSelectBehavior: GridBehavior = Object.assign({}, BaseBehavior, {
  name: 'clear_detail_when_multi_select',
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
    const rows = this.master_grid.getSelectedRows();
    if(rows.length > 1) {
      for(let i=0; i< this.detail_grids.length; i++) {
        const detailGrid = this.detail_grids[i];
        detailGrid.resetActiveCell();
        detailGrid.loader.clear();
        (detailGrid as any).pager?.clearPager();
        detailGrid.render();
      }
    }
  }
});

BehaviorManager.register("clear_detail_when_multi_select", ClearDetailWhenMultiSelectBehavior);
export default ClearDetailWhenMultiSelectBehavior;
