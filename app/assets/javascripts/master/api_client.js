/**
 * ApiClient provides a unified interface for making HTTP requests.
 * It handles CSRF tokens, error handling, and common headers.
 */
class ApiClient {
  constructor() {
    this.defaultHeaders = {
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }

  /**
   * Gets the CSRF token from the window or meta tags.
   */
  getCsrfToken() {
    return decodeURIComponent(window._token || document.querySelector('meta[name="csrf-token"]')?.content || '');
  }

  /**
   * Performs a fetch request with unified logic.
   */
  async request(url, options = {}) {
    const method = options.method || 'GET';
    const headers = { ...this.defaultHeaders, ...options.headers };
    
    // Don't set Content-Type for FormData to let the browser set the boundary
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
      headers['X-CSRF-Token'] = this.getCsrfToken();
    }

    const fetchOptions = {
      ...options,
      method,
      headers
    };

    // Global loading state start
    document.body.classList.add('api-loading');

    try {
      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        // Handle global errors via the existing handler
        if (window.handleAjaxError) {
          window.handleAjaxError(response);
        }
        throw response;
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      }
      return await response.text();
    } catch (error) {
      console.error(`API Request failed: ${method} ${url}`, error);
      throw error;
    } finally {
      // Global loading state end
      document.body.classList.remove('api-loading');
    }
  }

  get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  post(url, body, options = {}) {
    return this.request(url, { ...options, method: 'POST', body: JSON.stringify(body) });
  }

  put(url, body, options = {}) {
    return this.request(url, { ...options, method: 'PUT', body: JSON.stringify(body) });
  }

  delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }
}

const apiClient = new ApiClient();
window.apiClient = apiClient;
export default apiClient;
