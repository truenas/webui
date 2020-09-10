import { Component, OnInit, Input, ViewChild, AfterViewInit, AfterViewChecked } from '@angular/core';
import { WebSocketService } from 'app/services';

import { TableService } from './table.service';

import * as _ from 'lodash';

export interface InputTableConf {
  title?: string;
  columns: any[];
  queryCall: string;
  queryCallOption?: any;
  deleteCall?: string;
  hideHeader?: boolean; // hide table header row
  deleteMsg?: {
    title: string,
    key_props: string[],
    id_prop?: string,
    doubleConfirm?(item),
  }; //

  add?(); // add action function
  edit?(any); // edit row
  delete?(item); // customize delete row method
  dataSourceHelper?(any); // customise handle/modify dataSource 
  getInOutInfo?(any); // get in out info if has state column
  getActions?(); // actions for each row
  isActionVisible?(): boolean; // determine if action is visible
  getDeleteCallParams?(row, id): any; // get delete Params
}

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
  providers: [TableService]
})
export class TableComponent implements OnInit, AfterViewInit, AfterViewChecked {
  @Input('conf') tableConf: InputTableConf;
  @ViewChild('apptable') apptable;
  @ViewChild('table') table;

  public title = '';
  public dataSource;
  public displayedDataSource;
  public displayedColumns;
  public hideHeader = false;
  public actions;
  private tableHeight;
  private limitRows;
  public showViewMore = false;
  private enableViewMore = false;
  public showCollapse = false;

  private TABLE_MIN_ROWS = 5;

  protected idProp = 'id' ;

  constructor(private ws: WebSocketService,
    private tableService: TableService) { }

  calculateLimitRows() {
    if (this.table) {
      this.tableHeight = this.table.nativeElement.offsetHeight;
      if (this.enableViewMore) {
        return;
      }
      this.limitRows = Math.floor((this.tableHeight - (this.tableConf.hideHeader ? 0 : 56)) / 48);
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
    this.title = this.tableConf.title || '';
    if (this.tableConf.hideHeader) {
      this.hideHeader = this.tableConf.hideHeader;
    }
    this.displayedColumns = this.tableConf.columns.map(col => col.name);

    if (this.tableConf.getActions || this.tableConf.deleteCall) {
      this.displayedColumns.push('action'); // add action column to table
      this.actions = this.tableConf.getActions ? this.tableConf.getActions() : []; // get all row actions
    }
    this.tableService.getData(this);

    this.idProp = this.tableConf.deleteMsg === undefined ? 'id' : this.tableConf.deleteMsg.id_prop || 'id' ;
  }

  // getProp(data, prop) {
  //   return _.get(data, prop);
  // }

  editRow(row) {
    if (this.tableConf.edit) {
      this.tableConf.edit(row);
    }
  }

  deleteRow(row) {
    if (this.tableConf.delete) {
      this.tableConf.delete(row);
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
}