import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatDialogRef, MatSort, MatTableDataSource, MatDialogTitle, MatTable } from '@angular/material';
import * as _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription } from 'rxjs/Rx';

import { WebSocketService } from '../../../../services/';

@Component({
  selector: 'task-manager',
  templateUrl: './task-manager.component.html',
  styleUrls: ['./task-manager.component.css'],
})
export class TaskManagerComponent implements OnInit, OnDestroy{

  public dataSource: MatTableDataSource<any>;
  @ViewChild('taskTable') taskTable: MatTable<any>;
  @ViewChild(MatSort) sort: MatSort;
  displayedColumns = ['state', 'method', 'percent'];
  private subscrition: Subscription;

  constructor(
    public dialogRef: MatDialogRef<TaskManagerComponent>,
    private ws: WebSocketService,
    protected translate: TranslateService) {
      this.dataSource = new MatTableDataSource<any>([]);
    }

  ngOnInit() {
    this.ws.call('core.get_jobs', []).subscribe(
      (res)=> {
        for (const i in res) {
          res[i].percent = res[i].progress.percent ? res[i].progress.percent : 0;
        }
        this.dataSource.data = res;
        this.dataSource.sort = this.sort;
      },
      (err)=> {

      });

      this.getData().subscribe(
        (res) => {
          res.percent = res.progress.percent;
          const targetRow = _.findIndex(this.dataSource.data, {'id': res.id});
          if (targetRow === -1) {
            this.dataSource.data.push(res);
          } else {
            for (const key in this.dataSource.data[targetRow]) {
              this.dataSource.data[targetRow][key] = res[key];
            }
          }
          // this.taskTable.renderRows();
          this.dataSource.data = this.dataSource.data.slice();
        }
      )
  }

  ngOnDestroy() {
    this.subscrition.unsubscribe();
  }

  getData(): Observable<any> {
    const source = Observable.create((observer) => {
        this.subscrition = this.ws.subscribe("core.get_jobs").subscribe((res) => {
          observer.next(res.fields);
        });
      });
    return source;
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
