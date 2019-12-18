import { OnInit, Component, EventEmitter, Input, Output, HostListener, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { DecimalPipe } from '@angular/common';
import { WebSocketService, RestService, SnackbarService } from '../../../../services/';
import { TranslateService } from '@ngx-translate/core';
import { Http } from '@angular/http';
import * as _ from 'lodash';
import globalHelptext from '../../../../helptext/global-helptext';
import { T } from '../../../../translate-marker';

@Component({
  selector: 'entity-job',
  templateUrl: 'entity-job.component.html',
  styleUrls: ['./entity-job.component.css'],
})
export class EntityJobComponent implements OnInit {

  public job: any = {};
  public progressTotalPercent = 0;
  public description: string;
  public method: string;
  public args: any[] = [];

  public title = '';
  public showCloseButton = true;
  public jobId: Number;
  public progressNumberType;
  public hideProgressValue = false;
  public altMessage: string;

  @Output() progress = new EventEmitter();
  @Output() success = new EventEmitter();
  @Output() failure = new EventEmitter();
  @Output() prefailure = new EventEmitter();
  constructor(public dialogRef: MatDialogRef < EntityJobComponent > ,
    private ws: WebSocketService, public rest: RestService, public snackbar: SnackbarService,
    @Inject(MAT_DIALOG_DATA) public data: any, translate: TranslateService, protected http: Http) {}

  ngOnInit() {
    // this.dialogRef.updateSize('35%', '200px');

    if (this.data.title) {
      this.setTitle(this.data.title);
    }

    if (this.dialogRef.disableClose) {
      this.showCloseButton = false;
    }
    if (this.data.CloseOnClickOutside) {
      this.showCloseButton = true;
      this.dialogRef.disableClose = true;
    }
  }

  setCall(method: string, args ?: any[]) {
    this.method = method;
    if (args) {
      this.args = args;
    }
  }

  setDescription(desc: string) {
    this.description = desc;
  }

  setTitle(title: string) {
    this.title = title;
  }

  changeAltMessage(msg: string) {
    this.altMessage = msg;
  }

  disableProgressValue(hide: boolean) {
    this.hideProgressValue = hide;
  }

  @HostListener('progress', ['$event'])
  public onProgress(progress) {

    if (progress.description) {
      this.description = progress.description;
    }
    if (progress.percent) {
      if (this.progressNumberType === 'nopercent') {
        this.progressTotalPercent = progress.percent * 100;
      }
      else {
        this.progressTotalPercent = progress.percent;
      }
    }
    this.disableProgressValue(progress.percent == null);
  }

  @HostListener('failure', ['$event'])
  public onFailure(job) {
    job.error = _.replace(job.error, '<', '< ');
    job.error = _.replace(job.error, '>', ' >');

    this.description = '<b>Error:</b> ' + job.error;
  }

  public close() {
    if (this.job.state && this.job.state === "RUNNING") {
      this.snackbar.open(globalHelptext.closed_job_message, T("OK"));
    }
  }

  public show() {
    this.ws.call('core.get_jobs', [
        [
          ['id', '=', this.jobId]
        ]
      ])
      .subscribe((res) => {
        if (res.length > 0) {
          this.jobUpdate(res[0]);
        }
      });
    this.ws.subscribe("core.get_jobs").subscribe((res) => {
      if (res.id === this.jobId) {
        this.jobUpdate(res);
      }
    });
  }

  jobUpdate(job) {
    this.job = job;
    if (job.progress) {
      this.progress.emit(job.progress);
    }
    if (job.state === 'SUCCESS') {
      this.success.emit(this.job);
    } else if (job.state === 'FAILED') {
      this.failure.emit(this.job);
    }
  }

  public submit() {
    this.ws.job(this.method, this.args)
      .subscribe(
        (res) => {
          this.job = res;
          if (res.progress) {
            this.progress.emit(res.progress);
          }
        },
        () => {},
        () => {
          if (this.job.state === 'SUCCESS') {
            this.success.emit(this.job);
          } else if (this.job.state === 'FAILED') {
            this.failure.emit(this.job);
          }
        });
  }

  public post(path, options) {
    this.rest.post(path, options).subscribe(
        (res) => {
          this.job = res;
          if (this.job.code === 202) {
            this.setDescription(this.job.data);
            this.success.emit(this.job);
          } else {
            this.progress.emit(this.job);
          }
        },
        () => {},
        () => {
        });
  }
  public wspost(path, options) {
    this.http.post(path, options).subscribe(
        (res) => {
          this.job = res;
          if (this.job.statusText === "OK") {
            this.jobId = JSON.parse(this.job._body).job_id;
            this.wsshow();
          } else {
            this.wsshow();
          }
        },
        (err) => {
          this.prefailure.emit(err)
        },
        () => {
        });
  }
  public wsshow() {
    this.ws.call('core.get_jobs', [
        [
          ['id', '=', this.jobId]
        ]
      ])
      .subscribe((res) => {
        if (res.length > 0) {
          this.wsjobUpdate(res[0]);
        }
      });
    this.ws.subscribe("core.get_jobs").subscribe((res) => {
      if (res.id === this.jobId) {
        this.wsjobUpdate(res);
      }
    });
  }

  wsjobUpdate(job) {
    this.job = job;
    if (job.fields) {
      this.job.state = job.fields.state;
    }
    if (job.progress) {
      this.progress.emit(job.progress);
    }
    if (job.fields) {
      if (job.fields.state === 'RUNNING') {
        this.progress.emit(this.job.fields.progress);
      }
      else if(job.fields.state === 'SUCCESS'){
        this.success.emit(this.job.fields);
      }
      else if ((job.fields.state === 'FAILED') || job.fields.error) {
        this.failure.emit(this.job.fields);
      }
    } else {
      if (job.state === 'SUCCESS') {
        this.success.emit(this.job);
      } else if (job.state === 'FAILED') {
        this.failure.emit(this.job);
      }
    }
  }
}
