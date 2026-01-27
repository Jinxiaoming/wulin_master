import { IconManager } from '@wulin-master/core';

/**
 * Fullscreen Action
 * Toggles the grid container to fill the entire viewport.
 */
WulinMaster.actions.fullscreen = Object.assign({}, WulinMaster.actions.BaseAction, {
  name: 'fullscreen',
  
  handler: function (e: MouseEvent) {
    const btn = e.currentTarget as HTMLElement;
    const grid = this.getGrid();
    const container = grid.container;

    this.toggleSiblings(container);
    this.transform(btn, container);
    this.switchIcon(btn);
  },

  /**
   * Toggles visibility of all sibling elements of the grid container.
   */
  toggleSiblings: function(container: HTMLElement) {
    const siblings = Array.from(container.parentElement?.children || []);
    siblings.forEach(el => {
      if (el !== container && el.tagName !== 'SCRIPT') {
        const htmlEl = el as HTMLElement;
        htmlEl.style.display = (htmlEl.style.display === 'none') ? '' : 'none';
      }
    });
  },

  /**
   * Adjusts the container size and stores/restores original dimensions.
   */
  transform: function(btn: HTMLElement, container: HTMLElement) {
    const isFullscreen = btn.dataset.fullscreen === 'true';
    
    if (isFullscreen) {
      const originalHeight = btn.dataset.gridHeight;
      const originalWidth = btn.dataset.gridWidth;

      delete btn.dataset.fullscreen;
      delete btn.dataset.gridHeight;
      delete btn.dataset.gridWidth;

      container.style.height = originalHeight || '';
      container.style.width = originalWidth || '';
    } else {
      btn.dataset.fullscreen = 'true';
      btn.dataset.gridHeight = container.style.height || `${container.offsetHeight}px`;
      btn.dataset.gridWidth = container.style.width || `${container.offsetWidth}px`;

      container.style.height = '100%';
      container.style.width = '100%';
    }

    // Trigger grid resize
    window.gridManager.resizeGrids();
  },

  /**
   * Updates the icon and labels for the fullscreen button.
   */
  switchIcon: function(btn: HTMLElement) {
    const isFullscreen = btn.dataset.fullscreen === 'true';
    const iconName = isFullscreen ? 'minimize' : 'maximize';
    
    const iconContainer = btn.querySelector('.wulin-icon-container') || btn;
    iconContainer.innerHTML = IconManager.getIconHtml(iconName, { class: 'wulin-icon' });

    const label = btn.querySelector('span.toolbar-text');
    if (label) {
      label.textContent = isFullscreen ? 'Exit Fullscreen' : 'Fullscreen';
    }

    const tooltip = btn.getAttribute('data-tooltip');
    if (tooltip) {
      btn.setAttribute('data-tooltip', isFullscreen ? 'Exit Fullscreen' : 'Fullscreen');
    }
  }
});

WulinMaster.ActionManager.register(WulinMaster.actions.fullscreen);
