// Loader system using Stimulus bridge
$.fn.append_loader = function() {
  const element = this[0];
  if (element) {
    if (!element.dataset.controller || !element.dataset.controller.includes("loader")) {
      element.dataset.controller = (element.dataset.controller ? element.dataset.controller + " " : "") + "loader";
    }
    const controller = window.Stimulus.getControllerForElementAndIdentifier(element, "loader");
    if (controller) {
      controller.append();
    } else {
      // Fallback if controller not yet connected
      if (!$(element).find(".ajax-loading").length) {
        $(element).append('<div class="ajax-loading"></div>');
      }
    }
  }
};

$.fn.remove_loader = function() {
  const element = this[0];
  if (element) {
    const controller = window.Stimulus.getControllerForElementAndIdentifier(element, "loader");
    if (controller) {
      controller.remove();
    } else {
      $(element).find(".ajax-loading").remove();
    }
  }
};
