import {
  HttpClient, HttpRequest, HttpEventType, HttpResponse,
} from '@angular/common/http';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  catchError, EMPTY, Subscription, switchMap, tap,
} from 'rxjs';
import { FormUploadConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './form-upload.component.html',
  styleUrls: ['../dynamic-field/dynamic-field.scss', 'form-upload.component.scss'],
})
export class FormUploadComponent {
  @ViewChild('fileInput', { static: false }) fileInput: ElementRef<HTMLInputElement>;
  config: FormUploadConfig;
  group: UntypedFormGroup;
  fieldShow: string;
  busy: Subscription[] = [];
  sub: Subscription;
  jobId: number;
  fileList: FileList;
  fbrowser: HTMLInputElement;

  constructor(
    protected ws: WebSocketService,
    protected http: HttpClient,
    private loader: AppLoaderService,
    public dialog: DialogService,
    public translate: TranslateService,
    private snackbar: SnackbarService,
  ) {}

  fileBtnClick(): void {
    this.fileInput.nativeElement.click();
    this.fbrowser = document.getElementById('fb') as HTMLInputElement;
    this.fbrowser.onchange = () => {
      this.fileList = this.fileInput.nativeElement.files;
    };
  }

  upload(location = '/tmp/'): void {
    if (this.config.updater) {
      this.config.updater(this, this.config.parent);
      return;
    }

    const fileBrowser = this.fileInput.nativeElement;

    if (fileBrowser.files && fileBrowser.files[0]) {
      this.loader.open();
      this.ws.call('auth.generate_token').pipe(
        switchMap((token) => {
          const formData: FormData = new FormData();
          formData.append('data', JSON.stringify({
            method: 'filesystem.put',
            params: [location + '/' + fileBrowser.files[0].name, { mode: '493' }],
          }));
          formData.append('file', fileBrowser.files[0]);
          const req = new HttpRequest('POST', '/_upload?auth_token=' + token, formData, {
            reportProgress: true,
          });
          return this.http.request(req);
        }),
        tap((event) => {
          if (event.type === HttpEventType.UploadProgress) {
            const percentDone = Math.round(100 * event.loaded / event.total);
            this.loader.dialogRef.componentInstance.title = `${percentDone}% Uploaded`;
          } else if (event instanceof HttpResponse) {
            if (event.statusText === 'OK') {
              this.newMessage(location + '/' + fileBrowser.files[0].name);
              this.loader.close();
              this.snackbar.success(this.translate.instant('File upload complete'));
            }
          }
        }),
        catchError((error) => {
          this.loader.close();
          this.dialog.errorReport(this.translate.instant('Error'), error.statusText, error.message);
          return EMPTY;
        }),
        untilDestroyed(this),
      ).subscribe();
    } else {
      this.dialog.warn(this.translate.instant('Please make sure to select a file'), '');
    }
  }

  newMessage(message: string): void {
    if (this.config.message) {
      this.config.message.newMessage(message);
    }
  }
}
