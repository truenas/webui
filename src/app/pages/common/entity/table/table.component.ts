import { Component, OnInit, Input, ViewChild, AfterViewInit, AfterViewChecked } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { WebSocketService } from 'app/services';

import { TableService } from './table.service';

import * as _ from 'lodash';
import { EmptyConfig, EmptyType } from '../entity-empty/entity-empty.component';
import { T } from 'app/translate-marker';
import { EntityJobComponent } from '../entity-job';
import { MatDialog } from '@angular/material/dialog';

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
    doubleConfirm?(item: any): any;
  }; //
  tableComponent?: TableComponent;
  emptyEntityLarge?: boolean;
  parent: any;

  add?(): any; // add action function
  edit?(any: any): any; // edit row
  delete?(item: any, table: any): any; // customize delete row method
  dataSourceHelper?(any: any): any; // customise handle/modify dataSource
  getInOutInfo?(any: any): any; // get in out info if has state column
  getActions?(): any; // actions for each row
  isActionVisible?(actionId: string, entity: any): boolean; // determine if action is visible
  getDeleteCallParams?(row: any, id: any): any; // get delete Params
  onButtonClick?(row: any): any;
}

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
  providers: [TableService],
})
export class TableComponent implements OnInit, AfterViewInit, AfterViewChecked {
  @ViewChild('apptable') apptable: any;
  @ViewChild('table') table: any;

  public _tableConf: InputTableConf;
  public title = '';
  public titleHref: string;
  public dataSource: any[];
  public displayedDataSource: any[];
  public displayedColumns: any[];
  public hideHeader = false;
  public actions: any[];
  public emptyConf: EmptyConfig;
  public showViewMore = false;
  public showCollapse = false;

  protected idProp = 'id';

  private TABLE_HEADER_HEIGHT = 48;
  private TABLE_ROW_HEIGHT = 48;
  private TABLE_MIN_ROWS = 5;

  private tableHeight: number;
  private limitRows: number;
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

  editRow(row: any) {
    if (this._tableConf.edit) {
      this._tableConf.edit(row);
    }
  }

  onButtonClick(row: any) {
    if (this._tableConf.onButtonClick) {
      this._tableConf.onButtonClick(row);
    }
  }

  deleteRow(row: any) {
    if (this._tableConf.delete) {
      this._tableConf.delete(row, this);
    } else {
      this.tableService.delete(this, row);
    }
    event.stopPropagation();
  }

  // TODO: Enum
  unifyState(state: string) {
    return this.tableService.unifyState(state);
  }

  showInOutInfo(element: any) {
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

  getButtonClass(state: any) {
    switch (state) {
      case 'PENDING':
      case 'RUNNING':
      case 'ABORTED':
        return 'fn-theme-orange';
      case 'FINISHED':
      case 'SUCCESS':
        return 'fn-theme-green';
      case 'ERROR':
      case 'FAILED':
        return 'fn-theme-red';
      case 'HOLD':
        return 'fn-theme-yellow';
      default:
        return 'fn-theme-primary';
    }
  }

  determineColumnType(column: any) {
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
