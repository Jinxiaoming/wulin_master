/**
 * Add Detail Action
 * Opens a modal to attach existing records to a middle table (many-to-many).
 */
WulinMaster.actions.AddDetail = Object.assign({}, WulinMaster.actions.BaseAction, {
  name: 'add_detail',

  handler: function() {
    const self = this;
    const masterId = this.target.master.filter_value;

    const addDetailModal = window.Ui.headerModal('Attach', {
      onOpenStart: (modal) => {
        const content = modal.querySelector('.modal-content');
        if (content) {
          content.style.padding = '0';
          this.getModelGrid(masterId, content);
        }
      }
    });

    if (this.dialog_options?.width) {
      addDetailModal.style.width = `${this.dialog_options.width}px`;
    }

    const modalFooter = window.Ui.appendModalFooter('Attach', addDetailModal);
    const confirmBtn = modalFooter.querySelector('.confirm-btn');
    
    confirmBtn.classList.add('disabled');
    confirmBtn.onclick = () => {
      confirmBtn.disabled = true;
      this.appendNewRecordToMiddleTable(masterId, addDetailModal);
    };
  },

  /**
   * Fetches the grid for selecting records to attach.
   */
  getModelGrid: async function(masterId, modalContentDom) {
    const master = Object.assign({}, this.target.master);
    const screen = this.screen;
    const model = this.model;
    const middleModel = this.target.model;

    try {
      // 1. Get the controller name for the model
      const detailCtrlUrl = `/wulin_master/detail_controller?model=${model}&middle_model=${middleModel}`;
      const ctrlResponse = await fetch(detailCtrlUrl, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
      const ctrlData = await ctrlResponse.json();

      // 2. Fetch the grid HTML
      const gridUrl = `/${ctrlData.controller}?screen=${screen}&filters[][column]=${master.filter_column}&filters[][value]=${masterId}&filters[][operator]=exclude`;
      const gridResponse = await fetch(gridUrl, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
      const gridHtml = await gridResponse.text();

      modalContentDom.innerHTML = gridHtml;

      // 3. Initialize the grid
      const gridContainer = modalContentDom.querySelector(".grid_container");
      const gridName = gridContainer?.getAttribute("name");
      const grid = window.gridManager.getGrid(gridName);
      
      if (grid) {
        master.filter_operator = 'exclude';
        if (Array.isArray(grid.master)) {
          grid.master.push(Object.values(master));
        } else {
          grid.master = master;
        }

        this.setGridHeightInModal(modalContentDom.parentElement);
        window.Ui.resizeGrid(grid);
        window.Ui.resetHeightOfModalContent(modalContentDom);

        // Wait for data to load then resize
        const checkRows = setInterval(() => {
          if (grid.container.querySelectorAll('.slick-row').length > 0) {
            window.gridManager.resizeGrids();
            clearInterval(checkRows);
          }
        }, 200);
      }
    } catch (error) {
      console.error('Error loading model grid:', error);
      window.displayErrorMessage('Failed to load selection grid.', 'Error');
    }
  },

  /**
   * Sends the attach request to the server.
   */
  appendNewRecordToMiddleTable: async function(masterId, modal) {
    const content = modal.querySelector('.modal-content');
    const gridContainer = content.querySelector(".grid_container");
    const gridName = gridContainer?.getAttribute("name");
    const detailGrid = window.gridManager.getGrid(gridName);
    
    if (!detailGrid) return;

    const detailIds = detailGrid.getSelectedIds();
    const middleModel = this.target.model;
    
    const payload = {
      master_column: this.target.master.filter_column,
      master_id: masterId,
      detail_model: this.model,
      detail_ids: detailIds,
      model: middleModel,
      authenticity_token: decodeURIComponent(window._token || '')
    };

    try {
      const response = await fetch('/wulin_master/attach_details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      window.displayNewNotification(result.message, 'success');
      window.M.Modal.getInstance(modal).close();
      
      this.target.loader.reloadData();
      if (this.reload_master && this.target.master_grid) {
        this.target.master_grid.loader.reloadData();
      }
    } catch (error) {
      console.error('Attach error:', error);
      window.displayErrorMessage('Failed to attach records.', 'Network Error');
    }
  }
});

WulinMaster.ActionManager.register(WulinMaster.actions.AddDetail);
