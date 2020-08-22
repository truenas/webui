import { Component, OnInit, Input } from '@angular/core';
import { WebSocketService } from 'app/services';

import * as _ from 'lodash';

export interface InputTableConf {
  title?: string;
  columns: any[];
  queryCall: string;
  queryCallOption?: any;
  hideHeader?: boolean; // hide table header row

  add?(); // add action function
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
export class TableComponent implements OnInit {
  @Input('conf') tableConf: InputTableConf;

  public title = '';
  public dataSource;
  public displayedColumns;
  public hideHeader = false;
  public actions;

  constructor(private ws: WebSocketService) { }
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
    });
  }

  // getProp(data, prop) {
  //   return _.get(data, prop);
  // }

  editRow(row) {
    console.log(row);
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
}