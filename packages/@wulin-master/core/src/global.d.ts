import { WulinGrid, WulinColumn, GridOptions, ApiResponse, WulinUi } from '@wulin-master/core';

declare global {
  interface Window {
    // Wulin Master Global Objects
    Ui: WulinUi;
    Requests: any;
    gridManager: any;
    GridStatesManager: any;
    apiClient: any;
    registry: any;
    
    // External Libraries
    Slick: any;
    M: any; // Materialize
    Turbo: any;
    Sortable: any;
    Inputmask: any;
    flatpickr: any;
    TomSelect: any;
    
    // Global Configs/Tokens
    _token?: string;
    _always_reset_form?: boolean;
    USDateFormat?: () => boolean;
    MASTER_DETAIL_COLOR_THEME?: string;
    DROPZONE_JS_URL?: string;
    DROPZONE_CSS_URL?: string;
    
    // Wulin Master Namespace (for legacy and namespaced access)
    WulinMaster: {
      ActionManager: any;
      BehaviorManager: any;
      actions: any;
      behaviors: any;
      FilterPanel: any;
      Ui: WulinUi;
      gridManager: any;
      Turbo: any;
      MASTER_DETAIL_COLOR_THEME?: string;
      displayNewNotification: (message: string, type?: string) => void;
      displayErrorMessage: (message: string, title?: string) => void;
      displayCustomizedConfirmModal: (options: any) => void;
      saveMessage: (message: string, type?: string) => void;
      handleAjaxError: (xhr: any) => void;
      Requests: any;
      M: any;
      Dropzone?: any;
    };
    
    // Legacy Helper Functions (Direct window access)
    displayNewNotification: (message: string, type?: string) => void;
    displayErrorMessage: (message: string, title?: string) => void;
    saveMessage: (message: string, type?: string) => void;
    handleAjaxError: (xhr: any) => void;
    fillValues: (scope: HTMLElement, grid: WulinGrid, selectedIndexes: number[]) => void;
    cleanUpEditors: (id?: string | boolean) => void;
  }
}

export {};
