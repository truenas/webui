import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MatSort, MatTableDataSource} from '@angular/material';
import * as _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';

import { WebSocketService } from '../../../../services/';

@Component({
  selector: 'task-manager',
  templateUrl: './task-manager.component.html',
})
export class TaskManagerComponent implements OnInit{

  public jobs: any;

  constructor(
    public dialogRef: MatDialogRef<TaskManagerComponent>,
    private ws: WebSocketService,
    protected translate: TranslateService) { }

  ngOnInit() {
    console.log("init task manager");
    this.ws.call('core.get_jobs', []).subscribe(
      (res)=> {
        console.log(res);
        
        this.jobs = res;
      },
      (err)=> {

      });
  }

}
