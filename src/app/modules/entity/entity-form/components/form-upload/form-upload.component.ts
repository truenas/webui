import {
  HttpClient, HttpRequest, HttpEventType, HttpResponse, HttpErrorResponse,
} from '@angular/common/http';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, tap } from 'rxjs';
import { FormUploadConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services';
import { AuthService } from 'app/services/auth/auth.service';
import { WebSocketService } from 'app/services/ws.service';

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
  private apiEndPoint: string;
  fileList: FileList;
  fbrowser: HTMLInputElement;

  constructor(
    protected ws: WebSocketService,
    protected http: HttpClient,
    private loader: AppLoaderService,
    public dialog: DialogService,
    public translate: TranslateService,
    private snackbar: SnackbarService,
    private authService: AuthService,
  ) {
    this.authService.authToken$.pipe(
      tap((token) => {
        this.apiEndPoint = '/_upload?auth_token=' + token;
      }),
      untilDestroyed(this),
    ).subscribe();
  }

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
      const formData: FormData = new FormData();
      formData.append('data', JSON.stringify({
        method: 'filesystem.put',
        params: [location + '/' + fileBrowser.files[0].name, { mode: '493' }],
      }));
      formData.append('file', fileBrowser.files[0]);
      const req = new HttpRequest('POST', this.apiEndPoint, formData, {
        reportProgress: true,
      });
      this.loader.open();
      this.http.request(req).pipe(untilDestroyed(this)).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            const percentDone = Math.round(100 * event.loaded / event.total);
            this.loader.dialogRef.componentInstance.title = `${percentDone}% Uploaded`;
          } else if (event instanceof HttpResponse && event.statusText === 'OK') {
            this.newMessage(location + '/' + fileBrowser.files[0].name);
            this.loader.close();
            this.snackbar.success(this.translate.instant('File upload complete'));
          }
        },
        error: (error: HttpErrorResponse) => {
          this.loader.close();
          this.dialog.errorReport(this.translate.instant('Error'), error.statusText, error.message);
        },
      });
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
