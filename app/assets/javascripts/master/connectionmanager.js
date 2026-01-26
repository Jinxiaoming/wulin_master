/**
 * ConnectionManager handles the lifecycle of network requests for a RemoteModel.
 * It manages request deduplication, cancellation, and loading indicators.
 */
export default class ConnectionManager {
  constructor(remoteModel) {
    this.remoteModel = remoteModel;
    this.requests = new Map(); // Map of URL -> AbortController
  }

  /**
   * Creates a new connection (request) to the server.
   * 
   * @param {Object} grid - The SlickGrid instance
   * @param {string} url - The request URL
   * @param {Object} indicator - Legacy indicator (unused but kept for signature)
   * @param {Function} clientOnSuccess - Success callback
   * @param {Function} clientOnError - Error callback
   * @param {number} currentRequestVersionNumber - Version number to prevent out-of-order updates
   */
  async createConnection(grid, url, indicator, clientOnSuccess, clientOnError, currentRequestVersionNumber) {
    // If a request for this URL is already in progress, don't start a new one
    if (this.requests.has(url)) return;

    // UI: Show progress bar in grid header
    const container = grid.container;
    const header = container.querySelector('.slick-header');
    
    // Cleanup old progress bars
    const oldProgress = header.nextElementSibling;
    if (oldProgress && oldProgress.classList.contains('progress')) {
      oldProgress.remove();
    }

    // Create new progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'progress';
    progressBar.innerHTML = '<div class="indeterminate"></div>';
    header.insertAdjacentElement('afterend', progressBar);

    // Initial loading state for rows
    if (container.querySelectorAll('.slick-row').length === 0) {
      grid.renderLoadingRows({ top: 0, bottom: 30 });
    }
    
    const pagerStatus = container.querySelector('.slick-pager-status');
    if (pagerStatus) pagerStatus.textContent = 'Loading...';

    const loadingRows = container.querySelectorAll('.slick-row.loading');

    // Setup AbortController for cancellation
    const controller = new AbortController();
    this.requests.set(url, controller);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        signal: controller.signal
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      
      // Cleanup UI
      progressBar.remove();
      loadingRows.forEach(row => row.remove());

      // Version check: only process if this is the latest requested version
      const loader = grid.loader;
      if (currentRequestVersionNumber >= loader.lastRequestVersionNumber) {
        loader.lastRequestVersionNumber = currentRequestVersionNumber;
        clientOnSuccess(data, "success", { url, loader, versionNumber: currentRequestVersionNumber });
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
      } else {
        // Cleanup UI on error
        progressBar.remove();
        loadingRows.forEach(row => row.remove());
        clientOnError({ url }, "error", error.message);
      }
    } finally {
      this.requests.delete(url);
    }
  }

  /**
   * Checks if there are any active requests.
   */
  isEmpty() {
    return this.requests.size === 0;
  }

  /**
   * Cancels a specific connection by URL.
   */
  removeConnection(url) {
    const controller = this.requests.get(url);
    if (controller) {
      controller.abort();
      this.requests.delete(url);
    }
  }
}

// Global exposure for legacy compatibility
window.ConnectionManager = ConnectionManager;
