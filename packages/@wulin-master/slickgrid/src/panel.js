/**
 * Panel utilities for WulinMaster.
 * Modernized to use Stimulus bridge.
 */
window.adjustPanelButtons = function(panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;

  const controller = window.Stimulus.getControllerForElementAndIdentifier(panel, "panel");
  if (controller) {
    controller.adjust();
  } else {
    const btns = panel.querySelector(".panel_btns");
    if (btns) {
      const panelHeight = panel.offsetHeight;
      const btnsHeight = btns.offsetHeight;
      const margin = (panelHeight - btnsHeight) / 2 * 0.8;
      btns.style.marginTop = `${margin}px`;
    }
  }
};
