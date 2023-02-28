import {
  Component, ElementRef, Input, ViewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Job } from 'app/interfaces/job.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-error-template',
  templateUrl: './error-template.component.html',
  styleUrls: ['./error-template.component.scss'],
})
export class ErrorTemplateComponent {
  @ViewChild('errorMessageWrapper') errorMessageWrapper: ElementRef;
  @ViewChild('errorTitle') errorTitle: ElementRef;
  @ViewChild('errorMdContent') errorMdContent: ElementRef;
  @ViewChild('errorBtPanel') errorBtPanel: ElementRef;
  @ViewChild('errorBtText') errorBtText: ElementRef;

  @Input() title: string;
  @Input() message: string;
  @Input() backtrace: string;
  isCloseMoreInfo = true;
  @Input() logs: Job;

  constructor(
    private ws: WebSocketService,
    public storage: StorageService,
  ) {}

  toggleOpen(): void {
    const messageWrapper: HTMLElement = this.errorMessageWrapper.nativeElement;
    const content: HTMLElement = this.errorMdContent.nativeElement;
    const btPanel: HTMLElement = this.errorBtPanel.nativeElement;
    const txtarea: HTMLElement = this.errorBtText.nativeElement;

    this.isCloseMoreInfo = !this.isCloseMoreInfo;
    if (!this.isCloseMoreInfo) {
      let errMsgHeight = messageWrapper.offsetHeight - 21;
      if (errMsgHeight > 63) {
        errMsgHeight = 63;
      }
      messageWrapper.setAttribute('style', 'max-height: 63px; overflow: auto');
      btPanel.setAttribute('style', 'width: 750px; height: calc(80vh - 240px)');
    } else {
      content.removeAttribute('style');
      btPanel.removeAttribute('style');
      messageWrapper.removeAttribute('style');
      txtarea.removeAttribute('style');
    }
  }

  downloadLogs(): void {
    this.ws.call('core.download', ['filesystem.get', [this.logs.logs_path], `${this.logs.id}.log`]).pipe(untilDestroyed(this)).subscribe({
      next: ([, url]) => {
        const mimetype = 'text/plain';
        this.storage.streamDownloadFile(url, `${this.logs.id}.log`, mimetype).pipe(untilDestroyed(this)).subscribe({
          next: (file) => {
            this.storage.downloadBlob(file, `${this.logs.id}.log`);
          },
          error: (err) => {
            new EntityUtils().handleWsError(this, err);
          },
        });
      },
      error: (err) => {
        new EntityUtils().handleWsError(this, err);
      },
    });
  }
}
