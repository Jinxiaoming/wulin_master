// Panel system using Stimulus bridge
window.adjustPanelButtons = function(panelId){
  const element = document.getElementById(panelId);
  if (element) {
    if (!element.dataset.controller || !element.dataset.controller.includes("panel")) {
      element.dataset.controller = (element.dataset.controller ? element.dataset.controller + " " : "") + "panel";
      // We also need to mark the buttons target if it exists
      const btns = element.querySelector(".panel_btns");
      if (btns) {
        btns.dataset.panelTarget = "buttons";
      }
    }
    const controller = window.Stimulus.getControllerForElementAndIdentifier(element, "panel");
    if (controller) {
      controller.adjust();
    } else {
      // Fallback to jQuery
      var $panel = $("#" + panelId);
      var $btns = $panel.find(".panel_btns");
      if($btns.length === 0) return false;

      var panelHeight = $panel.height();
      var btnsHeight = $btns.height();
      var margin = (panelHeight - btnsHeight) / 2 * 0.8;
      $btns.css("margin-top", margin + "px");
    }
  }
};
