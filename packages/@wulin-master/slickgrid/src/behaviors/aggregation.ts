WulinMaster.behaviors.Aggregation = Object.assign({}, WulinMaster.behaviors.BaseBehavior, {
  events: ['onRendered', 'onDataLoaded'],

  subscribe: function (target) {
    this.grid = target;
    const [onRendered, onDataLoaded] = this.events;
    target[onRendered].subscribe((_, args) => this.renderSpan(args));
    target.loader[onDataLoaded].subscribe((_, args) => this.fillSpan(args));
  },

  utils: function () {
    const getPager = grid => grid.container.querySelector('.pager-item.extra');
    const addAggregationSpan = pager => {
      if (!pager) return null;
      let span = pager.querySelector('#aggregation');
      if (!span) {
        span = document.createElement('span');
        span.id = 'aggregation';
        pager.appendChild(span);
      }
      return span;
    };
    const getSpan = grid => grid.container.querySelector('span#aggregation');
    return {
      getPager, addAggregationSpan, getSpan,
    };
  },

  renderSpan: function (args) {
    const { grid } = this;
    const { getPager, addAggregationSpan } = this.utils();
    return addAggregationSpan(getPager(grid));
  },

  fillSpan: async function (args) {
    const { grid } = this;
    const { getSpan } = this.utils();
    const aggregation = grid.loader.getPagingInfo()['aggregation'] || '';
    const span = getSpan(grid);
    if (span) {
      span.textContent = aggregation;
    }
  },
});

WulinMaster.BehaviorManager.register('aggregation', WulinMaster.behaviors.Aggregation);
