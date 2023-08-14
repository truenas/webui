import { HttpErrorResponse } from '@angular/common/http';
import {
  Component, ElementRef, Input, ViewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-error-template',
  templateUrl: './error-template.component.html',
  styleUrls: ['./error-template.component.scss'],
})
export class ErrorTemplateComponent {
  @ViewChild('errorMessageWrapper') errorMessageWrapper: ElementRef<HTMLElement>;
  @ViewChild('errorTitle') errorTitle: ElementRef<HTMLElement>;
  @ViewChild('errorMdContent') errorMdContent: ElementRef<HTMLElement>;
  @ViewChild('errorBtPanel') errorBtPanel: ElementRef<HTMLElement>;
  @ViewChild('errorBtText') errorBtText: ElementRef<HTMLElement>;

  @Input() title: string;
  @Input() message: string;
  @Input() backtrace: string;
  isCloseMoreInfo = true;
  @Input() logs: Job;

  constructor(
    private ws: WebSocketService,
    public storage: StorageService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
  ) {}

  toggleOpen(): void {
    const messageWrapper = this.errorMessageWrapper.nativeElement;
    const content = this.errorMdContent.nativeElement;
    const btPanel = this.errorBtPanel.nativeElement;
    const txtarea = this.errorBtText.nativeElement;

    this.isCloseMoreInfo = !this.isCloseMoreInfo;
    if (!this.isCloseMoreInfo) {
      let errMsgHeight = messageWrapper.offsetHeight - 21;
      if (errMsgHeight > 63) {
        errMsgHeight = 63;
      }
      messageWrapper.setAttribute('style', 'max-height: 63px; overflow: auto');
      btPanel.setAttribute('style', 'width: 750px; max-height: calc(80vh - 240px)');
    } else {
      content.removeAttribute('style');
      btPanel.removeAttribute('style');
      messageWrapper.removeAttribute('style');
      txtarea.removeAttribute('style');
    }
  }

  downloadLogs(): void {
    this.ws.call('core.download', ['filesystem.get', [this.logs.logs_path], `${this.logs.id}.log`])
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe(([, url]) => {
        const mimetype = 'text/plain';
        this.storage.streamDownloadFile(url, `${this.logs.id}.log`, mimetype).pipe(untilDestroyed(this)).subscribe({
          next: (file) => {
            this.storage.downloadBlob(file, `${this.logs.id}.log`);
          },
          error: (error: HttpErrorResponse) => {
            this.dialogService.error(this.errorHandler.parseHttpError(error));
          },
        });
      });
  }
}
