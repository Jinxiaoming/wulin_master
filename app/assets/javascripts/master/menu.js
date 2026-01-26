/**
 * Menu and Navigation Logic
 * 
 * This file handles the transition from legacy History.js/Ajax loading
 * to modern Turbo Drive.
 */

let currentUrl = null;

$(document).ready(function() {
  // Initialize legacy menu behaviors that haven't been moved to Stimulus yet
  initialize_menu();

  // Bridge for side-navigation resize (Legacy jQuery UI Resizable)
  $("#navigation").resizable({ 
    handles: 'e, w', 
    minWidth: 199, 
    maxWidth: 500 
  });

  // Handle navigation resize events to adjust main content area
  $("#navigation").bind("resize", function() {
    $("#content").css('left', $("#navigation").width() + 1);
    $("#navigation").css('height', 'auto');
  });

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
  $("#menu-toggle").click(function() {
    const nav = document.querySelector('[data-controller~="navigation"]');
    if (nav) {
      const controller = window.Stimulus.getControllerForElementAndIdentifier(nav, "navigation");
      if (controller) {
        controller.toggle();
        return;
      }
    }
    $('#content').toggleClass('extended-panel');
    $("#navigation").toggle();
  });
});

/**
 * Legacy Menu Initialization
 * Note: Links are now primarily handled by Turbo Drive.
 */
function initialize_menu() {
  // Click handler for menu items
  $("#menu li.item a").on('click', function(e) {
    const url = $(this).attr('href');

    // Handle absolute URLs
    if (/^https?:\/\//i.test(url)) {
      window.open(url);
      e.preventDefault();
      return;
    }

    // Turbo will handle the navigation automatically if not an absolute URL.
    // We just need to manage the 'active' state.
    selectMenuItem(url);
  });

  // Submenu toggle (Legacy)
  $("#menu li.submenu a").click(function() {
    $(this).siblings("ul").toggle();
    return false;
  });

  // Expand/Collapse/Focus toolbar actions
  setupMenuToolbar();
}

/**
 * Highlights the active menu item based on the current URL.
 */
function selectMenuItem(url) {
  const relativeUrl = url.replace(window.location.origin, '');
  $("#menu .active").removeClass("active");
  const $currentLink = $(`#menu li.item a[href="${relativeUrl}"]`);
  $currentLink.parent().addClass('active');
}

/**
 * Sets up the menu toolbar actions (Expand, Collapse, Focus).
 */
function setupMenuToolbar() {
  // Focus on current active item
  $("#menu-toolbar li a#focus").click(function() {
    const nav = document.querySelector('[data-controller~="navigation"]');
    if (nav) {
      const controller = window.Stimulus.getControllerForElementAndIdentifier(nav, "navigation");
      if (controller) controller.focusActive();
    }
  });

  // Expand all submenus
  $("#menu-toolbar li a#expand").click(function() {
    const nav = document.querySelector('[data-controller~="navigation"]');
    if (nav) {
      const controller = window.Stimulus.getControllerForElementAndIdentifier(nav, "navigation");
      if (controller) controller.expandAll();
    }
  });

  // Collapse all submenus
  $("#menu-toolbar li a#collapse").click(function() {
    const nav = document.querySelector('[data-controller~="navigation"]');
    if (nav) {
      const controller = window.Stimulus.getControllerForElementAndIdentifier(nav, "navigation");
      if (controller) controller.collapseAll();
    }
  });
}

/**
 * Global cleanup for SlickGrid editors.
 */
function cleanUpEditors(id = false) {
  if (id) {
    $(`.select-editor[data-id="${id}"]`).remove();
    $(`.textarea-wrapper[data-id="${id}"]`).remove();
  } else {
    $(".select-editor").remove();
    $(".textarea-wrapper").remove();
  }
}
