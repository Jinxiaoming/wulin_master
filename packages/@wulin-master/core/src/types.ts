import { SlickGrid, Column } from 'slickgrid';

import { WulinGrid } from './types';

export interface GridAction {
  name: string;
  target?: WulinGrid;
  init?: () => void;
  handler: (e: Event) => void;
  [key: string]: any;
}

export interface GridBehavior {
  name: string;
  subscribe: (target: WulinGrid) => void;
  unsubscribe?: (target: WulinGrid) => void;
  [key: string]: any;
}

export interface WulinGrid extends SlickGrid {
  name: string;
  model: string;
  screen: string;
  path: string;
  container: HTMLElement;
  loader: any;
  remoteModel: any;
  actions: any[];
  behaviors: any[];
  allColumns: WulinColumn[];
}

export interface WulinColumn extends Column {
  column_name?: string;
  type?: string;
  editable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  [key: string]: any;
}

export interface GridOptions {
  enableCellNavigation?: boolean;
  enableColumnReorder?: boolean;
  editable?: boolean;
  asyncEditorLoading?: boolean;
  autoEdit?: boolean;
  [key: string]: any;
}

export interface ApiResponse<T = any> {
  rows: T[];
  total_count?: number;
  offset?: number;
  error_message?: string;
}

export interface WulinUi {
  isOpen: () => boolean;
  isEditing: () => boolean;
  resizeGrid: (grid: WulinGrid) => void;
  filterPanelOpen: () => boolean;
  isFiltering: () => boolean;
  addOrDeleteLocked: () => boolean;
  selectGridNames: () => string[];
  refreshCreateForm: (grid: WulinGrid) => void;
  resetForm: (name: string) => void;
  openDialog: (grid: WulinGrid, action: string) => void;
  setupComponents: (grid: WulinGrid, scope?: string) => void;
  setupForm: (grid: WulinGrid, monitor: boolean, selectedIndexes?: number[], scope?: string) => void;
  preventPressEnterKeySubmitForm: (formSelector: string) => void;
  setupChosen: (grid: WulinGrid, target: HTMLElement, scope: HTMLElement, selectedIndexes?: number[]) => void;
  addNewOption: (target: HTMLElement) => void;
  unCheckEmpty: (target: HTMLElement) => void;
  closeModal: (name: string) => void;
  flashNotice: (ids: any[] | string, action: string) => void;
  findCurrentGrid: () => WulinGrid | null;
  getModalSize: (grid: WulinGrid, data: string, willBeRemovedContainerClassName?: string) => { width: number, height: number };
  baseModal: (options?: any) => HTMLElement;
  headerModal: (title: string, options?: any) => HTMLElement;
  modalFooter: (btnName: string) => HTMLElement;
  appendModalFooter: (btnName: string, modal: HTMLElement) => HTMLElement;
  resetHeightOfModalContent: (content: HTMLElement | null) => void;
  pdfDownloadFooter: (pdfUrl: string) => HTMLElement;
  createModelModal: (grid: WulinGrid, data: string, options?: any, willBeRemovedContainerClassName?: string) => HTMLElement;
  createJsonViewModal: (jsonData: any) => void;
  createAddOptionModal: (inputBox: HTMLSelectElement) => void;
  formatData: (grid: WulinGrid, arrayData: any[]) => any;
}
