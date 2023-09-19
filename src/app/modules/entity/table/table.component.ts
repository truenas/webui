import {
  Component, OnInit, Input, ViewChild, AfterViewInit, AfterViewChecked, ElementRef, TrackByFunction,
} from '@angular/core';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subject } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { JobState } from 'app/enums/job-state.enum';
import { LinkState } from 'app/enums/network-interface.enum';
import { ApiCallMethod } from 'app/interfaces/api/api-call-directory.interface';
import { ApiJobMethod } from 'app/interfaces/api/api-job-directory.interface';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { TableService } from 'app/modules/entity/table/table.service';

export interface AppTableAction<Row = unknown> {
  name: string;
  icon: string;
  matTooltip?: string;
  onChanging?: boolean;
  disabled?: boolean;
  disabledCondition?: (row: Row) => boolean;
  onClick: (row: Row) => void;
}

export interface AppTableHeaderAction {
  label: string;
  onClick: () => void;
}

export interface AppTableColumn {
  name?: string;
  name1?: string;
  name2?: string;
  prop?: string;
  prop1?: string;
  prop2?: string;
  checkbox?: boolean;
  slideToggle?: boolean;
  disabled?: boolean;
  onChange?(data: unknown): void;
  width?: string;
  state?: {
    prop: string;
    icon?: string;
  };
  button?: boolean;
  showLockedStatus?: boolean;
  tooltip?: string;
  iconTooltip?: string;
  enableMatTooltip?: boolean;
  hidden?: boolean;
  hiddenIfEmpty?: boolean;
  listview?: boolean;
  getIcon?(element: unknown, prop: string): string;
}

export interface AppTableConfirmDeleteDialog {
  buildTitle?(args: unknown): string;
  buttonMessage?(args: unknown): string;
  title?: string;
  message?: string;
  button?: string;
  isMessageComplete?: boolean;
  hideCheckbox?: boolean;
}

export interface AppTableConfig<P = unknown> {
  title?: string;
  titleHref?: string;
  columns: AppTableColumn[];
  queryCall: ApiCallMethod;
  queryCallOption?: unknown;
  deleteCall?: ApiCallMethod | ApiJobMethod;
  deleteCallIsJob?: boolean;
  complex?: boolean;
  hideHeader?: boolean; // hide table header row
  name?: string;
  deleteMsg?: {
    title: string;
    key_props: string[];
    id_prop?: string;
    doubleConfirm?(item: unknown): Observable<boolean>;
  }; //
  tableComponent?: TableComponent;
  emptyEntityLarge?: boolean;
  hideEntityEmpty?: boolean;
  alwaysHideViewMore?: boolean;
  /**
   * @deprecated Use arrow functions
   */
  parent?: P;
  tableActions?: AppTableHeaderAction[];
  tableFooterActions?: AppTableHeaderAction[];
  tableExtraActions?: AppTableHeaderAction[];
  confirmDeleteDialog?: AppTableConfirmDeleteDialog;
  addActionDisabled?: boolean;
  editActionDisabled?: boolean;
  deleteActionDisabled?: boolean;

  add?(): void; // add action function
  afterGetData?(data: unknown): void;
  afterDelete?(): void;
  edit?(any: unknown): void; // edit row
  delete?(item: unknown, table: TableComponent): void; // customize delete row method
  dataSourceHelper?(any: unknown): unknown[]; // customise handle/modify dataSource
  getInOutInfo?(any: unknown): void; // get in out info if has state column
  getActions?: () => AppTableAction[]; // actions for each row
  isActionVisible?(actionId: string, entity: unknown): boolean; // determine if action is visible
  getDeleteCallParams?(row: unknown, id: string | number): unknown; // get delete Params
  onButtonClick?(row: unknown): void;

  expandable?: boolean; // field introduced by ExpandableTable, "fake" field
  afterGetDataExpandable?<T>(data: T[]): T[]; // field introduced by ExpandableTable, "fake" field
}

/**
 * @deprecated
 */
interface InOutInfo extends Record<string, unknown> {
  oldSent?: number;
  sent_bytes?: number;
  oldReceived?: number;
  received_bytes?: number;
  sent?: number;
  received?: number;
}

@UntilDestroy()
@Component({
  selector: 'ix-conf-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  providers: [TableService],
})
export class TableComponent<Row extends Record<string, unknown> = Record<string, unknown>>
implements OnInit, AfterViewInit, AfterViewChecked {
  @ViewChild('table') table: ElementRef<HTMLElement>;
  LinkState = LinkState;

  _tableConf: AppTableConfig;
  title = '';
  titleHref: string;
  dataSource: Row[];
  displayedDataSource: Row[];
  displayedColumns: string[];
  hideHeader = false;
  actions: AppTableAction[];
  emptyConf: EmptyConfig;
  showViewMore = false;
  showCollapse = false;
  limitRows: number;
  entityEmptyLarge = false;
  enableViewMore = false;
  loaderOpen = false;
  afterGetDataHook$ = new Subject<void>();

  idProp = 'id';

  private TABLE_HEADER_HEIGHT = 48;
  private TABLE_ROW_HEIGHT = 48;
  private TABLE_MIN_ROWS = 5;

  private tableHeight: number;

  trackTask: TrackByFunction<Row> = (index: number, row: Row): unknown => row[this.idProp];

  get isOverflow(): boolean {
    return this.TABLE_MIN_ROWS < this.dataSource?.length;
  }

  get tableConf(): AppTableConfig {
    return this._tableConf;
  }

  // TODO: tableConf can be renamed
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('conf') set tableConf(conf: AppTableConfig) {
    if (!this._tableConf) {
      this._tableConf = conf;
    } else {
      this._tableConf = conf;
      this.populateTable();
    }
  }

  constructor(
    public tableService: TableService,
    public translate: TranslateService,
  ) {}

  calculateLimitRows(): void {
    if (!this.table) {
      return;
    }

    this.tableHeight = this.table.nativeElement.offsetHeight;
    if (this.enableViewMore) {
      this.displayedDataSource = this.dataSource;
      return;
    }
    this.limitRows = Math.floor(
      (this.tableHeight - (this._tableConf.hideHeader ? 0 : this.TABLE_HEADER_HEIGHT)) / this.TABLE_ROW_HEIGHT,
    );
    this.limitRows = Math.max(this.limitRows, this.TABLE_MIN_ROWS);

    if (this.dataSource) {
      if (this.tableConf.alwaysHideViewMore) {
        this.limitRows = this.dataSource.length;
      }
      this.displayedDataSource = this.dataSource.slice(0, this.limitRows);
      this.showViewMore = this.dataSource.length !== this.displayedDataSource.length;
      if (this.showCollapse) {
        this.showCollapse = this.dataSource.length !== this.displayedDataSource.length;
      }
    }
  }

  ngOnInit(): void {
    this.populateTable();

    this.afterGetDataHook$.pipe(untilDestroyed(this)).subscribe(() => {
      this.updateColumns();
    });
  }

  ngAfterViewInit(): void {
    this.calculateLimitRows();
  }

  ngAfterViewChecked(): void {
    if (this.tableHeight !== this.table.nativeElement.offsetHeight) {
      setTimeout(() => this.calculateLimitRows());
    }
  }

  populateTable(): void {
    this.title = this._tableConf.title || '';
    if (this._tableConf.titleHref) {
      this.titleHref = this._tableConf.titleHref;
    }

    this.entityEmptyLarge = this._tableConf.emptyEntityLarge;
    this.emptyConf = {
      type: EmptyType.Loading,
      title: this.title,
      large: this.entityEmptyLarge,
    };

    if (this._tableConf.hideHeader) {
      this.hideHeader = this._tableConf.hideHeader;
    }

    this.updateColumns();
    this.getData();

    this.idProp = this._tableConf.deleteMsg === undefined ? 'id' : this._tableConf.deleteMsg.id_prop || 'id';
    this._tableConf.tableComponent = this;
  }

  getData(): void {
    this.tableService.getData(this);
  }

  updateColumns(): void {
    this.displayedColumns = this._tableConf.columns
      .map((column) => {
        if (this.dataSource && column?.hiddenIfEmpty && !column?.hidden) {
          const hasSomeData = this.dataSource.some((row) => row[column.prop]?.toString().trim());
          column.hidden = !hasSomeData;
        }
        return column;
      })
      .filter((column) => !column.hidden)
      .map((column) => column.name);

    if (this._tableConf.getActions || this._tableConf.deleteCall) {
      this.displayedColumns.push('action'); // add action column to table
      this.actions = this._tableConf.getActions ? this._tableConf.getActions() : []; // get all row actions
    }
  }

  editRow(row: Row): void {
    if (this._tableConf.edit && !this._tableConf.editActionDisabled) {
      this._tableConf.edit(row);
    }
  }

  onButtonClick(row: Row): void {
    if (this._tableConf.onButtonClick) {
      this._tableConf.onButtonClick(row);
    }
  }

  deleteRow(row: Row): void {
    if (this._tableConf.delete) {
      this._tableConf.delete(row, this);
    } else {
      this.tableService.delete(this, row);
    }
  }

  showInOutInfo(element: InOutInfo): string {
    if (element.oldSent === undefined) {
      element.oldSent = element.sent_bytes;
    }
    if (element.oldReceived === undefined) {
      element.oldReceived = element.received_bytes;
    }
    if (element.sent_bytes - element.oldSent > 1024) {
      element.oldSent = element.sent_bytes;
      this.tableService.updateStateInfoIcon(element[this.idProp] as string, 'sent');
    }
    if (element.received_bytes - element.oldReceived > 1024) {
      element.oldReceived = element.received_bytes;
      this.tableService.updateStateInfoIcon(element[this.idProp] as string, 'received');
    }

    return `${this.translate.instant('Sent')}: ${element.sent} ${this.translate.instant('Received')}: ${element.received}`;
  }

  openViewMore(): void {
    this.enableViewMore = true;
    this.displayedDataSource = this.dataSource;
    this.showViewMore = false;
    this.showCollapse = true;
  }

  collapse(): void {
    this.enableViewMore = false;
    this.displayedDataSource = this.dataSource.slice(0, this.limitRows);
    this.showViewMore = true;
    this.showCollapse = false;
  }

  getButtonClass(row: { warnings: unknown[]; state: JobState }): string {
    // Bring warnings to user's attention even if state is finished or successful.
    if (row.warnings && row.warnings.length > 0) {
      return 'fn-theme-orange';
    }

    const state: JobState = row.state;

    switch (state) {
      case JobState.Pending:
      case JobState.Aborted:
        return 'fn-theme-orange';
      case JobState.Finished:
      case JobState.Success:
        return 'fn-theme-green';
      case JobState.Error:
      case JobState.Failed:
        return 'fn-theme-red';
      case JobState.Locked:
      case JobState.Hold:
        return 'fn-theme-yellow';
      case JobState.Running:
      default:
        return 'fn-theme-primary';
    }
  }

  determineColumnType(column: AppTableColumn): string {
    if (column.listview) {
      return 'listview';
    }

    if (column.checkbox) {
      return 'checkbox';
    }

    if (column.slideToggle) {
      return 'slide-toggle';
    }

    if (column.state?.prop && this._tableConf.getInOutInfo) {
      return 'state-info';
    }
    if (column.state?.icon) {
      return 'state-icon';
    }

    if (column.prop === 'state' && column.button) {
      return 'state-button';
    }

    if (['path', 'paths'].includes(column.prop) && column.showLockedStatus) {
      return 'path-locked-status';
    }

    return 'textview';
  }
}
