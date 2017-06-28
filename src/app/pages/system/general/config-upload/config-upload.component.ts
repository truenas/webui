import { Component, Inject, NgZone, ViewChild } from '@angular/core';

import { BaJob } from '../../../../theme/components';
import { RestService, WebSocketService } from '../../../../services/';

import { NgUploaderOptions, NgFileSelectDirective, UploadedFile } from 'ngx-uploader';
import { Subscription, Observable, Observer } from 'rxjs';

@Component({
  selector: 'config-upload',
  templateUrl: 'config-upload.component.html'
})
export class ConfigUploadComponent {

  public options: NgUploaderOptions;
  public busy: Subscription[] = [];
  public sub: Subscription;
  public observer: Observer<any>;
  public jobId: Number;
  //TODO add success/error messages
  public error:any;
  public success:any;
  @ViewChild(BaJob) baJob: BaJob;
  @ViewChild(NgFileSelectDirective) file: NgFileSelectDirective;

  constructor( @Inject(NgZone) private zone: NgZone, protected ws: WebSocketService) {
    this.options = new NgUploaderOptions({
      url: '/_upload',
      data: {
        data: JSON.stringify({
          method: 'config.upload',
        }),
      },
      autoUpload: false,
      calculateSpeed: true,
      customHeaders: {
        Authorization: 'Basic ' + btoa(ws.username + ':' + ws.password),
      },
    });
  }

  handleUpload(ufile: UploadedFile) {
    if(ufile.done) {
      let resp = JSON.parse(ufile.response);
      this.jobId = resp.job_id;
      this.baJob.jobId = this.jobId;
      this.observer.complete();
      this.baJob.show();
    }
  }

  onSubmit($event) {
    this.sub = Observable.create((observer) => {
      this.observer = observer;
      this.file.uploader.uploadFilesInQueue();
    }).subscribe();
    this.busy.push(this.sub);
  }

  onJobSuccess(job) {
    this.baJob.setDescription('Upload config has completed. Rebooting...')
  }

}