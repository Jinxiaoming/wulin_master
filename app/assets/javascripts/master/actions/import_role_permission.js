/**
 * Import Role Permission Action
 * Imports role permissions from a JSON file using Dropzone.
 */
WulinMaster.actions.ImportRolePermission = Object.assign({}, WulinMaster.actions.BaseAction, {
  name: 'import_role_permission',

  /**
   * Loads Dropzone assets dynamically if not already present.
   */
  loadDropzone: function(callback) {
    if (window.Dropzone) {
      callback();
      return;
    }

    const dropzoneJsUrl = window.DROPZONE_JS_URL || '/assets/dropzone.min.js';
    const dropzoneCssUrl = window.DROPZONE_CSS_URL || '/assets/dropzone.min.css';

    // Load CSS
    if (!document.querySelector(`link[href*="${dropzoneCssUrl}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = dropzoneCssUrl;
      link.dataset.dropzoneCss = 'true';
      document.head.appendChild(link);
    }

    // Load JS
    const script = document.createElement('script');
    script.src = dropzoneJsUrl;
    script.onload = () => {
      window.Dropzone.autoDiscover = false;
      callback();
    };
    script.onerror = () => window.displayErrorMessage("Failed to load file upload component.", "Error");
    document.head.appendChild(script);
  },

  /**
   * Cleans up Dropzone resources.
   */
  cleanupDropzone: function() {
    document.querySelectorAll('link[data-dropzone-css="true"]').forEach(el => el.remove());
    if (window.Dropzone) {
      // Note: Truly deleting from window is hard, but we can disable it
      window.Dropzone = undefined;
    }
  },

  handler: function() {
    const grid = this.getGrid();
    
    this.loadDropzone(() => {
      const modal = window.Ui.baseModal({
        onOpenStart: (modalEl) => {
          const content = modalEl.querySelector(".modal-content");
          content.innerHTML = `
            <h5>Import Role Permission</h5>
            <div id="import-role-permission-dropzone" class="dropzone" style="border-radius: 10px; border: 2px dashed rgba(42, 177, 201, 0.8);">
              <div class="dz-message" style="color: rgba(42, 177, 201, 0.8);">
                Drop JSON file to import or click to browse
              </div>
            </div>
          `;

          // Initialize Dropzone
          setTimeout(() => {
            new window.Dropzone("#import-role-permission-dropzone", {
              url: "/roles/import_role_permission",
              acceptedFiles: ".json,application/json",
              maxFiles: 1,
              addRemoveLinks: true,
              paramName: "import_role_permission_file",
              headers: {
                'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || ''
              },
              success: (file, response) => {
                window.displayNewNotification(response.message || "Import successful!", "success");
                this.cleanupDropzone();
                grid.loader.reloadData();
                window.M.Modal.getInstance(modalEl).close();
              },
              error: (file, response) => {
                let errorMsg = "An error occurred while importing the file.";
                if (typeof response === 'string') {
                  try { response = JSON.parse(response); } catch(e) {}
                }
                if (response?.error) errorMsg = response.error;
                window.displayErrorMessage(errorMsg, "Import Error");
                this.cleanupDropzone();
                window.M.Modal.getInstance(modalEl).close();
              }
            });
          }, 100);
        },
        onCloseEnd: (modalEl) => {
          this.cleanupDropzone();
          modalEl.remove();
        }
      });
      modal.style.width = "600px";
      modal.style.height = "auto";
    });
  }
});

WulinMaster.ActionManager.register(WulinMaster.actions.ImportRolePermission);
