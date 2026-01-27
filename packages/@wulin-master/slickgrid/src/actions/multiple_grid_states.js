/**
 * Multiple Grid States Action
 * Enables switching between different saved states for a grid.
 */
WulinMaster.actions.MultipleGridStates = Object.assign({}, WulinMaster.actions.BaseAction, {
  name: 'multiple_grid_states',

  activate: function() {
    const grid = this.getGrid();
    if (!grid) return false;

    const stateItems = document.querySelectorAll(`#grid_states_${grid.name} .grid-state-item`);
    if (stateItems.length === 0) return false;

    stateItems.forEach(item => {
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
            window.displayErrorMessage(msg, "Error");
          }
        } catch (error) {
          console.error('Set current state error:', error);
          window.displayErrorMessage('An error occurred while switching states.', 'Network Error');
        }
      };
    });
  }
});

WulinMaster.ActionManager.register(WulinMaster.actions.MultipleGridStates);
