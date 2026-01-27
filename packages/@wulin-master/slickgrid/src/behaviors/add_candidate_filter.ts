import { WulinGrid, GridBehavior } from '@wulin-master/core';
import { BaseBehavior, BehaviorManager } from '../behavior_manager';

// master-detail relation (when multiple masters - one detail), add candidate filters as a grid attribute,
// before doing grid.loader.addFitler, we should check the existing filters and candidate filters,
// if exsiting filters less than candidate filters (except the current filter), should not referesh the grid,
// until the current filter is the last candidate filter, we can refresh the grid
// code example see Affilication behavior
const AddCandidateFilterBehavior: GridBehavior = Object.assign({}, BaseBehavior, {
  name: 'add_candidate_filter',
  event: "onRendered",

  subscribe: function(this: GridBehavior, target: WulinGrid) {
    this.grid = target;
    const self = this;
    (target as any)[this.event].subscribe(() => { self.handler(); });
  },

  handler: function(this: GridBehavior) {
    const grid = this.grid;
    if(!grid.candidateFilters) {
      grid.candidateFilters = [this.filter];
    } else if(grid.candidateFilters.indexOf(this.filter) < 0) {
      grid.candidateFilters.push(this.filter);
    }
  }
});

BehaviorManager.register("add_candidate_filter", AddCandidateFilterBehavior);
export default AddCandidateFilterBehavior;
