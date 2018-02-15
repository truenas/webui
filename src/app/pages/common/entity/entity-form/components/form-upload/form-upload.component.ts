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
  @ViewChild('fileInput') fileInput;
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
private upload() {
  this.loader.open();
  
  const fileBrowser = this.fileInput.nativeElement;
  if (fileBrowser.files && fileBrowser.files[0]) {
    const formData: FormData = new FormData();
    formData.append('files', fileBrowser.files[0]);
    formData.append('data', JSON.stringify({
      "method": "filesystem.put",
      "params": ["/tmp/"+fileBrowser.files[0].name, { "mode": "493" }]
    }));

    this.http.post(this.apiEndPoint, formData).subscribe(
      (data) => {
        this.loader.close();
        this.snackBar.open("your files are uploaded", 'close', { duration: 5000 });
      },
      (error) => {
        this.loader.close();
        this.dialog.errorReport(error.status, error.statusText, error._body);
        
      }
    );
  };
}
}
