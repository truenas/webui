import {  Component,  ViewChild, } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { Observer  } from 'rxjs/Observer';
import { HttpClient} from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { FieldConfig } from '../../models/field-config.interface';
import { WebSocketService, DialogService } from '../../../../../../services/';
import { AppLoaderService } from '../../../../../../services/app-loader/app-loader.service';
import { Http } from '@angular/http';
import { MatSnackBar } from '@angular/material';


@Component({
  selector: 'app-form-upload',
  templateUrl: './form-upload.component.html',
  styleUrls: ['../dynamic-field/dynamic-field.css', 'form-upload.component.css'],
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
    private dialog:DialogService, public snackBar: MatSnackBar, public translate: TranslateService) {}

  upload(location = "/tmp/") {
    if(this.config.updater && this.config.parent ){
      this.config.updater(this, this.config.parent);
      return;
    }
  this.loader.open();

  const fileBrowser = this.fileInput.nativeElement;
  if (fileBrowser.files && fileBrowser.files[0]) {
    const formData: FormData = new FormData();
    formData.append('data', JSON.stringify({
      "method": "filesystem.put",
      "params": [location + '/' + fileBrowser.files[0].name, { "mode": "493" }]
    }));
    formData.append('file', fileBrowser.files[0]);

    this.http.post(this.apiEndPoint, formData).subscribe(
      (data) => {
        this.newMessage(location + '/' + fileBrowser.files[0].name);
        this.loader.close();
        this.snackBar.open("File upload complete.", 'close', { duration: 5000 });
      },
      (error) => {
        this.loader.close();
        this.dialog.errorReport(error.status, error.statusText, error._body);
      }
    );
  } else{
    this.loader.close();
  };
}
newMessage(message){
  if(this.config.message){
    this.config.message.newMessage(message);
  }

}
}
