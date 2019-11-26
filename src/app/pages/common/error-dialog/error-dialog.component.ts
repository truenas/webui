import { MatDialogRef } from '@angular/material';
import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Http } from '@angular/http';

import { WebSocketService } from '../../../services/ws.service';
import { StorageService } from '../../../services/storage.service';
import { EntityUtils } from '../../../pages/common/entity/utils';

@Component({
  selector: 'error-dialog',
  templateUrl: './error-dialog.component.html',
  styleUrls : [ './error-dialog.component.scss' ]
})
export class ErrorDialog {

  public title: string;
  public message: string;
  public backtrace: string;
  public isCloseMoreInfo: Boolean = true;
  public logs;

  constructor(public dialogRef: MatDialogRef < ErrorDialog >, public translate: TranslateService,
    private ws: WebSocketService, public http: Http, public storage: StorageService) {}

  public toggleOpen () {
    const messageWrapper = document.getElementById('err-message-wrapper');
    const dialog = document.getElementsByClassName('mat-dialog-container');
    const title = document.getElementById('err-title');
    const content = document.getElementById('err-md-content');
    const btPanel = document.getElementById('err-bt-panel');
    const txtarea = document.getElementById('err-bt-text');
    
    this.isCloseMoreInfo = !this.isCloseMoreInfo;
    if (!this.isCloseMoreInfo) {
      dialog[dialog.length-1].setAttribute('style','width : 800px; height: 600px');
      let errMsgHeight = (document.getElementById('err-message-wrapper').offsetHeight)-21;
      if (errMsgHeight > 63) {
        errMsgHeight = 63;
      };
      const tracebackHeight = (400-errMsgHeight).toString() + 'px';
      title.setAttribute('style', 'height: 40px; overflow: hidden');
      content.setAttribute('style', 'height: 450px');
      messageWrapper.setAttribute('style', 'max-height: 63px; overflow: auto');
      btPanel.setAttribute('style', 'width: 750px; max-height: 400px');
      btPanel.style.height = tracebackHeight;
      setTimeout(() => {
        txtarea.style.height = tracebackHeight;
      }, 215);
    } else {
      dialog[dialog.length-1].removeAttribute('style');
      title.removeAttribute('style');
      content.removeAttribute('style');
      btPanel.removeAttribute('style');
      messageWrapper.removeAttribute('style');
      txtarea.removeAttribute('style');
    }
  }

  downloadLogs() {
    this.ws.call('core.download', ['filesystem.get', [this.logs.logs_path], this.logs.id + '.log']).subscribe(
      (res) => {
        const url = res[1];
        const mimetype = 'text/plain';
        let failed = false;
        this.storage.streamDownloadFile(this.http, url, this.logs.id + '.log', mimetype).subscribe(file => {
          this.storage.downloadBlob(file, this.logs.id + '.log');
          if (this.dialogRef) {
            this.dialogRef.close();
          };
        }, err => {
          failed = true;
          if (this.dialogRef) {
            this.dialogRef.close();
          }
          new EntityUtils().handleWSError(this, err);
        });
      },
      (err) => {
        new EntityUtils().handleWSError(this, err);
      }
    );
  }
}
