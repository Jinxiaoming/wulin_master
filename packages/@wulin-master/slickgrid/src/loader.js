/**
 * Loader utilities for WulinMaster.
 * Modernized to use Stimulus bridge and remove jQuery.
 */
(function() {
  /**
   * Appends a loading spinner to an element.
   */
  function appendLoader(element) {
    if (!element) return;
    
    const controller = window.Stimulus.getControllerForElementAndIdentifier(element, "loader");
    if (controller) {
      controller.append();
    } else {
      if (!element.querySelector(".ajax-loading")) {
        const loader = document.createElement('div');
        loader.className = 'ajax-loading';
        element.appendChild(loader);
      }
    }
  }

  /**
   * Removes a loading spinner from an element.
   */
  function removeLoader(element) {
    if (!element) return;

    const controller = window.Stimulus.getControllerForElementAndIdentifier(element, "loader");
    if (controller) {
      controller.remove();
    } else {
      element.querySelector(".ajax-loading")?.remove();
    }
  }

  // Export to window for global access
  window.appendLoader = appendLoader;
  window.removeLoader = removeLoader;
})();
