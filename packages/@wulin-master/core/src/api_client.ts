import ConfigManager from './config_manager';

/**
 * ApiClient provides a unified interface for making HTTP requests.
 * It handles CSRF tokens, error handling, and common headers.
 */
class ApiClient {
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.defaultHeaders = {
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }

  /**
   * Performs a fetch request with unified logic.
   */
  async request(url: string, options: RequestInit = {}): Promise<any> {
    const method = options.method || 'GET';
    const headers: Record<string, string> = { ...this.defaultHeaders, ...(options.headers as Record<string, string>) };
    
    // Don't set Content-Type for FormData to let the browser set the boundary
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
      headers['X-CSRF-Token'] = ConfigManager.getCsrfToken();
    }

    const fetchOptions: RequestInit = {
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
        const win = window as any;
        if (win.handleAjaxError) {
          win.handleAjaxError(response);
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

  get(url: string, options: RequestInit = {}): Promise<any> {
    return this.request(url, { ...options, method: 'GET' });
  }

  post(url: string, body: any, options: RequestInit = {}): Promise<any> {
    const requestOptions: RequestInit = { ...options, method: 'POST' };
    if (!(body instanceof FormData)) {
      requestOptions.body = JSON.stringify(body);
    } else {
      requestOptions.body = body;
    }
    return this.request(url, requestOptions);
  }

  put(url: string, body: any, options: RequestInit = {}): Promise<any> {
    const requestOptions: RequestInit = { ...options, method: 'PUT' };
    if (!(body instanceof FormData)) {
      requestOptions.body = JSON.stringify(body);
    } else {
      requestOptions.body = body;
    }
    return this.request(url, requestOptions);
  }

  delete(url: string, options: RequestInit = {}): Promise<any> {
    return this.request(url, { ...options, method: 'DELETE' });
  }
}

const apiClient = new ApiClient();
(window as any).apiClient = apiClient;
export default apiClient;
