import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Job } from 'app/interfaces/job.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService2 } from 'app/services/ws2.service';

@UntilDestroy()
@Component({
  selector: 'ix-error-dialog',
  templateUrl: './error-dialog.component.html',
  styleUrls: ['./error-dialog.component.scss'],
})
export class ErrorDialogComponent {
  @ViewChild('errorMessageWrapper') errorMessageWrapper: ElementRef;
  @ViewChild('errorTitle') errorTitle: ElementRef;
  @ViewChild('errorMdContent') errorMdContent: ElementRef;
  @ViewChild('errorBtPanel') errorBtPanel: ElementRef;
  @ViewChild('errorBtText') errorBtText: ElementRef;

  title: string;
  message: string;
  backtrace: string;
  isCloseMoreInfo = true;
  logs: Job;

  constructor(
    public dialogRef: MatDialogRef<ErrorDialogComponent>,
    private ws: WebSocketService2,
    public storage: StorageService,
  ) {}

  toggleOpen(): void {
    const dialogs = document.getElementsByClassName('mat-dialog-container');
    const dialog = dialogs[dialogs.length - 1];
    const messageWrapper: HTMLElement = this.errorMessageWrapper.nativeElement;
    const title: HTMLElement = this.errorTitle.nativeElement;
    const content: HTMLElement = this.errorMdContent.nativeElement;
    const btPanel: HTMLElement = this.errorBtPanel.nativeElement;
    const txtarea: HTMLElement = this.errorBtText.nativeElement;

    this.isCloseMoreInfo = !this.isCloseMoreInfo;
    if (!this.isCloseMoreInfo) {
      dialog.setAttribute('style', 'width : 800px; max-height: 80vh;');
      let errMsgHeight = messageWrapper.offsetHeight - 21;
      if (errMsgHeight > 63) {
        errMsgHeight = 63;
      }
      title.setAttribute('style', 'height: 40px; overflow: hidden');
      messageWrapper.setAttribute('style', 'max-height: 63px; overflow: auto');
      btPanel.setAttribute('style', 'width: 750px; height: calc(80vh - 240px)');
    } else {
      dialog.removeAttribute('style');
      title.removeAttribute('style');
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
            if (this.dialogRef) {
              this.dialogRef.close();
            }
          },
          error: (err) => {
            if (this.dialogRef) {
              this.dialogRef.close();
            }
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
