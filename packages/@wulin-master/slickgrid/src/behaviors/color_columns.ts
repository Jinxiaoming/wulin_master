import { WulinGrid, GridBehavior } from '@wulin-master/core';
import { BaseBehavior, BehaviorManager } from '../behavior_manager';

const ColorColumnsBehavior: GridBehavior = Object.assign({}, BaseBehavior, {
  name: 'color_columns',
  events: ['onAddExtraCellClasses'],

  subscribe: function (this: GridBehavior, target: WulinGrid) {
    this.grid = target;
    const [onAddExtraCellClasses] = this.events;
    (target as any)[onAddExtraCellClasses].subscribe((e: any, args: any) => this.setCellColor(args));
  },

  setCellColor: function (this: GridBehavior, { grid, row, cell, extraCellClasses }: any) {
    const cellColumnColor = grid.getColumns()[cell]['color'];
    if (cellColumnColor) {
      extraCellClasses.push('colored');
      extraCellClasses.push(`colored-${cellColumnColor}`);
    }
  },
});

BehaviorManager.register('color_columns', ColorColumnsBehavior);
export default ColorColumnsBehavior;
