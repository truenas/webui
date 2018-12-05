import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MatSort, MatTableDataSource, MatDialogTitle} from '@angular/material';
import * as _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';

import { WebSocketService } from '../../../../services/';

@Component({
  selector: 'task-manager',
  templateUrl: './task-manager.component.html',
  styleUrls: ['./task-manager.component.css'],
})
export class TaskManagerComponent implements OnInit{

  dataSource;
  @ViewChild(MatSort) sort: MatSort;
  displayedColumns = ['state', 'method', 'percent'];

  constructor(
    public dialogRef: MatDialogRef<TaskManagerComponent>,
    private ws: WebSocketService,
    protected translate: TranslateService) { }

  ngOnInit() {
    console.log("init task manager");
    this.ws.call('core.get_jobs', []).subscribe(
      (res)=> {
        console.log(res);
        for (const i in res) {
          res[i].percent = res[i].progress.percent ? res[i].progress.percent : 0;
        }
        console.log(res);
        
        this.dataSource = new MatTableDataSource(res);
        this.dataSource.sort = this.sort;
      },
      (err)=> {

      });
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
