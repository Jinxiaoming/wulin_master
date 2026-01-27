/**
 * DateTime utilities and configurations for WulinMaster.
 * Handles Inputmask and Flatpickr integration with native JS.
 */

const defaultYear = () => {
  const { DEFAULT_YEAR } = window;
  return DEFAULT_YEAR && DEFAULT_YEAR.length === "yyyy".length
    ? DEFAULT_YEAR
    : new Date().getFullYear();
};

const defaultMonth = () => {
  const { DEFAULT_MONTH } = window;
  return DEFAULT_MONTH && DEFAULT_MONTH.length === "mm".length
    ? DEFAULT_MONTH
    : String(new Date().getMonth() + 1).padStart("mm".length, "0");
};

const wulinMasterDateFormat = () => {
  const { DATE_FORMAT } = window;
  return DATE_FORMAT;
};

const USDateFormat = () => {
  return wulinMasterDateFormat() === 'us';
};

const isFeb29 = (event, buffer, caretPos) =>
  [buffer.join("").substring(0, caretPos), event.key].join("") === "29/02";

/**
 * Configures Inputmask aliases for WulinMaster.
 */
function ConfigInputmask() {
  if (typeof Inputmask === 'undefined') return;

  Inputmask.extendAliases({
    wulinDateTime: {
      alias: "datetime",
      showMaskOnHover: false,
      yearrange: { minyear: 1900, maxyear: 2100 },
      positionCaretOnClick: "none",
      placeholder: `dd/${defaultMonth()}/${defaultYear()} 12:00`,
      onKeyDown: function(event, buffer, caretPos, opts) {
        const [date, time] = opts.placeholder.split(" ");
        const startTypingMonth = caretPos === 3 && ["0", "1"].includes(event.key);
        if (startTypingMonth) {
          const placeholderMonth = date.split("/")[1];
          if (placeholderMonth[0] !== event.key) opts.placeholder = `dd/mm/${defaultYear()} ${time}`;
        }
        if (caretPos === 4 && isFeb29(event, buffer, caretPos)) {
          opts.placeholder = `dd/mm/yyyy ${time}`;
        }
      },
      onBeforeMask: function(value, opts) {
        const fromPrefilledValue = (value) => {
          const parts = value.split(" ");
          const dateParts = parts[0].split("/");
          const year = dateParts[2];
          const month = dateParts[1];
          const hh_mm = parts[1];
          return `dd/${month}/${year} ${hh_mm}`;
        };

        if (value.length === "dd/mm/yyyy hh:mm".length) {
          opts.placeholder = fromPrefilledValue(value);
        } else {
          opts.placeholder = `dd/${defaultMonth()}/${defaultYear()} 12:00`;
        }
      }
    },
    wulinDate: {
      alias: "date",
      showMaskOnHover: false,
      yearrange: { minyear: 1900, maxyear: 2100 },
      positionCaretOnClick: "none",
      placeholder: `dd/${defaultMonth()}/${defaultYear()}`,
      onKeyDown: function(event, buffer, caretPos, opts) {
        const startTypingMonth = caretPos === 3 && ["0", "1"].includes(event.key);
        if (startTypingMonth) {
          const placeholderMonth = opts.placeholder.split("/")[1];
          if (placeholderMonth[0] !== event.key) opts.placeholder = `dd/mm/${defaultYear()}`;
        }
        if (caretPos === 4 && isFeb29(event, buffer, caretPos)) {
          opts.placeholder = `dd/mm/yyyy`;
        }
      },
      onBeforeMask: function(value, opts) {
        const fromPrefilledValue = (value) => {
          const dateParts = value.split(" ")[0].split("/");
          const year = dateParts[2];
          const month = dateParts[1];
          return `dd/${month}/${year}`;
        };

        if (value.length === "dd/mm/yyyy".length) {
          opts.placeholder = fromPrefilledValue(value);
        } else {
          opts.placeholder = `dd/${defaultMonth()}/${defaultYear()}`;
        }
      }
    },
    wulinUSDate: {
      alias: "mm/dd/yyyy",
      showMaskOnHover: false,
      yearrange: { minyear: 1900, maxyear: 2100 },
      positionCaretOnClick: "none",
      placeholder: `mm/dd/${defaultYear()}`,
      onKeyDown: function(event, buffer, caretPos, opts) {
        if (caretPos === 4 && isFeb29(event, buffer, caretPos)) {
          opts.placeholder = `mm/dd/yyyy`;
        }
      },
      onBeforeMask: function(value, opts) {
        const fromPrefilledValue = (value) => {
          const dateParts = value.split(" ")[0].split("/");
          const year = dateParts[2];
          const month = dateParts[1];
          return `${month}/dd/${year}`;
        };

        if (value.length === "mm/dd/yyyy".length) {
          opts.placeholder = fromPrefilledValue(value);
        } else {
          opts.placeholder = `dd/${defaultMonth()}/${defaultYear()}`;
        }
      }
    },
    wulinTime: {
      alias: "hh:mm",
      showMaskOnHover: false,
      positionCaretOnClick: "none"
    }
  });
}

ConfigInputmask();

/**
 * Merges Flatpickr configurations, ensuring hooks are combined into arrays.
 */
const fpMergeConfigs = (...configs) => {
  const mergeConfigs = (target, source) => {
    const isHook = (key) => /^on/.test(key);
    const all = Object.assign({}, target, source);

    const allHooks = Object.fromEntries(
      Object.keys(all)
        .filter(isHook)
        .map(k => [k, []])
    );

    const targetHooks = Object.entries(target).filter(([k]) => isHook(k));
    const sourceHooks = Object.entries(source).filter(([k]) => isHook(k));

    targetHooks.forEach(([k, v]) => (allHooks[k] = [allHooks[k], v].flat()));
    sourceHooks.forEach(([k, v]) => (allHooks[k] = [allHooks[k], v].flat()));

    return Object.assign(all, allHooks);
  };

  return configs.reduce(mergeConfigs, {});
};

const fpConfigInit = {
  allowInput: true
};

const fpConfigDateTime = fpMergeConfigs({}, fpConfigInit, {
  dateFormat: "d/m/Y H:i",
  enableTime: true,
  time_24hr: true,
  parseDate: (str) => {
    const [date, time] = str.split(" ");
    const [dd, mm, yyyy] = date.split("/");
    return new Date(`${yyyy}-${mm}-${dd}T${time}`);
  },
  onOpen: (selectedDates, dateStr, instance) => {
    instance.jumpToDate(`01/${defaultMonth()}/${defaultYear()} 12:00`);
    instance.update(dateStr);
  }
});

const fpConfigDate = fpMergeConfigs({}, fpConfigInit, {
  maxDate: "31/12/2100",
  minDate: "01/01/1900",
  dateFormat: "d/m/Y",
  enableTime: false,
  parseDate: (str) => {
    const [date] = str.split(" ");
    const [dd, mm, yyyy] = date.split("/");
    try {
      return new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
    } catch (e) {
      return null;
    }
  },
  onOpen: (selectedDates, dateStr, instance) => {
    const jumpDate = instance.config.mode === "range"
      ? instance.config.minDate
      : `01/01/${defaultYear()}`;
    instance.jumpToDate(jumpDate);
    instance.update(dateStr);
  }
});

const fpConfigUSDate = fpMergeConfigs({}, fpConfigInit, {
  maxDate: "12/31/2100",
  minDate: "01/01/1900",
  dateFormat: "m/d/Y",
  enableTime: false,
  parseDate: (str) => {
    const [date] = str.split(" ");
    let [mm, dd, yyyy] = date.split("/");
    try {
      return new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
    } catch (e) {
      return null;
    }
  },
  onOpen: (selectedDates, dateStr, instance) => {
    const jumpDate = instance.config.mode === "range"
      ? instance.config.minDate
      : `01/${defaultMonth()}/${defaultYear()}`;
    instance.jumpToDate(jumpDate);
    instance.update(dateStr);
  }
});

const fpConfigTime = fpMergeConfigs({}, fpConfigInit, {
  noCalendar: true,
  enableTime: true,
  dateFormat: "H:i",
  time_24hr: true,
  onOpen: (selectedDates, dateStr, instance) => {
    const val = dateStr.length === "hh:mm".length ? dateStr : "12:00";
    if (instance.input) instance.input.value = val;
  }
});

/* Config of flatpickr in form */

const fpConfigForm = fpMergeConfigs({}, fpConfigInit, {
  clickOpens: true,
  onOpen: (selectedDates, dateStr, instance) => {
    instance.input?.focus();
  },
  onClose: (selectedDates, dateStr, instance) => {
    const input = instance.input;
    if (!input) return;

    const cancelInvalidInputStr = (str, inst) => {
      const notValidReg = /[a-z]/;
      if (notValidReg.test(str)) {
        inst.input.value = "";
      }
    };

    const updateLabels = (el) => {
      const isActive = !!el.value;
      Array.from(el.labels || []).forEach(label => {
        label.classList.toggle('active', isActive);
      });
    };

    if (instance.config.mode !== "range") {
      cancelInvalidInputStr(dateStr, instance);
    }
    updateLabels(input);
  }
});

// Export configurations to window for global access
window.fpMergeConfigs = fpMergeConfigs;
window.fpConfigFormDateTime = fpMergeConfigs({}, fpConfigForm, fpConfigDateTime);
window.fpConfigFormDate = fpMergeConfigs({}, fpConfigForm, fpConfigDate);
window.fpConfigFormUSDate = fpMergeConfigs({}, fpConfigForm, fpConfigUSDate);
window.fpConfigFormTime = fpMergeConfigs({}, fpConfigForm, fpConfigTime);
window.USDateFormat = USDateFormat;
