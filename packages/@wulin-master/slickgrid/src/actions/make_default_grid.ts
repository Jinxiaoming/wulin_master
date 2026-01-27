import { GridAction } from '@wulin-master/core';
import { BaseAction, ActionManager } from '../action_manager';

/**
 * Make Default Grid Action
 * Sets the selected grid state as the initial state for all users.
 */
const MakeDefaultGridAction: GridAction = Object.assign({}, BaseAction, {
  name: "make_default_grid",

  handler: function (this: GridAction) {
    const grid = this.target;
    if (!grid) return;
    const ids = (grid as any).getSelectedIds();

    if (ids.length !== 1) {
      window.WulinMaster.displayErrorMessage("Please select exactly one grid state.", "Selection Error");
      return;
    }

    const gridId = ids[0];

    const modal = window.WulinMaster.Ui.baseModal({
      onOpenStart: (modalEl: HTMLElement) => {
        const content = modalEl.querySelector(".modal-content") as HTMLElement;
        content.innerHTML = `
          <p>This action will set the selected state as the initial grid state.</p>
          <p style="text-align: left">Are you sure?</p>
        `;
      },
      onCloseEnd: (modalEl: HTMLElement) => modalEl.remove(),
    });
    
    modal.style.width = "400px";
    modal.style.height = "auto";

    const footer = window.WulinMaster.Ui.appendModalFooter("Set as Initial", modal);
    const confirmBtn = footer.querySelector(".confirm-btn") as HTMLButtonElement;
    
    confirmBtn.onclick = async () => {
      window.WulinMaster.M.Modal.getInstance(modal).close();
      
      const url = `/wulin_master/grid_states/set_as_initial`;
      const payload = {
        id: gridId,
        authenticity_token: decodeURIComponent(window._token || '')
      };

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.success) {
          window.WulinMaster.displayNewNotification("Initial grid has been successfully set!", "success");
          grid.loader.reloadData();
        } else {
          window.WulinMaster.displayErrorMessage(result.message || "Failed to set initial grid.", "Error");
        }
      } catch (error) {
        console.error('Make default grid error:', error);
        window.WulinMaster.displayErrorMessage("An unexpected error occurred.", "Network Error");
      }
    };
  },
});

ActionManager.register(MakeDefaultGridAction);
export default MakeDefaultGridAction;
