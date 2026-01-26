/**
 * Fullscreen Action
 * Toggles the grid container to fill the entire viewport.
 */
WulinMaster.actions.fullscreen = Object.assign({}, WulinMaster.actions.BaseAction, {
  name: 'fullscreen',
  
  handler: function (e) {
    const btn = e.currentTarget;
    const grid = this.getGrid();
    const container = grid.container instanceof jQuery ? grid.container[0] : grid.container;

    this.toggleSiblings(container);
    this.transform(btn, container);
    this.switchIcon(btn);
  },

  /**
   * Toggles visibility of all sibling elements of the grid container.
   */
  toggleSiblings: function(container) {
    const siblings = Array.from(container.parentElement.children);
    siblings.forEach(el => {
      if (el !== container && el.tagName !== 'SCRIPT') {
        el.style.display = (el.style.display === 'none') ? '' : 'none';
      }
    });
  },

  /**
   * Adjusts the container size and stores/restores original dimensions.
   */
  transform: function(btn, container) {
    const isFullscreen = btn.dataset.fullscreen === 'true';
    
    if (isFullscreen) {
      const originalHeight = btn.dataset.gridHeight;
      const originalWidth = btn.dataset.gridWidth;

      delete btn.dataset.fullscreen;
      delete btn.dataset.gridHeight;
      delete btn.dataset.gridWidth;

      container.style.height = originalHeight;
      container.style.width = originalWidth;
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
  switchIcon: function(btn) {
    const icon = btn.querySelector('a.fullscreen_action, i.material-icons');
    if (icon) {
      icon.textContent = (icon.textContent === 'fullscreen') ? 'fullscreen_exit' : 'fullscreen';
    }

    const label = btn.querySelector('a.fullscreen_action, span');
    if (label) {
      label.textContent = (label.textContent === 'Fullscreen') ? 'Exit Fullscreen' : 'Fullscreen';
    }

    const tooltip = btn.getAttribute('data-tooltip');
    if (tooltip) {
      btn.setAttribute('data-tooltip', (tooltip === 'Fullscreen') ? 'Exit Fullscreen' : 'Fullscreen');
    }
  }
});

WulinMaster.ActionManager.register(WulinMaster.actions.fullscreen);
