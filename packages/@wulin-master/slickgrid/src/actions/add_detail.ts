import { WulinGrid, GridAction } from '@wulin-master/core';
import { BaseAction, ActionManager } from '../action_manager';

/**
 * Add Detail Action
 * Opens a modal to attach existing records to a middle table (many-to-many).
 */
const AddDetailAction: GridAction = Object.assign({}, BaseAction, {
  name: 'add_detail',

  handler: function(this: GridAction) {
    const grid = this.target;
    if (!grid) return;
    const masterId = (grid as any).master.filter_value;

    const addDetailModal = window.WulinMaster.Ui.headerModal('Attach', {
      onOpenStart: (modal: HTMLElement) => {
        const content = modal.querySelector('.modal-content') as HTMLElement;
        if (content) {
          content.style.padding = '0';
          this.getModelGrid(masterId, content);
        }
      }
    });

    if ((this as any).dialog_options?.width) {
      addDetailModal.style.width = `${(this as any).dialog_options.width}px`;
    }

    const modalFooter = window.WulinMaster.Ui.appendModalFooter('Attach', addDetailModal);
    const confirmBtn = modalFooter.querySelector('.confirm-btn') as HTMLButtonElement;
    
    confirmBtn.classList.add('disabled');
    confirmBtn.onclick = () => {
      confirmBtn.disabled = true;
      this.appendNewRecordToMiddleTable(masterId, addDetailModal);
    };
  },

  /**
   * Fetches the grid for selecting records to attach.
   */
  getModelGrid: async function(this: GridAction, masterId: any, modalContentDom: HTMLElement) {
    const grid = this.target;
    if (!grid) return;
    const master = Object.assign({}, (grid as any).master);
    const screen = (this as any).screen;
    const model = (this as any).model;
    const middleModel = grid.model;

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
      const detailGrid = window.WulinMaster.gridManager.getGrid(gridName || "");
      
      if (detailGrid) {
        master.filter_operator = 'exclude';
        if (Array.isArray((detailGrid as any).master)) {
          (detailGrid as any).master.push(Object.values(master));
        } else {
          (detailGrid as any).master = master;
        }

        this.setGridHeightInModal(modalContentDom.parentElement as HTMLElement);
        window.WulinMaster.Ui.resizeGrid(detailGrid);
        window.WulinMaster.Ui.resetHeightOfModalContent(modalContentDom);

        // Wait for data to load then resize
        const checkRows = setInterval(() => {
          if (detailGrid.container.querySelectorAll('.slick-row').length > 0) {
            window.WulinMaster.gridManager.resizeGrids();
            clearInterval(checkRows);
          }
        }, 200);
      }
    } catch (error) {
      console.error('Error loading model grid:', error);
      window.WulinMaster.displayErrorMessage('Failed to load selection grid.', 'Error');
    }
  },

  /**
   * Sends the attach request to the server.
   */
  appendNewRecordToMiddleTable: async function(this: GridAction, masterId: any, modal: HTMLElement) {
    const grid = this.target;
    if (!grid) return;
    const content = modal.querySelector('.modal-content') as HTMLElement;
    const gridContainer = content.querySelector(".grid_container");
    const gridName = gridContainer?.getAttribute("name");
    const detailGrid = window.WulinMaster.gridManager.getGrid(gridName || "");
    
    if (!detailGrid) return;

    const detailIds = (detailGrid as any).getSelectedIds();
    const middleModel = grid.model;
    
    const payload = {
      master_column: (grid as any).master.filter_column,
      master_id: masterId,
      detail_model: (this as any).model,
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
      window.WulinMaster.displayNewNotification(result.message, 'success');
      window.WulinMaster.M.Modal.getInstance(modal).close();
      
      grid.loader.reloadData();
      if ((this as any).reload_master && (grid as any).master_grid) {
        (grid as any).master_grid.loader.reloadData();
      }
    } catch (error) {
      console.error('Attach error:', error);
      window.WulinMaster.displayErrorMessage('Failed to attach records.', 'Network Error');
    }
  }
});

ActionManager.register(AddDetailAction);
export default AddDetailAction;
