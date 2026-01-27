import { Controller } from "@hotwired/stimulus"
import { TextEditorForForm } from "@wulin-master/slickgrid"

/**
 * FormController manages complex form behaviors like dependent selects,
 * autocomplete, and rich text editors.
 */
export default class extends Controller {
  static targets = ["field"]

  connect() {
    this.initializeFocus()
  }

  /**
   * Sets initial focus to the first visible input.
   */
  initializeFocus() {
    const firstInput = this.element.querySelector('.input-outlined input:not([type="hidden"]), .input-outlined select, .input-outlined textarea')
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100)
    }
  }

  /**
   * Initializes dependent select logic (Select2).
   */
  initDependentSelect(event) {
    const { dependSelectId, targetSelectId, fetchUrl, masterModel } = event.currentTarget.dataset
    const dependSelect = document.getElementById(dependSelectId)
    const targetSelect = document.getElementById(targetSelectId)

    if (!dependSelect || !targetSelect) return

    const data = dependSelect.tomselect?.options[dependSelect.value];
    const masterId = data ? data.id : ''
    const url = `${fetchUrl}&master_model=${masterModel}&master_id=${masterId}`

    fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then(r => r.json())
      .then(items => {
        const ts = targetSelect.tomselect;
        if (!ts) return;

        const previousValue = ts.getValue();
        ts.clearOptions();
        
        if (targetSelect.dataset.required !== 'true') {
          ts.addOption({ id: '', name: '' });
        }

        items.forEach(item => {
          ts.addOption({ id: item.id || item, name: item.name || item });
        });

        if (items.some(item => String(item.id || item) === String(previousValue))) {
          ts.setValue(previousValue);
        } else {
          ts.setValue(null);
        }
        
        // Update label state
        const label = targetSelect.closest('.field')?.querySelector('label')
        if (label) {
          label.classList.toggle('active', !!ts.getValue())
        }
      })
  }

  /**
   * Initializes Autocomplete for form fields.
   */
  initAutocomplete(event) {
    if (!window.__globalWillAppend) return
    
    const container = event.currentTarget
    const { choices, hideAutocomplete, autocompleteMinlength } = container.dataset
    
    const args = {
      column: {
        auto_complete: true,
        width: container.offsetWidth,
        choices: choices,
        hide_autocomplete: hideAutocomplete === 'true',
        autocomplete_minlength: parseInt(autocompleteMinlength, 10) || 1
      },
      container: container
    }

    const editor = new TextEditorForForm(args)
  }
}
