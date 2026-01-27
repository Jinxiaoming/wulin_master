import { WulinGrid, WulinColumn } from './types.js';
import ConnectionManager from './connectionmanager.js';

/**
 * RemoteModel provides a data source for SlickGrid with support for
 * server-side pagination, sorting, and filtering.
 */
export default class RemoteModel {
  private loadingSize: number = 200;
  private preemptiveLoadingSize: number = 100;
  private pageSize: number = 0;
  private pageNum: number = 0;
  private totalRows: number = 0;
  private aggregation: string = '';
  private rowsWithoutFilter: number = -1;
  public data: any = { length: 0 };
  private oldData: any = { length: 0 };
  private sortcol: string | null = null;
  private sortdir: number = 1;
  private params: Array<[string, any]> = [];
  private pagingOptionsChanged: boolean = false;
  private path: string;
  private columns: WulinColumn[];
  private filters: Array<[string, any, string]> = [];
  private lastRequestVersionNumber: number = 0;
  private currentRequestVersionNumber: number = 0;
  private connectionManager: ConnectionManager;
  private grid!: WulinGrid;

  public beforeRemoteRequest: any;
  public onDataLoading: any;
  public onPagingInfoChanged: any;
  public onDataLoaded: any;

  constructor(path: string, initialFilters: any[], columns: WulinColumn[]) {
    this.path = path;
    this.columns = columns;

    if (initialFilters) {
      initialFilters.forEach(f => {
        this.filters.push([f.column, f.value, f.operator]);
      });
    }

    this.connectionManager = new ConnectionManager(this);

    // SlickGrid Events
    const Slick = (window as any).Slick;
    this.beforeRemoteRequest = new Slick.Event();
    this.onDataLoading = new Slick.Event();
    this.onPagingInfoChanged = new Slick.Event();
    this.onDataLoaded = new Slick.Event();
  }

  setGrid(newGrid: WulinGrid) {
    this.grid = newGrid;

    // Connect the grid and the loader
    this.grid.onViewportChanged.subscribe(() => {
      const vp = this.grid.getViewport();
      if ((this.grid.getOptions() as any).eagerLoading === false && this.data.length === 0) return;
      this.ensureData(vp.top, vp.bottom);
    });

    this.grid.onSort.subscribe((e: any, args: any) => {
      this.setSort(args.sortCol.sortColumn, args.sortAsc ? 1 : -1);
    });
  }

  clear() {
    for (const key in this.data) {
      if (key !== 'length') {
        delete this.data[key];
      }
    }
    this.data.length = 0;
  }

  isDataLoaded(from: number, to: number) {
    for (let i = from; i <= to; i++) {
      if (this.data[i] === undefined || this.data[i] === null) return false;
    }
    return true;
  }

  ensureData(from: number, to: number) {
    this.beforeRemoteRequest.notify();

    const urlData = this.generateUrl(from, to);
    if (urlData === null) return;

    const [url] = urlData as [string, boolean];
    this.connectionManager.createConnection(
      this.grid, 
      url, 
      null, 
      this.onSuccess.bind(this), 
      this.onError.bind(this), 
      this.currentRequestVersionNumber
    );
  }

  generateUrl(from: number, to: number): [string, boolean] | null {
    let paginationOptions = this.getPaginationOptions(from, to);
    let [offset, count] = paginationOptions;
    let normalLoadingMode = true;

    if (count === 0) {
      paginationOptions = this.getPaginationOptions(from - this.preemptiveLoadingSize, to + this.preemptiveLoadingSize);
      [offset, count] = paginationOptions;
      if (count === 0) return null;
      normalLoadingMode = false;
    }

    let url = `${this.path}&offset=${offset}&count=${count}`;
    url += this.conditionalURI();
    url += `&columns=${this.visibleColumnNames().join(',')}`;

    return [url, normalLoadingMode];
  }

  getPaginationOptions(from: number, to: number): [number, number] {
    if (this.pageSize === 0) {
      from = Math.max(0, from);
      let fromPage = Math.floor(from / this.loadingSize);
      let toPage = Math.floor(to / this.loadingSize);

      while (this.data[fromPage * this.loadingSize] !== undefined && fromPage < toPage) fromPage++;
      while (this.data[toPage * this.loadingSize] !== undefined && fromPage < toPage) toPage--;

      if (fromPage > toPage) return [0, 0];

      let alreadyLoaded = true;
      for (let i = fromPage; i <= toPage; i++) {
        if (typeof this.data[i * this.loadingSize] === 'undefined') alreadyLoaded = false;
      }

      if (alreadyLoaded) return [0, 0];

      for (let i = fromPage; i <= toPage; i++) {
        this.data[i * this.loadingSize] = null; // Loading placeholder
      }

      return [fromPage * this.loadingSize, (toPage - fromPage + 1) * this.loadingSize];
    } else {
      if (!this.pagingOptionsChanged) return [0, 0];
      this.pagingOptionsChanged = false;
      return [this.pageNum * this.pageSize, this.pageSize];
    }
  }

  conditionalURI() {
    let url = `&sort_col=${encodeURIComponent(this.sortcol || "")}`;
    url += `&sort_dir=${this.sortdir > 0 ? "ASC" : "DESC"}`;

    this.filters.forEach(f => {
      url += `&filters[][column]=${encodeURIComponent(f[0])}&filters[][value]=${encodeURIComponent(f[1])}&filters[][operator]=${encodeURIComponent(f[2])}`;
    });

    this.params.forEach(p => {
      url += `&${encodeURIComponent(p[0])}=${encodeURIComponent(p[1])}`;
    });

    return url;
  }

  visibleColumnNames() {
    return this.grid.allColumns
      .filter((c: WulinColumn) => c.column_name !== undefined)
      .map((c: WulinColumn) => c.column_name as string);
  }

  onSuccess(resp: any) {
    this.rowsWithoutFilter = parseInt(resp.totalNoFilter, 10);
    this.totalRows = parseInt(resp.total, 10);
    this.aggregation = resp.aggregation || '';

    if (this.pageSize === 0) {
      this.data.length = this.totalRows;
    } else {
      this.data.length = parseInt(resp.count, 10);
    }

    // Exclude detail selector
    this.columns = this.columns.filter(c => c.id !== '_detail_selector');

    if (resp.rows) {
      const from = resp.offset || 0;
      if (resp.rows.length < this.loadingSize) {
        this.data[from + this.loadingSize] = null;
      }

      resp.rows.forEach((row: any[], i: number) => {
        const j = from + i;
        const obj: any = {};
        const indexOffset = this.grid.getOptions().checkbox.enable ? 1 : 0;

        this.columns.forEach((col, colIdx) => {
          if (col.id !== "_checkbox_selector") {
            const item = row[colIdx - indexOffset];
            if (item && typeof item === "object" && !Array.isArray(item)) {
              Object.assign(obj, item);
            } else {
              obj[col.id] = item;
            }
          }
        });
        obj.slick_index = j;
        this.data[j] = obj;
      });
    }

    this.oldData = JSON.parse(JSON.stringify(this.data));
    this.dataIsLoaded({ from: resp.offset, to: resp.offset + resp.count, data: this.data });
    this.onPagingInfoChanged.notify(this.getPagingInfo());
  }

  onError(request: any, textStatus: string, errorThrown: string) {
    console.error("RemoteModel error:", errorThrown);
  }

  dataIsLoaded(args: { from: number, to: number, data: any }) {
    for (let i = args.from; i < args.to; i++) {
      this.grid.invalidateRow(i);
    }
    this.grid.setData(args.data);
    this.grid.updateRowCount();
    this.grid.render();
    this.onDataLoaded.notify();
  }

  getPagingInfo() {
    return {
      pageSize: this.pageSize,
      pageNum: this.pageNum,
      totalRows: this.totalRows,
      rowsWithoutFilter: this.rowsWithoutFilter,
      aggregation: this.aggregation,
    };
  }

  setSort(column: string, dir: number) {
    if (this.sortcol !== column || this.sortdir !== dir) {
      this.currentRequestVersionNumber++;
      this.sortcol = column;
      this.sortdir = dir;
      this.refresh();
    }
  }

  refresh() {
    this.pagingOptionsChanged = true;
    this.clear();
    const vp = this.grid.getViewport();
    this.ensureData(vp.top, vp.bottom);
  }

  reloadData(from?: number, to?: number) {
    if (from === undefined && to === undefined) {
      const pos = this.decideCurrentPosition();
      from = pos[0] as number;
      to = pos[1] as number;
    }
    if (from !== undefined && to !== undefined && from !== null && to !== null) {
      for (let i = from; i <= to; i++) delete this.data[i];
    } else {
      this.clear();
    }
    this.ensureData(from || 0, to || 0);
  }

  decideCurrentPosition(): [number | null, number | null] {
    if (this.grid.operatedIds && this.grid.operatedIds.length > 0) {
      const lastId = this.grid.operatedIds[this.grid.operatedIds.length - 1];
      const gridRow = this.grid.getRowByRecordId(lastId);
      if (!gridRow) return [null, null];
      const currentRow = gridRow.index - 1;
      const from = Math.floor(currentRow / 200) * 200;
      return [from, currentRow];
    }
    return [null, null];
  }

  getParams() { return this.params; }
  getColumns() { return this.columns; }
}

// Global exposure for legacy compatibility
const win = window as any;
win.WulinMaster = win.WulinMaster || {};
win.WulinMaster.Data = win.WulinMaster.Data || {};
win.WulinMaster.Data.RemoteModel = RemoteModel;
