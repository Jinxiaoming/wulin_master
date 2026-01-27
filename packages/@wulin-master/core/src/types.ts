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
