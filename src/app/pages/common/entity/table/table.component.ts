import { Component, OnInit, Input } from '@angular/core';
import { WebSocketService } from 'app/services';

import * as _ from 'lodash';

export interface InputTableConf {
  title?: string;
  columns: any[];
  queryCall: string;
  queryCallOption?: any;

  dataSourceHelper?(any); // customise handle/modify dataSource 
  getActions?(); // actions for each row
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


  constructor(private ws: WebSocketService) { }
  ngOnInit() {
    this.title = this.tableConf.title || '';
    this.displayedColumns = this.tableConf.columns.map(col => col.name);

    if (this.tableConf.getActions) {
      this.displayedColumns.push('action'); // 
    }
    this.ws.call(this.tableConf.queryCall).subscribe(res => {
      if (this.tableConf.dataSourceHelper) {
         this.tableConf.dataSourceHelper(res);
      } 
        this.dataSource = res;
    })
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
}