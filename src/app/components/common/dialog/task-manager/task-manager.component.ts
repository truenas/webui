import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatDialogRef, MatSort, MatTableDataSource, MatTable } from '@angular/material';
import * as _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription } from 'rxjs/Rx';
import { animate, state, style, transition, trigger } from '@angular/animations';

import { WebSocketService, JobService } from '../../../../services/';

@Component({
  selector: 'task-manager',
  templateUrl: './task-manager.component.html',
  styleUrls: ['./task-manager.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({height: '0px', minHeight: '0', display: 'none'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('expanded <=> void', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ]),
  ],
})
export class TaskManagerComponent implements OnInit, OnDestroy{

  public dataSource: MatTableDataSource<any>;
  @ViewChild('taskTable', { static: true}) taskTable: MatTable<any>;
  @ViewChild(MatSort, { static: false}) sort: MatSort;
  displayedColumns = ['state', 'method', 'percent'];
  private subscrition: Subscription;
  public expandedElement: any | null;

  constructor(
    public dialogRef: MatDialogRef<TaskManagerComponent>,
    private ws: WebSocketService,
    protected translate: TranslateService,
    protected job: JobService) {
      this.dataSource = new MatTableDataSource<any>([]);
    }

  ngOnInit() {
    this.ws.call('core.get_jobs', []).subscribe(
      (res)=> {
        for (const i in res) {
          res[i].percent = res[i].progress.percent ? res[i].progress.percent : 0;
        }
        this.dataSource.data = res.sort(function(a, b) {
          return b.time_started.$date - a.time_started.$date;
        });
        this.dataSource.sort = this.sort;
        this.dataSource.data.forEach((i) => {
          delete i.exception;
        })
      },
      (err)=> {

      });

      this.getData().subscribe(
        (res) => { 
          res.percent = res.progress.percent;
          const targetRow = _.findIndex(this.dataSource.data, {'id': res.id});
          if (targetRow === -1) {
            if (res.exception) {
              delete res.exception;
            }
            this.dataSource.data.push(res);
          } else {
            for (const key in this.dataSource.data[targetRow]) {
              this.dataSource.data[targetRow][key] = res[key];
            }
          }
          this.taskTable.renderRows();
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

  getReadableDate(data: any) {
    if (data != null) {
      return new Date(data.$date);
    }
    return;
  }

  showLogs(element) {
    this.job.showLogs(element.id);
  }
}
