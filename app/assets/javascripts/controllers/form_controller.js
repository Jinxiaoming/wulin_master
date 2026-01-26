import { Controller } from "@hotwired/stimulus"

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
    const firstInput = this.element.querySelector('.input-outlined input:not([type="hidden"])')
    if (firstInput) firstInput.focus()
  }

  /**
   * Initializes dependent select logic (Select2).
   */
  initDependentSelect(event) {
    const { dependSelectId, targetSelectId, fetchUrl, masterModel } = event.currentTarget.dataset
    const dependSelect = document.getElementById(dependSelectId)
    const targetSelect = document.getElementById(targetSelectId)

    if (!dependSelect || !targetSelect || typeof jQuery === 'undefined') return

    $(dependSelect).on("select2:select select2:clear", () => {
      const data = $(dependSelect).select2('data')[0]
      if (!data) return

      const masterId = data.id
      const url = `${fetchUrl}&master_model=${masterModel}&master_id=${masterId}`

      fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
        .then(r => r.json())
        .then(items => {
          const $target = $(targetSelect)
          const previousValue = $target.val()
          $target.empty()

          items.forEach(item => {
            const option = new Option(item.name, item.id, false, false)
            $target.append(option)
          })

          if (items.some(item => String(item.id) === String(previousValue))) {
            $target.val(previousValue).trigger('change')
          } else {
            $target.val(null).trigger('change')
          }
        })
    })
  }

  /**
   * Initializes MaterialNote (RichTextEditor).
   */
  initRichTextEditor(event) {
    const element = event.currentTarget
    if (typeof jQuery === 'undefined' || !jQuery.fn.materialnote) return

    window.materialNoteIndex = (window.materialNoteIndex || 0) + 1
    
    $(element).materialnote({
      height: 300,
      toolbar: [
        ['style', ['bold', 'italic', 'underline', 'clear']],
        ['font', ['strikethrough']],
        ['fontsize', ['fontsize']],
        ['color', ['color']],
        ['table', ['table']],
        ['para', ['ul', 'ol', 'paragraph']],
        ['insert', ['link', 'picture', 'video']],
        ['view', ['fullscreen', 'codeview']]
      ],
      callbacks: {
        onFocus: () => element.parentElement.classList.add('focused'),
        onBlur: () => element.parentElement.classList.remove('focused')
      },
      defaultColors: {
        text: 'red',
        background: 'transparent'
      },
      posIndex: window.materialNoteIndex
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
      container: $(container) // Legacy bridge
    }

    if (typeof window.TextEditorForForm === 'function') {
      const editor = new window.TextEditorForForm(args)
    }
  }
}
