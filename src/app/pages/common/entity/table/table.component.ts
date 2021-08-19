import {
  Component, OnInit, Input, ViewChild, AfterViewInit, AfterViewChecked,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { JobState } from 'app/enums/job-state.enum';
import { WebSocketService } from 'app/services';
import { EmptyConfig, EmptyType } from '../entity-empty/entity-empty.component';
import { TableService } from './table.service';

export interface AppTableAction<Row = any> {
  name: string;
  icon: string;
  matTooltip?: string;
  onClick: (row: Row) => void;
}

export interface AppTableHeaderAction {
  label: string;
  onClick: () => void;
}

export interface AppTableConfig<P = any> {
  title?: string;
  titleHref?: string;
  columns: any[];
  queryCall: string;
  queryCallOption?: any;
  deleteCall?: string;
  deleteCallIsJob?: boolean;
  complex?: boolean;
  hideHeader?: boolean; // hide table header row
  name?: string;
  deleteMsg?: {
    title: string;
    key_props: string[];
    id_prop?: string;
    doubleConfirm?(item: any): any;
  }; //
  tableComponent?: TableComponent;
  emptyEntityLarge?: boolean;
  hideEntityEmpty?: boolean;
  alwaysHideViewMore?: boolean;
  parent: P;
  tableActions?: AppTableHeaderAction[];
  tableExtraActions?: AppTableHeaderAction[];

  add?(): any; // add action function
  afterGetData?(data: any): void;
  afterDelete?(tableComponent: any): void;
  edit?(any: any): any; // edit row
  delete?(item: any, table: TableComponent): any; // customize delete row method
  dataSourceHelper?(any: any): any; // customise handle/modify dataSource
  getInOutInfo?(any: any): any; // get in out info if has state column
  getActions?: () => AppTableAction[]; // actions for each row
  isActionVisible?(actionId: string, entity: any): boolean; // determine if action is visible
  getDeleteCallParams?(row: any, id: any): any; // get delete Params
  onButtonClick?(row: any): any;

  expandable?: boolean; // field introduced by ExpandableTable, "fake" field
  afterGetDataExpandable?(data: any): void; // field introduced by ExpandableTable, "fake" field
}

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  providers: [TableService],
})
export class TableComponent implements OnInit, AfterViewInit, AfterViewChecked {
  @ViewChild('table') table: any;

  _tableConf: AppTableConfig;
  title = '';
  titleHref: string;
  dataSource: any[];
  displayedDataSource: any[];
  displayedColumns: any[];
  hideHeader = false;
  actions: AppTableAction[];
  emptyConf: EmptyConfig;
  showViewMore = false;
  showCollapse = false;

  protected idProp = 'id';

  private TABLE_HEADER_HEIGHT = 48;
  private TABLE_ROW_HEIGHT = 48;
  private TABLE_MIN_ROWS = 5;

  private tableHeight: number;
  private limitRows: number;
  private entityEmptyLarge = false;
  private enableViewMore = false;

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

  constructor(private ws: WebSocketService, private tableService: TableService, private matDialog: MatDialog) {}

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
    this.displayedColumns = this._tableConf.columns.map((col) => col.name);

    if (this._tableConf.getActions || this._tableConf.deleteCall) {
      this.displayedColumns.push('action'); // add action column to table
      this.actions = this._tableConf.getActions ? this._tableConf.getActions() : []; // get all row actions
    }
    this.getData();

    this.idProp = this._tableConf.deleteMsg === undefined ? 'id' : this._tableConf.deleteMsg.id_prop || 'id';
    this._tableConf.tableComponent = this;
  }

  getData(): void {
    this.tableService.getData(this);
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

  getButtonClass(state: JobState): string {
    switch (state) {
      case JobState.Pending: return 'fn-theme-orange';
      case JobState.Running: return 'fn-theme-orange';
      case JobState.Aborted: return 'fn-theme-orange';
      case JobState.Finished: return 'fn-theme-green';
      case JobState.Success: return 'fn-theme-green';
      case JobState.Error: return 'fn-theme-red';
      case JobState.Failed: return 'fn-theme-red';
      case JobState.Hold: return 'fn-theme-yellow';
      default: return 'fn-theme-primary';
    }
  }

  determineColumnType(column: any): string {
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

    if (column.prop === 'state' && column['button'] === true) {
      return 'state-button';
    }

    return 'textview';
  }
}
