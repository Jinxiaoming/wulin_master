// Materialize auto-init is now handled by Stimulus materialize controller
// for new elements. This global init is kept for the initial page load.
document.addEventListener('DOMContentLoaded', function () {
  M.AutoInit();
});
