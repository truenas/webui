import { Component, OnInit, Input, ViewChild, AfterViewInit, AfterViewChecked } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import * as _ from 'lodash';

import { WebSocketService } from 'app/services';
import { EmptyConfig, EmptyType } from '../entity-empty/entity-empty.component';
import { EntityJobState } from 'app/enums/entity-job-state.enum';
import { TableService } from './table.service';


export interface InputTableConf {
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
    doubleConfirm?(item);
  }; //
  tableComponent?: TableComponent;
  emptyEntityLarge?: boolean;
  parent: any;

  add?(); // add action function
  edit?(any); // edit row
  delete?(item, table); // customize delete row method
  dataSourceHelper?(any); // customise handle/modify dataSource
  getInOutInfo?(any); // get in out info if has state column
  getActions?(); // actions for each row
  isActionVisible?(actionId: string, entity: any): boolean; // determine if action is visible
  getDeleteCallParams?(row, id): any; // get delete Params
  onButtonClick?(row);
}

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
  providers: [TableService],
})
export class TableComponent implements OnInit, AfterViewInit, AfterViewChecked {
  @ViewChild('apptable') apptable;
  @ViewChild('table') table;

  public _tableConf: InputTableConf;
  public title = '';
  public titleHref: string;
  public dataSource;
  public displayedDataSource;
  public displayedColumns;
  public hideHeader = false;
  public actions;
  public emptyConf: EmptyConfig;
  public showViewMore = false;
  public showCollapse = false;

  protected idProp = 'id';

  private TABLE_HEADER_HEIGHT = 48;
  private TABLE_ROW_HEIGHT = 48;
  private TABLE_MIN_ROWS = 5;

  private tableHeight;
  private limitRows;
  private entityEmptyLarge = false;
  private enableViewMore = false;

  get tableConf() {
    return this._tableConf;
  }

  @Input('conf') set tableConf(conf: InputTableConf) {
    if (!this._tableConf) {
      this._tableConf = conf;
    } else {
      this._tableConf = conf;
      this.populateTable();
    }
  }

  constructor(private ws: WebSocketService, private tableService: TableService, private matDialog: MatDialog) {}

  calculateLimitRows() {
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
        this.displayedDataSource = this.dataSource.slice(0, this.limitRows);
        this.showViewMore = this.dataSource.length !== this.displayedDataSource.length;
        if (this.showCollapse) {
          this.showCollapse = this.dataSource.length !== this.displayedDataSource.length;
        }
      }
    }
  }

  ngAfterViewInit() {
    this.calculateLimitRows();
  }

  ngAfterViewChecked() {
    if (this.tableHeight !== this.table.nativeElement.offsetHeight) {
      setTimeout(() => this.calculateLimitRows());
    }
  }
  ngOnInit() {
    this.populateTable();
  }

  populateTable() {
    this.title = this._tableConf.title || '';
    if (this._tableConf.titleHref) {
      this.titleHref = this._tableConf.titleHref;
    }

    this.entityEmptyLarge = this._tableConf.emptyEntityLarge;
    this.emptyConf = {
      type: EmptyType.loading,
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

  getData() {
    this.tableService.getData(this);
  }

  editRow(row) {
    if (this._tableConf.edit) {
      this._tableConf.edit(row);
    }
  }

  onButtonClick(row) {
    if (this._tableConf.onButtonClick) {
      this._tableConf.onButtonClick(row);
    }
  }

  deleteRow(row) {
    if (this._tableConf.delete) {
      this._tableConf.delete(row, this);
    } else {
      this.tableService.delete(this, row);
    }
    event.stopPropagation();
  }

  unifyState(state) {
    return this.tableService.unifyState(state);
  }

  showInOutInfo(element) {
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

  openViewMore() {
    this.enableViewMore = true;
    this.displayedDataSource = this.dataSource;
    this.showViewMore = false;
    this.showCollapse = true;
  }

  collapse() {
    this.enableViewMore = false;
    this.displayedDataSource = this.dataSource.slice(0, this.limitRows);
    this.showViewMore = true;
    this.showCollapse = false;
  }

  getButtonClass(state: EntityJobState): string {
    switch(state) {
      case EntityJobState.Pending: return 'fn-theme-orange';
      case EntityJobState.Running: return 'fn-theme-orange';
      case EntityJobState.Aborted: return 'fn-theme-orange';
      case EntityJobState.Finished: return 'fn-theme-green';
      case EntityJobState.Success: return 'fn-theme-green';
      case EntityJobState.Error: return 'fn-theme-red';
      case EntityJobState.Failed: return 'fn-theme-red';
      case EntityJobState.Hold: return 'fn-theme-yellow';
      default: return 'fn-theme-primary';
    }
  }

  determineColumnType(column) {
    if (column.listview) {
      return 'listview';
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
