import {
  HttpClient, HttpRequest, HttpEventType, HttpResponse,
} from '@angular/common/http';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild, ElementRef, Input,
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
  selector: 'ix-file-upload',
  templateUrl: './ix-file-upload.component.html',
  styleUrls: ['./ix-file-upload.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxFileUploadComponent implements ControlValueAccessor {
  @ViewChild('fileInput', { static: false }) fileInput: ElementRef<HTMLInputElement>;
  @Input() label?: string;
  @Input() tooltip?: string;
  @Input() fileLocation?: string;
  @Input() acceptedFiles?: string;
  @Input() multiple?: boolean;
  @Input() required?: boolean;
  @Input() hideButton?: boolean;

  fileList: FileList;
  fbrowser: HTMLInputElement;

  apiEndPoint = '/_upload?auth_token=' + this.ws.token;
  isDisabled = true;

  formControl = new FormControl(this).value as FormControl;

  onChange: (value: FileList | null) => void = (): void => {};
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

  fileBtnClick(): void {
    this.fileInput.nativeElement.click();
    this.fbrowser = document.getElementById('fb') as HTMLInputElement;
    this.fbrowser.onchange = () => {
      this.fileList = this.fileInput.nativeElement.files;
      this.cdr.markForCheck();
    };
  }

  upload(location = '/tmp/'): void {
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

  writeValue(value: FileList | null): void {
    this.fileList = value;
    this.cdr.markForCheck();
  }

  registerOnChange(onChange: (value: FileList | null) => void): void {
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
