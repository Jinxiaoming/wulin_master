/**
 * Make Default Grid Action
 * Sets the selected grid state as the initial state for all users.
 */
WulinMaster.actions.MakeDefaultGrid = Object.assign({}, WulinMaster.actions.BaseAction, {
  name: "make_default_grid",

  handler: function () {
    const grid = this.getGrid();
    const ids = grid.getSelectedIds();

    if (ids.length !== 1) {
      window.displayErrorMessage("Please select exactly one grid state.", "Selection Error");
      return;
    }

    const gridId = ids[0];

    const modal = window.Ui.baseModal({
      onOpenStart: (modalEl) => {
        const content = modalEl.querySelector(".modal-content");
        content.innerHTML = `
          <p>This action will set the selected state as the initial grid state.</p>
          <p style="text-align: left">Are you sure?</p>
        `;
      },
      onCloseEnd: (modalEl) => modalEl.remove(),
    });
    
    modal.style.width = "400px";
    modal.style.height = "auto";

    const footer = window.Ui.appendModalFooter("Set as Initial", modal);
    const confirmBtn = footer.querySelector(".confirm-btn");
    
    confirmBtn.onclick = async () => {
      window.M.Modal.getInstance(modal).close();
      
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
          window.displayNewNotification("Initial grid has been successfully set!", "success");
          grid.loader.reloadData();
        } else {
          window.displayErrorMessage(result.message || "Failed to set initial grid.", "Error");
        }
      } catch (error) {
        console.error('Make default grid error:', error);
        window.displayErrorMessage("An unexpected error occurred.", "Network Error");
      }
    };
  },
});

WulinMaster.ActionManager.register(WulinMaster.actions.MakeDefaultGrid);
