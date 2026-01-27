/**
 * ConfigManager handles Rails-injected global configurations and tokens.
 * It provides a centralized, type-safe way to access environment variables.
 */
export const ConfigManager = {
  /**
   * Gets the CSRF token from window or meta tags.
   */
  getCsrfToken(): string {
    return (window as any)._token || 
           document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || 
           '';
  },

  /**
   * Gets a global configuration value with a default fallback.
   */
  get<T>(key: string, defaultValue: T): T {
    return (window as any)[key] !== undefined ? (window as any)[key] : defaultValue;
  },

  /**
   * Checks if the application is in US date format mode.
   */
  isUsDateFormat(): boolean {
    if (typeof (window as any).USDateFormat === 'function') {
      return (window as any).USDateFormat();
    }
    return !!(window as any).USDateFormat;
  },

  /**
   * Gets the configured color theme for master-detail grids.
   */
  getMasterDetailColorTheme(): string {
    return this.get('MASTER_DETAIL_COLOR_THEME', 'teal');
  }
};

export default ConfigManager;
