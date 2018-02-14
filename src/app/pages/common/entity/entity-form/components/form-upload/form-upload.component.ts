import { ApplicationRef, Component, Injector, OnInit, Inject, NgZone, ViewChild, EventEmitter } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, Validator } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, Observer, Subscription } from 'rxjs';
import { HttpClient, HttpParams, HttpRequest, HttpEvent } from '@angular/common/http';

import { FieldConfig } from '../../models/field-config.interface';
import { Field } from '../../models/field.interface';
import { WebSocketService, } from '../../../../../../services/';
import { RestService } from '../../../../../../services/';
import { EntityJobComponent } from '../../../entity-job/entity-job.component';
import { TooltipComponent } from '../tooltip/tooltip.component';

import { NgFileSelectDirective, UploadStatus, UploadOutput, UploadInput, UploadFile, humanizeBytes, UploaderOptions } from 'ngx-uploader';
import { RequestOptions, Http } from '@angular/http';
import { HttpHeaders } from '@angular/common/http'
import { Headers } from '@angular/http';
import { CustomUploadInput } from './upload-input-interface.component';
@Component({
  selector: 'app-form-upload',
  template: `<input type="file" placeholder="Upload file" (change)="onFileUpload($event)" accept=".iso">`,
  // template: `<input type="file" (change)="fileChange($event)" placeholder="Upload file" accept=".iso">`,
  styleUrls: ['../dynamic-field/dynamic-field.css'],
})
export class FormUploadComponent {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
  files: UploadFile[];
  uploadInput: EventEmitter < CustomUploadInput > ;
  humanizeBytes: Function;
  dragOver: boolean;
  public options: UploadInput;
  public busy: Subscription[] = [];
  public sub: Subscription;
  public observer: Observer < any > ;
  public jobId: Number;
  public apiEndPoint ='';
  @ViewChild(NgFileSelectDirective) file: NgFileSelectDirective;

  constructor(@Inject(NgZone) private zone: NgZone,
    protected ws: WebSocketService, protected http: Http) {

    }
  //   {
  //   this.files = []; // local uploading files array
  //   this.uploadInput = new EventEmitter < CustomUploadInput > (); // input events
  //   this.humanizeBytes = humanizeBytes;
  //   this.options = {
  //     url: '/_upload',
  //     type: "uploadFile",
  //     method: 'POST',
  //     data: {
  //       data: JSON.stringify({
  //         "method": "filesystem.put",
  //         "params": ["/tmp/form_upload/test.conf", { "mode": "493" }]
  //       })
  //     },
  //     withCredentials: true,
  //     headers: {
  //       Authorization: 'Token ' + this.ws.token,
  //     }
  //   };
  // }

  handleUpload(ufile: UploadFile) {
    console.log("handle triggered");
    if (ufile.progress.status === UploadStatus.Done) {
      let resp = JSON.parse(ufile.response);
      this.jobId = resp.job_id;
      this.observer.complete();
      console.log(ufile);
    }
  }

  //for Drag n drop
  onUploadOutput(output: UploadOutput): void {
    if (output.type === 'allAddedToQueue') {
      const event: CustomUploadInput = {
        type: 'uploadAll',
        url: 'http://ngx-uploader.com/upload',
        method: 'POST',
        data: { foo: 'bar' }
      };

      this.uploadInput.emit(event);
    } else if (output.type === 'addedToQueue' && typeof output.file !== 'undefined') {
      this.files.push(output.file);
    } else if (output.type === 'uploading' && typeof output.file !== 'undefined') {
      const index = this.files.findIndex(file => typeof output.file !== 'undefined' && file.id === output.file.id);
      this.files[index] = output.file;
    } else if (output.type === 'removed') {
      this.files = this.files.filter((file: UploadFile) => file !== output.file);
    } else if (output.type === 'dragOver') {
      this.dragOver = true;
    } else if (output.type === 'dragOut') {
      this.dragOver = false;
    } else if (output.type === 'drop') {
      this.dragOver = false;
    } else if (output.type === 'rejected' && typeof output.file !== 'undefined') {
      console.log(output.file.name + ' rejected');
    }

    this.files = this.files.filter(file => file.progress.status !== UploadStatus.Done);
  }

  startUpload(): void {
    console.log("started");
    const event: CustomUploadInput = {
      type: 'uploadAll',
      url: '/mnt/data/iso_dataset',
      method: 'POST',
      data: {
        data: JSON.stringify({
          "method": "filesystem.put",
          "params": ["/Users/vaibhavchauhan/FreeNAS-11-201802080558-31414ad.iso", { "mode": "493" }]
        })
      },
      withCredentials: true,
      headers: {
        Authorization: 'Token ' + this.ws.token,
      }
    };

    this.uploadInput.emit(event);
    //this.doSubmit(event);
  }

  // uploadFile(): Observable < HttpEvent < any >> {

  //   let formData = new FormData();
  //   // formData.append('upload', {});

  //   let params = new HttpParams();

  //   const options = {
  //     params: params,
  //     reportProgress: true,
  //   };

  //   const req = new HttpRequest(
  //     'POST', 
  //     '/_upload',
  //     {
  //       data: {
  //         "method": "filesystem.put",
  //         "params": ["/tmp/form_upload/test.conf", { "mode": "493" }]
  //       }
  //     }, options
  //   );
  //   return this.http.request(req);
  // }

  cancelUpload(id: string): void {
    this.uploadInput.emit({ type: 'cancel', id: id });
  }

  removeFile(id: string): void {
    this.uploadInput.emit({ type: 'remove', id: id });
  }

  removeAllFiles(): void {
    this.uploadInput.emit({ type: 'removeAll' });
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
  fileChange(event) {
    const fileList: FileList = event.target.files;
    if(fileList.length > 0) {
      const file: File = fileList[0];
      const formData:FormData = new FormData();
        formData.append('uploadFile', file, file.name);
        const headers = new Headers();
        /** No need to include Content-Type in Angular 4 */
        headers.append('Content-Type', 'multipart/form-data');
        headers.append('Accept', 'application/json');
        const options = new RequestOptions(
          { headers: headers }
        );
        console.log(formData);
        console.log(options); 
        this.http.post(`${this.apiEndPoint}`, formData, options)
            .map(res => res.json())
            .catch(error => Observable.throw(error))
            .subscribe(
                data => console.log('success'),
                error => console.log(error)
            )
    }
}
onFileUpload(event: EventTarget) {

  const eventObj: MSInputMethodContext = <MSInputMethodContext>event;
  const target: HTMLInputElement = <HTMLInputElement>eventObj.target;
  const files: FileList = target.files;

  const formData: FormData = new FormData();

  for (let i = 0; i < files.length; i++) {
    formData.append('file', files[i]);
  }

  // POST
  this.http.post(this.apiEndPoint, formData).subscribe(
    data => console.log('success'),
    error => console.log(error)
  );
}
}
