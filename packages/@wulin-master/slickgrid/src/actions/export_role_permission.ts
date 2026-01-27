import { GridAction } from '@wulin-master/core';
import { BaseAction, ActionManager } from '../action_manager';

/**
 * Export Role Permission Action
 * Exports selected roles' permissions as a JSON file.
 */
const ExportRolePermissionAction: GridAction = Object.assign({}, BaseAction, {
  name: 'export_role_permission',

  handler: async function(this: GridAction) {
    const grid = this.target;
    if (!grid) return;
    const ids = (grid as any).getSelectedIds();

    const params = new URLSearchParams();
    ids.forEach((id: string) => params.append('ids[]', id));
    
    const url = `/roles/export_role_permission?${params.toString()}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const blob = await response.blob();
      let filename = 'roles_permissions.json';
      
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        if (match?.[1]) filename = match[1];
      }

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      window.URL.revokeObjectURL(link.href);
      link.remove();
    } catch (error) {
      console.error('Export error:', error);
      window.WulinMaster.displayErrorMessage('Failed to export permissions.', 'Error');
    }
  },
});

ActionManager.register(ExportRolePermissionAction);
export default ExportRolePermissionAction;
