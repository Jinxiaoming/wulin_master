/**
 * SlickGrid Formatters for WulinMaster.
 * Modernized to use ES6 and native DOM APIs.
 */

const SlickFormatter = {
  /**
   * Helper to apply styles and classes to a node or string.
   */
  applyStyle: function(node, styleClass, style) {
    if (node === null || node === undefined) return '';

    const span = document.createElement('span');
    if (styleClass) span.className = styleClass;
    if (style) span.style.cssText = style;

    if (node instanceof Node) {
      span.appendChild(node);
    } else {
      span.textContent = String(node);
    }

    return span.outerHTML;
  },

  /**
   * Parses a date-time string into its components.
   */
  parseDateTime: function(dateTimeStr) {
    try {
      const REGEX_DATE = '(\\d{2})\\/(\\d{2})\\/(\\d{4})';
      const REGEX_TIME = '(\\d{2}):(\\d{2})';
      const matchedArr = dateTimeStr.match(new RegExp(`^${REGEX_DATE}[ \\t]${REGEX_TIME}$`));

      if (!matchedArr) return null;

      return {
        day: matchedArr[1],
        month: matchedArr[2],
        year: matchedArr[3],
        hour: matchedArr[4],
        minute: matchedArr[5]
      };
    } catch (err) {
      return null;
    }
  },

  /**
   * Default formatter for grid cells.
   */
  BaseFormatter: function(row, cell, value, columnDef, dataContext) {
    const source = columnDef.source;
    const innerFormatter = columnDef.inner_formatter;

    // Retrieve info for relation columns
    if (source && value && typeof value === 'object') {
      value = value[source];
    }

    // Apply format for relation columns
    if (innerFormatter) {
      if (innerFormatter === 'boolean') {
        return SlickFormatter.TextBoolCellFormatter(row, cell, !!value, columnDef, dataContext);
      } else if (typeof window[innerFormatter] === 'function') {
        return window[innerFormatter](row, cell, value, columnDef, dataContext);
      }
    }

    // Filter `null` value for 'has_many' columns
    if (columnDef.type === 'has_many' && value === 'null') {
      value = '';
    }

    // Apply Format based on value type
    if (Array.isArray(value)) {
      const delimiter = columnDef.delimiter || ', ';
      value = value.join(delimiter);
    }

    // Set default text-align
    let textAlign = '';
    if (['datetime', 'date', 'time'].includes(columnDef.type)) {
      textAlign = 'center';
    }
    const defaultStyle = textAlign ? `text-align: ${textAlign}` : '';

    return SlickFormatter.applyStyle(value, columnDef.style_class, columnDef.style || defaultStyle);
  },

  /**
   * Formats numbers with delimiters and precision.
   */
  NumberWithDelimiterFormatter: function(row, cell, value, columnDef) {
    const { precision = 0, prefix = "", suffix = "", fallback = "" } = columnDef;

    if (value === null || value === undefined || value === "") return fallback;

    const num = parseFloat(value);
    const formatted = num.toLocaleString(undefined, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    });

    return SlickFormatter.applyStyle(`${prefix}${formatted}${suffix}`, columnDef.style_class, columnDef.style || '');
  },

  /**
   * Formats a value as a blue underlined link.
   */
  URLFormatter: function(row, cell, value, columnDef) {
    const span = document.createElement("span");
    span.style.display = "inline-block";
    span.style.color = "#1068bf";
    span.style.textDecoration = "underline";
    span.textContent = value;

    return SlickFormatter.applyStyle(span, columnDef.style_class, columnDef.style || '');
  },

  /**
   * Formats a value as currency.
   */
  MoneyFormatter: function(row, cell, value, columnDef) {
    const currency = columnDef.currency || "$";
    const precision = columnDef.precision === undefined ? 2 : columnDef.precision;

    if (value === null || value === undefined || value === '') return '';

    const num = parseFloat(value);
    const formatted = num.toLocaleString(undefined, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    });

    const text = columnDef.position_of_currency === 'before' ? `${currency} ${formatted}` : `${formatted} ${currency}`;
    return SlickFormatter.applyStyle(text, columnDef.style_class, columnDef.style || '');
  },

  /**
   * Formats boolean values as Yes/No text.
   */
  TextBoolCellFormatter: function(row, cell, value, columnDef) {
    let text = '';
    if (Array.isArray(value)) {
      text = value.filter(e => e != null).map(e => (e ? 'Yes' : 'No')).join(', ');
    } else {
      text = value === null ? '' : (value ? 'Yes' : 'No');
    }

    return SlickFormatter.applyStyle(text, columnDef.style_class, columnDef.style || 'text-align: center');
  },

  /**
   * Formats boolean values as a graphical checkbox.
   */
  GraphicBoolCellFormatter: function(row, cell, value, columnDef) {
    if (!value) return '';

    const label = document.createElement('label');
    label.style.textAlign = 'center';
    label.style.display = 'inline-block';

    const input = document.createElement('input');
    input.disabled = true;
    input.type = 'checkbox';
    input.className = 'filled-in';
    input.checked = true;
    input.id = `show-checkbox-${row}-${cell}`;

    const span = document.createElement('span');
    span.setAttribute('for', input.id);

    label.appendChild(input);
    label.appendChild(span);

    return SlickFormatter.applyStyle(label, columnDef.style_class, columnDef.style || 'text-align: center');
  },

  /**
   * Formats zero values as empty strings.
   */
  ZeroFormatter: function(row, cell, value, columnDef) {
    const text = value === 0 ? "" : value;
    return SlickFormatter.applyStyle(text, columnDef.style_class, columnDef.style || 'text-align: right');
  },

  /**
   * Adds a tooltip to the cell content.
   */
  TooltipFormatter: function(row, cell, value, columnDef, dataContext) {
    const tooltip = columnDef.tooltips ? columnDef.tooltips[value] : '';
    const content = SlickFormatter.applyStyle(value, columnDef.style_class, columnDef.style || 'text-align: center');
    return `<div title='${tooltip}'>${content}</div>`;
  },

  /**
   * Formats a value as an image tag.
   */
  ImageFormatter: function(row, cell, value, columnDef) {
    if (value == null) return "";

    const style = columnDef.style || 'text-align: center';
    return `<div style='${style}'><img src='${value}' /></div>`;
  },

  /**
   * Formats a value as a percentage.
   */
  PercentageFormatter: function(row, cell, value, columnDef) {
    const sign = columnDef.percentageSign || "%";
    const precision = columnDef.precision === undefined ? 0 : columnDef.precision;

    if (value === null || value === undefined) return '';

    const num = parseFloat(value);
    const text = `${num.toFixed(precision)}${sign}`;

    return SlickFormatter.applyStyle(text, columnDef.style_class, columnDef.style || '');
  },

  /**
   * Formats a decimal value as a percentage (e.g., 0.12 -> 12%).
   */
  DecimalPercentageFormatter: function(row, cell, value, columnDef) {
    const sign = columnDef.percentageSign || "%";
    const precision = columnDef.precision || 0;

    if (Number(value) === 0) return "";

    const num = Number(value) * 100;
    const text = `${num.toFixed(precision)}${sign}`;

    return SlickFormatter.applyStyle(text, columnDef.style_class, columnDef.style || '');
  },

  /**
   * Formats a number and removes redundant trailing zeros.
   */
  DeleteRedundantDecimals: function(row, cell, value, columnDef) {
    if (!value) return '';

    const precision = columnDef.precision || 0;
    let text = parseFloat(value).toFixed(precision).toString();

    const regexp = new RegExp(`(\\.0{${precision}}$)`);
    text = text.replace(regexp, '');

    return SlickFormatter.applyStyle(text, columnDef.style_class, columnDef.style || '');
  },

  /**
   * Formats a date using the ISO format (YYYY-MM-DD).
   */
  DateFormatter: function(row, cell, value, columnDef) {
    if (value === null) return '';
    
    // Note: format() is a legacy extension on Date. 
    // We'll try to use it if available, otherwise fallback to native.
    const date = new Date(value);
    const text = typeof date.format === 'function' ? date.format('isoDate') : date.toISOString().split('T')[0];

    return SlickFormatter.applyStyle(text, columnDef.style_class, columnDef.style || '');
  },

  /**
   * Replaces null values with a custom string.
   */
  NullOverrideFormatter: function(row, cell, value, columnDef) {
    if (value === null && columnDef.value_to_replace_null !== undefined) {
      value = columnDef.value_to_replace_null;
    }

    return SlickFormatter.applyStyle(value, columnDef.style_class, columnDef.style || '');
  },
};

// Export to window for SlickGrid compatibility
Object.assign(window, SlickFormatter);
export default SlickFormatter;
