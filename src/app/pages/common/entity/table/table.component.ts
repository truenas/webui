import {
  Component, OnInit, Input, ViewChild, AfterViewInit, AfterViewChecked, ElementRef,
} from '@angular/core';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { Observable, Subject } from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { ApiDirectory } from 'app/interfaces/api-directory.interface';
import { EmptyConfig, EmptyType } from '../entity-empty/entity-empty.component';
import { TableService } from './table.service';

export interface AppTableAction<Row = any> {
  name: string;
  icon: string;
  matTooltip?: string;
  onChanging?: boolean;
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
  onChange?(data: any): void;
  width?: string;
  state?: any;
  button?: boolean;
  showLockedStatus?: boolean;
  tooltip?: string;
  iconTooltip?: string;
  enableMatTooltip?: boolean;
  hidden?: boolean;
  hiddenIfEmpty?: boolean;
  listview?: boolean;
  getIcon?(element: any, prop: string): void;
}

export interface AppTableConfirmDeleteDialog {
  buildTitle?(args: any): string;
  buttonMsg?(args: any): string;
  title?: string;
  message?: string;
  button?: string;
  isMessageComplete?: boolean;
  hideCheckbox?: boolean;
}

export interface AppTableConfig<P = any> {
  title?: string;
  titleHref?: string;
  columns: AppTableColumn[];
  queryCall: keyof ApiDirectory;
  queryCallOption?: any;
  deleteCall?: keyof ApiDirectory;
  deleteCallIsJob?: boolean;
  complex?: boolean;
  hideHeader?: boolean; // hide table header row
  name?: string;
  deleteMsg?: {
    title: string;
    key_props: string[];
    id_prop?: string;
    doubleConfirm?(item: any): Observable<boolean>;
  }; //
  tableComponent?: TableComponent;
  emptyEntityLarge?: boolean;
  hideEntityEmpty?: boolean;
  alwaysHideViewMore?: boolean;
  parent: P;
  tableActions?: AppTableHeaderAction[];
  tableExtraActions?: AppTableHeaderAction[];
  confirmDeleteDialog?: AppTableConfirmDeleteDialog;

  add?(): void; // add action function
  afterGetData?(data: any): void;
  afterDelete?(): void;
  edit?(any: any): void; // edit row
  delete?(item: any, table: TableComponent): void; // customize delete row method
  dataSourceHelper?(any: any): any; // customise handle/modify dataSource
  getInOutInfo?(any: any): any; // get in out info if has state column
  getActions?: () => AppTableAction[]; // actions for each row
  isActionVisible?(actionId: string, entity: any): boolean; // determine if action is visible
  getDeleteCallParams?(row: any, id: any): any; // get delete Params
  onButtonClick?(row: any): void;

  expandable?: boolean; // field introduced by ExpandableTable, "fake" field
  afterGetDataExpandable?(data: any): void; // field introduced by ExpandableTable, "fake" field
}

@UntilDestroy()
@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  providers: [TableService],
})
export class TableComponent implements OnInit, AfterViewInit, AfterViewChecked {
  @ViewChild('table') table: ElementRef<HTMLElement>;

  _tableConf: AppTableConfig;
  title = '';
  titleHref: string;
  dataSource: any[];
  displayedDataSource: any[];
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
  afterGetDataHook$ = new Subject();

  idProp = 'id';

  private TABLE_HEADER_HEIGHT = 48;
  private TABLE_ROW_HEIGHT = 48;
  private TABLE_MIN_ROWS = 5;

  private tableHeight: number;

  get tableConf(): AppTableConfig {
    return this._tableConf;
  }

  @Input('conf') set tableConf(conf: AppTableConfig) {
    if (!this._tableConf) {
      this._tableConf = conf;
    } else {
      this._tableConf = conf;
      this.populateTable();
    }
  }

  constructor(public tableService: TableService) {}

  calculateLimitRows(): void {
    if (this.table) {
      this.tableHeight = this.table.nativeElement.offsetHeight;
      if (this.enableViewMore) {
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
  }

  ngAfterViewInit(): void {
    this.calculateLimitRows();
  }

  ngAfterViewChecked(): void {
    if (this.tableHeight !== this.table.nativeElement.offsetHeight) {
      setTimeout(() => this.calculateLimitRows());
    }
  }

  ngOnInit(): void {
    this.populateTable();

    this.afterGetDataHook$.pipe(untilDestroyed(this)).subscribe(() => {
      this.updateColumns();
    });
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

  editRow(row: any): void {
    if (this._tableConf.edit) {
      this._tableConf.edit(row);
    }
  }

  onButtonClick(row: any): void {
    if (this._tableConf.onButtonClick) {
      this._tableConf.onButtonClick(row);
    }
  }

  deleteRow(row: any): void {
    if (this._tableConf.delete) {
      this._tableConf.delete(row, this);
    } else {
      this.tableService.delete(this, row);
    }
    event.stopPropagation();
  }

  // TODO: Enum
  unifyState(state: string): string {
    return this.tableService.unifyState(state);
  }

  showInOutInfo(element: any): string {
    if (element.oldSent === undefined) {
      element.oldSent = element.sent_bytes;
    }
    if (element.oldReceived === undefined) {
      element.oldReceived = element.received_bytes;
    }
    if (element.sent_bytes - element.oldSent > 1024) {
      element.oldSent = element.sent_bytes;
      this.tableService.updateStateInfoIcon(element[this.idProp], 'sent');
    }
    if (element.received_bytes - element.oldReceived > 1024) {
      element.oldReceived = element.received_bytes;
      this.tableService.updateStateInfoIcon(element[this.idProp], 'received');
    }

    return `Sent: ${element.sent} Received: ${element.received}`;
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

  getButtonClass(row: any): string {
    // Bring warnings to user's attention even if state is finished or successful.
    if (row.warnings && row.warnings.length > 0) return 'fn-theme-orange';

    const state: JobState = row.state;

    switch (state) {
      case JobState.Pending:
        return 'fn-theme-orange';
      case JobState.Running:
        return 'fn-theme-orange';
      case JobState.Aborted:
        return 'fn-theme-orange';
      case JobState.Finished:
        return 'fn-theme-green';
      case JobState.Success:
        return 'fn-theme-green';
      case JobState.Error:
        return 'fn-theme-red';
      case JobState.Failed:
        return 'fn-theme-red';
      case JobState.Hold:
        return 'fn-theme-yellow';
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

    if (column.state && column.state.prop && this._tableConf.getInOutInfo) {
      return 'state-info';
    }
    if (column.state && column.state.icon) {
      return 'state-icon';
    }

    if (column.prop === 'state' && column.button === true) {
      return 'state-button';
    }

    if (['path', 'paths'].includes(column.prop) && column.showLockedStatus) {
      return 'path-locked-status';
    }

    return 'textview';
  }
}
