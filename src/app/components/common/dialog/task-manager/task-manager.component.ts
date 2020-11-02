import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';
import { LocaleService } from 'app/services/locale.service';
import { Observable, Subscription } from 'rxjs';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { HttpClient } from '@angular/common/http';

import { WebSocketService, JobService, SystemGeneralService, DialogService, StorageService } from '../../../../services/';
import { T } from '../../../../translate-marker';
import { EntityUtils } from '../../../../pages/common/entity/utils';
import * as _ from 'lodash';

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
  public timeZone: string;

  constructor(
    public dialogRef: MatDialogRef<TaskManagerComponent>,
    private ws: WebSocketService,
    protected translate: TranslateService,
    protected job: JobService,
    protected localeService: LocaleService,
    protected sysGeneralService: SystemGeneralService,
    protected dialogService: DialogService,
    protected storageService: StorageService,
    protected http: HttpClient) {
      this.dataSource = new MatTableDataSource<any>([]);
    }

  ngOnInit() {
    this.sysGeneralService.getSysInfo().subscribe((res) => {
      this.timeZone = res.timezone;
    })
    this.ws.call('core.get_jobs', [[], {order_by: ["-id"], limit: 50}]).subscribe(
      (res)=> {
        this.dataSource.data = res;
        this.dataSource.sort = this.sort;
      },
      (err)=> {

      });

    this.getData().subscribe(
      (res) => {
        // only update exist jobs or add latest jobs
        if (res.id >= this.dataSource.data[49].id) {
          const targetRow = _.findIndex(this.dataSource.data, {'id': res.id});
          if (targetRow === -1) {
            this.dataSource.data.push(res);
          } else {
            for (const key in this.dataSource.data[targetRow]) {
              this.dataSource.data[targetRow][key] = res[key];
            }
          }
          this.taskTable.renderRows();
        }
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
      return this.localeService.formatDateTime(new Date(data.$date), this.timeZone);
    }
    return;
  }

  showLogs(element) {
    this.dialogService.confirm(T('Logs'), `<pre>${element.logs_excerpt}</pre>`, true, T('Download Logs'),
      false, '', '', '', '', false, T('Close'), true).subscribe(
      (dialog_res) => {
        if (dialog_res) {
          this.ws.call('core.download', ['filesystem.get', [element.logs_path], element.id + '.log']).subscribe(
            (snack_res) => {
              const url = snack_res[1];
              const mimetype = 'text/plain';
              let failed = false;
              this.storageService.streamDownloadFile(this.http, url, element.id + '.log', mimetype).subscribe(file => {
                this.storageService.downloadBlob(file, element.id + '.log');
              }, err => {
                failed = true;
                new EntityUtils().handleWSError(this, err);
              });
            },
            (snack_res) => {
              new EntityUtils().handleWSError(this, snack_res);
            }
          );
        }
      });
  }
}
