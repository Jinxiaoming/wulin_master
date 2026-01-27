import { WulinGrid, WulinColumn, GridOptions, ApiResponse } from '@wulin-master/core';

declare global {
  interface Window {
    // Wulin Master Global Objects
    Ui: any;
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
    
    // Global Configs/Tokens
    _token?: string;
    _always_reset_form?: boolean;
    USDateFormat?: () => boolean;
    
    // Wulin Master Namespace (for legacy and namespaced access)
    WulinMaster: {
      ActionManager: any;
      BehaviorManager: any;
      actions: any;
      behaviors: any;
      FilterPanel: any;
      displayNewNotification: (message: string, type?: string) => void;
      displayErrorMessage: (message: string, title?: string) => void;
      displayCustomizedConfirmModal: (options: any) => void;
      saveMessage: (message: string, type?: string) => void;
      handleAjaxError: (xhr: any) => void;
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
