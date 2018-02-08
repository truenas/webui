import { OnInit, Component, EventEmitter, Input, Output, HostListener, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { DecimalPipe } from '@angular/common';
import { WebSocketService, RestService } from '../../../../services/';

@Component({
  selector: 'entity-job',
  templateUrl: 'entity-job.component.html',
})
export class EntityJobComponent implements OnInit {

  public job: any = {};
  public progressTotalPercent: number = 0;
  public description: string;
  public method: string;
  public args: any[] = [];

  public title: string = '';
  public showCloseButton: boolean = true;
  public jobId: Number;
  public progressNumberType;

  @Output() progress = new EventEmitter();
  @Output() success = new EventEmitter();
  @Output() failure = new EventEmitter();
  constructor(public dialogRef: MatDialogRef < EntityJobComponent > ,
    private ws: WebSocketService, public rest: RestService,
    @Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit() {
    this.dialogRef.updateSize('25%', '20%');

    if (this.data.title) {
      this.title = this.data.title;
    }
  }

  setCall(method: string, args ? : any[]) {
    this.method = method;
    if (args) {
      this.args = args;
    }
  }

  setDescription(desc: string) {
    this.description = desc;
  }

  @HostListener('progress', ['$event'])
  public onProgress(progress) {

    if (progress.description) {
      this.description = progress.description;
    }
    if (progress.percent) {
      if (this.progressNumberType == 'nopercent') {
        this.progressTotalPercent = progress.percent * 100;
      }
      else {
        this.progressTotalPercent = progress.percent;
      }
    }
  }

  @HostListener('failure', ['$event'])
  public onFailure(job) {
    this.description = job.error;
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
      if (res.id == this.jobId) {
        this.jobUpdate(res);
      }
    });
  }

  jobUpdate(job) {
    this.job = job;
    if (job.progress) {
      this.progress.emit(job.progress);
    }
    if (job.state == 'SUCCESS') {
      this.success.emit(this.job);
    } else if (job.state == 'FAILED') {
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
          if (this.job.state == 'SUCCESS') {
            this.success.emit(this.job);
          } else if (this.job.state == 'FAILED') {
            this.failure.emit(this.job);
          }
        });
  }

  public post(path, options) {
    this.rest.post(path, options).subscribe(
        (res) => {
          this.job = res;
          if (this.job.code == 202) {
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
}
