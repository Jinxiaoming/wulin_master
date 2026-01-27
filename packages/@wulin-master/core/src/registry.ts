/**
 * Registry for WulinMaster components.
 * Replaces brittle string-to-window resolution.
 */
class Registry {
  private formatters: Record<string, any>;
  private editors: Record<string, any>;

  constructor() {
    this.formatters = {};
    this.editors = {};
  }

  registerFormatter(name: string, formatter: any): void {
    this.formatters[name] = formatter;
  }

  registerEditor(name: string, editor: any): void {
    this.editors[name] = editor;
  }

  getFormatter(name: string): any {
    return this.formatters[name] || (window as any)[name]; // Fallback to window for legacy
  }

  getEditor(name: string): any {
    return this.editors[name] || (window as any)[name];
  }
}

const registry = new Registry();
export default registry;
