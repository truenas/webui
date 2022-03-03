import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Job } from 'app/interfaces/job.interface';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService } from 'app/services/ws.service';
import { EntityUtils } from '../../../entity/utils';

@UntilDestroy()
@Component({
  selector: 'error-dialog',
  templateUrl: './error-dialog.component.html',
  styleUrls: ['./error-dialog.component.scss'],
})
export class ErrorDialogComponent {
  title: string;
  message: string;
  backtrace: string;
  isCloseMoreInfo = true;
  logs: Job;

  constructor(
    public dialogRef: MatDialogRef<ErrorDialogComponent>,
    public translate: TranslateService,
    private ws: WebSocketService,
    public http: HttpClient,
    public storage: StorageService,
  ) {}

  toggleOpen(): void {
    const dialogs = document.getElementsByClassName('mat-dialog-container');
    const dialog = dialogs[dialogs.length - 1];
    const messageWrapper: HTMLElement = dialog.querySelector('#err-message-wrapper');
    const title: HTMLElement = dialog.querySelector('#err-title');
    const content: HTMLElement = dialog.querySelector('#err-md-content');
    const btPanel: HTMLElement = dialog.querySelector('#err-bt-panel');
    const txtarea: HTMLElement = dialog.querySelector('#err-bt-text');

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
    this.ws.call('core.download', ['filesystem.get', [this.logs.logs_path], this.logs.id + '.log']).pipe(untilDestroyed(this)).subscribe(
      (res) => {
        const url = res[1];
        const mimetype = 'text/plain';
        this.storage.streamDownloadFile(this.http, url, this.logs.id + '.log', mimetype).pipe(untilDestroyed(this)).subscribe((file) => {
          this.storage.downloadBlob(file, this.logs.id + '.log');
          if (this.dialogRef) {
            this.dialogRef.close();
          }
        }, (err) => {
          if (this.dialogRef) {
            this.dialogRef.close();
          }
          new EntityUtils().handleWsError(this, err);
        });
      },
      (err) => {
        new EntityUtils().handleWsError(this, err);
      },
    );
  }
}
