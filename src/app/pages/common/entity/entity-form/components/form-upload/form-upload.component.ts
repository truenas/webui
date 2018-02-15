import { ApplicationRef, Component, Injector, OnInit, Inject, NgZone, ViewChild, EventEmitter } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, Validator } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, Observer, Subscription } from 'rxjs';
import { HttpClient, HttpParams, HttpRequest, HttpEvent, HttpHeaders } from '@angular/common/http';

import { FieldConfig } from '../../models/field-config.interface';
import { Field } from '../../models/field.interface';
import { RestService, WebSocketService, DialogService } from '../../../../../../services/';
import { AppLoaderService } from '../../../../../../services/app-loader/app-loader.service';
import { EntityJobComponent } from '../../../entity-job/entity-job.component';
import { TooltipComponent } from '../tooltip/tooltip.component';

import { RequestOptions, Http } from '@angular/http';
import { Headers } from '@angular/http';
import { MatSnackBar } from '@angular/material';


@Component({
  selector: 'app-form-upload',
  templateUrl: './form-upload.component.html',
  styleUrls: ['../dynamic-field/dynamic-field.css'],
})
export class FormUploadComponent {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
  public busy: Subscription[] = [];
  public sub: Subscription;
  public observer: Observer < any > ;
  public jobId: Number;
  public fileBrowser = true;
  public apiEndPoint = '/_upload?auth_token=' + this.ws.token;

  constructor(
    protected ws: WebSocketService, protected http: Http, private loader: AppLoaderService,
    private dialog:DialogService, public snackBar: MatSnackBar) {

  }
//   startUpload(): void {
//     const event: CustomUploadInput = {
//       type: 'uploadAll',
//       url: '/mnt/data/iso_dataset',
//       method: 'POST',
//       data: {
//         data: JSON.stringify({
//           "method": "filesystem.put",
//           "params": ["/mnt/data/iso_dataset/9781783555130-PYTHON_MACHINE_LEARNING.pdf", { "mode": "493" }]
//         })
//       },
//       withCredentials: true,
//       headers: {
//         Authorization: 'Token ' + this.ws.token,
//       }
//     };
  
// }
onFileUpload(event: EventTarget) {
  this.loader.open();

  const eventObj: MSInputMethodContext = <MSInputMethodContext>event;
  const target: HTMLInputElement = <HTMLInputElement>eventObj.target;
  const files: FileList = target.files;

  const formData: FormData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('file', files[i]);
    formData.append('data', JSON.stringify({
      "method": "filesystem.put",
      "params": ["/tmp/"+files[i].name, { "mode": "493" }]
    }))
  }
  this.http.post(this.apiEndPoint, formData).subscribe(
    (data) => {
      this.loader.close();
      this.snackBar.open("your files are uploaded", 'close', { duration: 5000 })
    },
    (error) => {
      this.loader.close();
      this.dialog.errorReport(error.status, error.statusText, error._body);
    }
  );
}
}
