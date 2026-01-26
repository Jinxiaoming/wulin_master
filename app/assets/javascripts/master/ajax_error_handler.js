/**
 * Global AJAX and Fetch error handler for WulinMaster.
 */

/**
 * Handles errors from both legacy jQuery AJAX and modern Fetch API.
 * 
 * @param {Object} options - Error details
 * @param {number} options.status - HTTP status code
 * @param {string} options.responseText - Raw response text
 * @param {Object} [options.responseJSON] - Parsed JSON response
 * @param {Function} [options.getResponseHeader] - Function to get headers
 */
window.handleAjaxError = function(xhr) {
  let msg = xhr.responseText;
  let wulin_oauth;

  const contentType = typeof xhr.getResponseHeader === 'function' 
    ? xhr.getResponseHeader("content-type") 
    : xhr.headers?.get("content-type");

  const isJson = /application\/json/i.test(contentType);
  
  if (isJson && xhr.responseJSON) {
    msg = xhr.responseJSON.msg;
    wulin_oauth = xhr.responseJSON.wulin_oauth;
  }

  switch (xhr.status) {
    case 401:
      const error_message = wulin_oauth ? msg : `You are not authorized to do this operation, please contact admin to update your permission.\n${msg || ''}`;
      window.displayErrorMessage(error_message, "Permission denied");
      break;
    case 500:
      window.displayErrorMessage("An unexpected server error occurred.");
      break;
    default:
      if (xhr.status >= 400) {
        window.displayErrorMessage(msg || "An error occurred during the request.", `Error ${xhr.status}`);
      }
      break;
  }
};

// Legacy jQuery global handler (for any remaining jQuery AJAX calls)
if (typeof jQuery !== 'undefined') {
  $(document).off('ajaxError').on('ajaxError', function(_, xhr) {
    window.handleAjaxError(xhr);
  });
}
