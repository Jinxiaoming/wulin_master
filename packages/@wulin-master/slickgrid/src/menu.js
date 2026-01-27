/**
 * Menu and Navigation Logic
 * 
 * This file handles the transition from legacy History.js/Ajax loading
 * to modern Turbo Drive.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize legacy menu behaviors
  initializeMenu();

  // side-navigation resize (Legacy jQuery UI Resizable removed)
  const nav = document.getElementById("navigation");
  const content = document.getElementById("content");

  // --- Turbo Integration ---
  
  // Listen for Turbo before-render to perform cleanup
  document.addEventListener("turbo:before-render", () => {
    const screenContainer = document.getElementById("screen_content");
    if (screenContainer) {
      const controller = window.Stimulus.getControllerForElementAndIdentifier(screenContainer, "screen");
      if (controller) {
        controller.beforeRender();
      }
    }
  });

  // Handle menu toggle via Stimulus bridge
  const menuToggle = document.getElementById("menu-toggle");
  if (menuToggle) {
    menuToggle.onclick = () => {
      const navElement = document.querySelector('[data-controller~="navigation"]');
      if (navElement) {
        const controller = window.Stimulus.getControllerForElementAndIdentifier(navElement, "navigation");
        if (controller) {
          controller.toggle();
          return;
        }
      }
      // Fallback
      if (content) content.classList.toggle('extended-panel');
      if (nav) nav.style.display = (nav.style.display === 'none' ? 'block' : 'none');
    };
  }
});

/**
 * Legacy Menu Initialization
 * Note: Links are now primarily handled by Turbo Drive.
 */
function initializeMenu() {
  const menuItems = document.querySelectorAll("#menu li.item a");
  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const url = item.getAttribute('href');

      if (/^https?:\/\//i.test(url)) {
        window.open(url);
        e.preventDefault();
        return;
      }

      selectMenuItem(url);
      // Turbo will automatically handle the link if it's within a turbo-frame or has data-turbo-frame
    });
  });

  const submenus = document.querySelectorAll("#menu li.submenu a");
  submenus.forEach(item => {
    item.onclick = (e) => {
      e.preventDefault();
      const ul = item.nextElementSibling;
      if (ul && ul.tagName === 'UL') {
        ul.style.display = (ul.style.display === 'none' || ul.style.display === '') ? 'block' : 'none';
      }
    };
  });

  setupMenuToolbar();
}

/**
 * Highlights the active menu item based on the current URL.
 */
function selectMenuItem(url) {
  const relativeUrl = url.replace(window.location.origin, '');
  document.querySelectorAll("#menu .active").forEach(el => el.classList.remove("active"));
  
  const currentLink = document.querySelector(`#menu li.item a[href="${relativeUrl}"]`);
  if (currentLink) {
    currentLink.parentElement.classList.add('active');
  }
}

/**
 * Sets up the menu toolbar actions (Expand, Collapse, Focus).
 */
function setupMenuToolbar() {
  const getNavController = () => {
    const nav = document.querySelector('[data-controller~="navigation"]');
    if (nav) {
      return window.Stimulus.getControllerForElementAndIdentifier(nav, "navigation");
    }
    return null;
  };

  const focusBtn = document.querySelector("#menu-toolbar li a#focus");
  if (focusBtn) {
    focusBtn.onclick = (e) => {
      e.preventDefault();
      getNavController()?.focusActive();
    };
  }

  const expandBtn = document.querySelector("#menu-toolbar li a#expand");
  if (expandBtn) {
    expandBtn.onclick = (e) => {
      e.preventDefault();
      getNavController()?.expandAll();
    };
  }

  const collapseBtn = document.querySelector("#menu-toolbar li a#collapse");
  if (collapseBtn) {
    collapseBtn.onclick = (e) => {
      e.preventDefault();
      getNavController()?.collapseAll();
    };
  }
}

/**
 * Global cleanup for SlickGrid editors.
 */
window.cleanUpEditors = function(id = false) {
  if (id) {
    document.querySelectorAll(`.select-editor[data-id="${id}"], .textarea-wrapper[data-id="${id}"]`).forEach(el => el.remove());
  } else {
    document.querySelectorAll(".select-editor, .textarea-wrapper").forEach(el => el.remove());
  }
};
