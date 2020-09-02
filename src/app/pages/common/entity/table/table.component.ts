import { Component, OnInit, Input, ViewChild, AfterViewInit, AfterViewChecked } from '@angular/core';
import { WebSocketService } from 'app/services';

import * as _ from 'lodash';

export interface InputTableConf {
  title?: string;
  columns: any[];
  queryCall: string;
  queryCallOption?: any;
  hideHeader?: boolean; // hide table header row

  add?(); // add action function
  edit?(any); // edit row
  dataSourceHelper?(any); // customise handle/modify dataSource 
  getInOutInfo?(any); // get in out info if has state column
  getActions?(); // actions for each row
  isActionVisible?(): boolean; // determine if action is visible
}

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
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

  constructor(private ws: WebSocketService) { }
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

    if (this.tableConf.getActions) {
      this.displayedColumns.push('action'); // add action column to table
      this.actions = this.tableConf.getActions(); // get all row actions
    }
    this.ws.call(this.tableConf.queryCall).subscribe(res => {
      if (this.tableConf.dataSourceHelper) {
         res = this.tableConf.dataSourceHelper(res);
      } 
      if (this.tableConf.getInOutInfo) {
        this.tableConf.getInOutInfo(res);
      }
        this.dataSource = res;
        if (this.limitRows) {
          this.displayedDataSource = this.dataSource.slice(0, this.limitRows - 1);
          this.showViewMore = this.dataSource.length !== this.displayedDataSource.length;
        }
    });
  }

  // getProp(data, prop) {
  //   return _.get(data, prop);
  // }

  editRow(row) {
    console.log(row);
    if (this.tableConf.edit) {
      this.tableConf.edit(row);
    }
  }

  deleteRow(row) {
    console.log('delete', row);
    event.stopPropagation();
  }

  unifyState(state) {
    const stateClass = {
      UP: 'STATE_UP',
      DOWN: 'STATE_DOWN',
    }
    switch(state.toUpperCase()) {
      case 'UP':
        return stateClass.UP;
        break;
      case 'DOWN':
        return stateClass.DOWN;
    }
  }

  showInOutInfo(element) {
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