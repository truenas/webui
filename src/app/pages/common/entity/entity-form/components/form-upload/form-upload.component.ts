import { ApplicationRef, Component, Injector, OnInit, Inject, NgZone, ViewChild } from '@angular/core';
import { NgFileSelectDirective, UploadInput, UploadFile, UploadStatus } from 'ngx-uploader';
import { AbstractControl, FormArray, FormGroup, Validator } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, Observer, Subscription } from 'rxjs';

import {FieldConfig} from '../../models/field-config.interface';
import {Field} from '../../models/field.interface';
import { WebSocketService,  } from '../../../../../../services/';
import { RestService } from '../../../../../../services/';
import { EntityJobComponent } from '../../../entity-job/entity-job.component';
import {TooltipComponent} from '../tooltip/tooltip.component';

@Component({
  selector : 'form-upload',
  templateUrl : './form-upload.component.html',
  styleUrls : [ '../dynamic-field/dynamic-field.css' ],
})
export class FormUploadComponent {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
  public options: UploadInput;
  public busy: Subscription[] = [];
  public sub: Subscription;
  public observer: Observer < any > ;
  public jobId: Number;
  @ViewChild(NgFileSelectDirective) file: NgFileSelectDirective;

  constructor(@Inject(NgZone) private zone: NgZone,
    protected ws: WebSocketService) {
    this.options = {
      url: '/_upload',
      type: "uploadFile",
      data: {
        data: JSON.stringify({
          method: 'config.upload',
        }),
      },
      withCredentials: true,
      headers: {
        Authorization: 'Token ' + ws.token,
      }
    };
  }

  handleUpload(ufile: UploadFile) {
    if (ufile.progress.status === UploadStatus.Done ) {
      let resp = JSON.parse(ufile.response);
      this.jobId = resp.job_id;
      this.observer.complete();
    }
  }

  doSubmit($event) {
    this.sub = Observable
                   .create((observer) => {
                     this.observer = observer;
                     this.file.upload.uploadScheduler.complete();
                   })
                   .subscribe();
    this.busy.push(this.sub);
  }
}