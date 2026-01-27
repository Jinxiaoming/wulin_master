import { GridAction } from '@wulin-master/core';
import { BaseAction, ActionManager } from '../action_manager';

/**
 * Multiple Grid States Action
 * Enables switching between different saved states for a grid.
 */
const MultipleGridStatesAction: GridAction = Object.assign({}, BaseAction, {
  name: 'multiple_grid_states',

  activate: function(this: GridAction) {
    const grid = this.target;
    if (!grid) return false;

    const stateItems = document.querySelectorAll(`#grid_states_${grid.name} .grid-state-item`);
    if (stateItems.length === 0) return false;

    stateItems.forEach((item: any) => {
      item.onclick = async () => {
        const stateId = item.dataset.stateId;
        const url = '/wulin_master/grid_states_manages/set_current';
        const body = new URLSearchParams({
          id: stateId,
          authenticity_token: decodeURIComponent(window._token || '')
        });

        try {
          const response = await fetch(url, {
            method: 'POST',
            body: body,
            headers: {
              'X-Requested-With': 'XMLHttpRequest'
            }
          });

          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          
          const msg = await response.text();
          if (msg === "success") {
            window.location.reload();
          } else {
            window.WulinMaster.displayErrorMessage(msg, "Error");
          }
        } catch (error) {
          console.error('Set current state error:', error);
          window.WulinMaster.displayErrorMessage('An error occurred while switching states.', 'Network Error');
        }
      };
    });
  },

  handler: () => {}
});

ActionManager.register(MultipleGridStatesAction);
export default MultipleGridStatesAction;
