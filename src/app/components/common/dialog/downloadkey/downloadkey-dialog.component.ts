import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Component } from '@angular/core';
import {
  WebSocketService,
  StorageService
} from '../../../../services/';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { EntityUtils } from '../../../../../app/pages/common/entity/utils';
import helptext from '../../../../helptext/storage/volumes/download-key';
import { T } from '../../../../translate-marker';

@Component({
  selector: 'downloadkey-dialog',
  styleUrls: ['./downloadkey-dialog.component.scss'],
  templateUrl: './downloadkey-dialog.component.html'
})
export class DownloadKeyModalDialog {

  public new = false;
  public volumeId: any;
  public volumeName: any;
  public fileName: any;
  public isDownloaded: Boolean = false;
  public help = helptext;

  constructor(
    protected translate: TranslateService,
    public dialogRef: MatDialogRef<DownloadKeyModalDialog>,
    private ws: WebSocketService,
    private storage: StorageService,
    private http: HttpClient,
    public dialog: MatDialog,
    private loader:AppLoaderService) { }

  downloadKey() {
    const payload = [this.volumeId];
    if (this.fileName !== undefined) {
      payload.push(this.fileName);
    }
    let mimetype;
    this.loader.open();
    if (this.new) { // new is ZoL encryption
      mimetype = 'application/json';
      this.ws.call('core.download', ['pool.dataset.export_keys', [this.volumeName], this.fileName]).subscribe(res => {
        this.loader.close();
        const url = res[1];
        this.storage.streamDownloadFile(this.http, url, this.fileName, mimetype).subscribe(file => {
          if(res !== null && res !== "") {
            this.storage.downloadBlob(file, this.fileName);
            this.isDownloaded = true;
          }
        });
      }, (e) => {
        this.loader.close();
        new EntityUtils().handleWSError(this, e, this.dialog);
      });

    } else {
      mimetype = 'application/octet-stream';
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
}
