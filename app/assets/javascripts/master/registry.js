/**
 * Registry for WulinMaster components.
 * Replaces brittle string-to-window resolution.
 */
class Registry {
  constructor() {
    this.formatters = {};
    this.editors = {};
  }

  registerFormatter(name, formatter) {
    this.formatters[name] = formatter;
  }

  registerEditor(name, editor) {
    this.editors[name] = editor;
  }

  getFormatter(name) {
    return this.formatters[name] || window[name]; // Fallback to window for legacy
  }

  getEditor(name) {
    return this.editors[name] || window[name];
  }
}

const registry = new Registry();
export default registry;
