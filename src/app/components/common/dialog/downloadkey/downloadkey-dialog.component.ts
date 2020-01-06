import { MatDialogRef } from '@angular/material';
import { Component } from '@angular/core';
import {
  WebSocketService,
  StorageService
} from '../../../../services/';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { TranslateService } from '@ngx-translate/core';
import { Http } from '@angular/http';

@Component({
  selector: 'downloadkey-dialog',
  styleUrls: ['./downloadkey-dialog.component.scss'],
  templateUrl: './downloadkey-dialog.component.html'
})
export class DownloadKeyModalDialog {

  public volumeId: any;
  public fileName: any;
  public isDownloaded: Boolean = false;

  constructor(
    protected translate: TranslateService,
    public dialogRef: MatDialogRef<DownloadKeyModalDialog>,
    private ws: WebSocketService,
    private storage: StorageService,
    private http: Http,
    private loader:AppLoaderService) { }

  downloadKey() {
    this.loader.open();
    const payload = [this.volumeId];
    if (this.fileName !== undefined) {
      payload.push(this.fileName);
    }
    const mimetype = 'application/octet-stream';
    this.ws.call("pool.download_encryption_key", payload).subscribe((res) => {
      this.loader.close();
      this.storage.streamDownloadFile(this.http, res, this.fileName, mimetype).subscribe(file => {
        if(res !== null && res !== "") {
          this.storage.downloadBlob(file, this.fileName);
          this.isDownloaded = true;
        }
      });
    }, (resError)=>{
      this.isDownloaded = true;
      this.loader.close();

    });
  }
}
