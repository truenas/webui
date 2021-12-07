import {
  HttpClient, HttpRequest, HttpEventType, HttpResponse,
} from '@angular/common/http';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input,
} from '@angular/core';
import {
  ControlValueAccessor, NgControl, FormControl,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { WebSocketService, DialogService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';

@UntilDestroy()
@Component({
  selector: 'ix-file-input',
  templateUrl: './ix-file-input.component.html',
  styleUrls: ['./ix-file-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxFileInputComponent implements ControlValueAccessor {
  @Input() label: string;
  @Input() tooltip: string;
  @Input() fileLocation: string;
  @Input() acceptedFiles = '*.*';
  @Input() multiple: boolean;
  @Input() required: boolean;
  @Input() hideButton: boolean;
  @Input() updater: (value: FileList) => void;

  value: FileList;

  apiEndPoint = '/_upload?auth_token=' + this.ws.token;
  isDisabled = false;

  formControl = new FormControl(this).value as FormControl;

  onChange: (value: FileList) => void = (): void => {};
  onTouch: () => void = (): void => {};

  constructor(
    protected ws: WebSocketService,
    protected http: HttpClient,
    private loader: AppLoaderService,
    public dialog: DialogService,
    public translate: TranslateService,
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  upload(location = '/tmp/'): void {
    if (this.updater) {
      this.updater(this.value);
      return;
    }

    if (this.value && this.value[0]) {
      const formData: FormData = new FormData();
      formData.append('data', JSON.stringify({
        method: 'filesystem.put',
        params: [location + '/' + this.value[0].name, { mode: '493' }],
      }));
      if (this.multiple) {
        for (const file of this.value) {
          formData.append('file', file);
        }
      } else {
        formData.append('file', this.value[0]);
      }
      const req = new HttpRequest('POST', this.apiEndPoint, formData, {
        reportProgress: true,
      });
      this.loader.open();
      this.http.request(req).pipe(untilDestroyed(this)).subscribe((event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const percentDone = Math.round(100 * event.loaded / event.total);
          const uploadMsg = `${percentDone}% ${this.translate.instant('Uploaded')}`;
          this.loader.dialogRef.componentInstance.title = uploadMsg;
        } else if (event instanceof HttpResponse) {
          if (event.statusText === 'OK') {
            this.loader.close();
            this.dialog.info(this.translate.instant('File upload complete'), '', '300px', 'info', true);
          }
        }
      }, (error) => {
        this.loader.close();
        this.dialog.errorReport(this.translate.instant('Error'), error.statusText, error.message);
      });
    } else {
      this.dialog.info(this.translate.instant('Please make sure to select a file'), '', '300px', 'info', true);
    }
  }

  onChanged(value: any): void {
    this.value = value;
    this.cdr.markForCheck();

    if (this.hideButton) {
      this.upload(this.fileLocation);
    }
  }

  writeValue(value: FileList): void {
    this.value = value;
    this.cdr.markForCheck();
  }

  registerOnChange(onChange: (value: FileList) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }
}
