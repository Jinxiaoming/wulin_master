import ConfigManager from '../config_manager';

describe('ConfigManager', () => {
  beforeEach(() => {
    // Clear window mocks
    (window as any)._token = undefined;
    (window as any).MASTER_DETAIL_COLOR_THEME = undefined;
    (window as any).USDateFormat = undefined;
    document.head.innerHTML = '';
  });

  test('getCsrfToken returns token from window', () => {
    (window as any)._token = 'window-token';
    expect(ConfigManager.getCsrfToken()).toBe('window-token');
  });

  test('getCsrfToken returns token from meta tag if window token is missing', () => {
    const meta = document.createElement('meta');
    meta.name = 'csrf-token';
    meta.content = 'meta-token';
    document.head.appendChild(meta);
    
    expect(ConfigManager.getCsrfToken()).toBe('meta-token');
  });

  test('getMasterDetailColorTheme returns default teal', () => {
    expect(ConfigManager.getMasterDetailColorTheme()).toBe('teal');
  });

  test('getMasterDetailColorTheme returns configured theme', () => {
    (window as any).MASTER_DETAIL_COLOR_THEME = 'blue';
    expect(ConfigManager.getMasterDetailColorTheme()).toBe('blue');
  });

  test('isUsDateFormat returns value from window function', () => {
    (window as any).USDateFormat = () => true;
    expect(ConfigManager.isUsDateFormat()).toBe(true);
  });
});
