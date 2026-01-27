import { WulinGrid, GridBehavior } from '@wulin-master/core';
import { BaseBehavior, BehaviorManager } from '../behavior_manager';

const AggregationBehavior: GridBehavior = Object.assign({}, BaseBehavior, {
  name: 'aggregation',
  events: ['onRendered', 'onDataLoaded'],

  subscribe: function (this: GridBehavior, target: WulinGrid) {
    this.grid = target;
    const [onRendered, onDataLoaded] = this.events;
    (target as any)[onRendered].subscribe((_: any, args: any) => this.renderSpan(args));
    (target.loader as any)[onDataLoaded].subscribe((_: any, args: any) => this.fillSpan(args));
  },

  utils: function (this: GridBehavior) {
    const getPager = (grid: WulinGrid) => grid.container.querySelector('.pager-item.extra') as HTMLElement;
    const addAggregationSpan = (pager: HTMLElement | null) => {
      if (!pager) return null;
      let span = pager.querySelector('#aggregation');
      if (!span) {
        span = document.createElement('span');
        span.id = 'aggregation';
        pager.appendChild(span);
      }
      return span;
    };
    const getSpan = (grid: WulinGrid) => grid.container.querySelector('span#aggregation') as HTMLElement;
    return {
      getPager, addAggregationSpan, getSpan,
    };
  },

  renderSpan: function (this: GridBehavior, args: any) {
    const grid = this.grid;
    const { getPager, addAggregationSpan } = this.utils();
    return addAggregationSpan(getPager(grid));
  },

  fillSpan: function (this: GridBehavior, args: any) {
    const grid = this.grid;
    const { getSpan } = this.utils();
    const aggregation = grid.loader.getPagingInfo()['aggregation'] || '';
    const span = getSpan(grid);
    if (span) {
      span.textContent = aggregation;
    }
  },
});

BehaviorManager.register('aggregation', AggregationBehavior);
export default AggregationBehavior;
