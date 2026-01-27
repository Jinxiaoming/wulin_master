import { GridAction } from '@wulin-master/core';
import { BaseAction, ActionManager } from '../action_manager';

/**
 * Import Role Permission Action
 * Imports role permissions from a JSON file using Dropzone.
 */
const ImportRolePermissionAction: GridAction = Object.assign({}, BaseAction, {
  name: 'import_role_permission',

  /**
   * Loads Dropzone assets dynamically if not already present.
   */
  loadDropzone: function(this: GridAction, callback: () => void) {
    if (window.WulinMaster.Dropzone) {
      callback();
      return;
    }

    const dropzoneJsUrl = (window as any).DROPZONE_JS_URL || '/assets/dropzone.min.js';
    const dropzoneCssUrl = (window as any).DROPZONE_CSS_URL || '/assets/dropzone.min.css';

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
      (window as any).Dropzone.autoDiscover = false;
      callback();
    };
    script.onerror = () => window.WulinMaster.displayErrorMessage("Failed to load file upload component.", "Error");
    document.head.appendChild(script);
  },

  /**
   * Cleans up Dropzone resources.
   */
  cleanupDropzone: function() {
    document.querySelectorAll('link[data-dropzone-css="true"]').forEach(el => el.remove());
    if ((window as any).Dropzone) {
      (window as any).Dropzone = undefined;
    }
  },

  handler: function(this: GridAction) {
    const grid = this.target;
    if (!grid) return;
    
    this.loadDropzone(() => {
      const modal = window.WulinMaster.Ui.baseModal({
        onOpenStart: (modalEl: HTMLElement) => {
          const content = modalEl.querySelector(".modal-content") as HTMLElement;
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
            new (window as any).Dropzone("#import-role-permission-dropzone", {
              url: "/roles/import_role_permission",
              acceptedFiles: ".json,application/json",
              maxFiles: 1,
              addRemoveLinks: true,
              paramName: "import_role_permission_file",
              headers: {
                'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
              },
              success: (file: any, response: any) => {
                window.WulinMaster.displayNewNotification(response.message || "Import successful!", "success");
                this.cleanupDropzone();
                grid.loader.reloadData();
                window.WulinMaster.M.Modal.getInstance(modalEl).close();
              },
              error: (file: any, response: any) => {
                let errorMsg = "An error occurred while importing the file.";
                if (typeof response === 'string') {
                  try { response = JSON.parse(response); } catch(e) {}
                }
                if (response?.error) errorMsg = response.error;
                window.WulinMaster.displayErrorMessage(errorMsg, "Import Error");
                this.cleanupDropzone();
                window.WulinMaster.M.Modal.getInstance(modalEl).close();
              }
            });
          }, 100);
        },
        onCloseEnd: (modalEl: HTMLElement) => {
          this.cleanupDropzone();
          modalEl.remove();
        }
      });
      modal.style.width = "600px";
      modal.style.height = "auto";
    });
  }
});

ActionManager.register(ImportRolePermissionAction);
export default ImportRolePermissionAction;
