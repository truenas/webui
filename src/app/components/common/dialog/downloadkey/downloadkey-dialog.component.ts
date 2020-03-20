import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Component } from '@angular/core';
import {
  WebSocketService,
  StorageService
} from '../../../../services/';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { EntityJobComponent } from '../../../../../app/pages/common/entity/entity-job';
import { EntityUtils } from '../../../../../app/pages/common/entity/utils';
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
    const mimetype = 'application/octet-stream';
    if (this.new) { // new is ZoL encryption
      const dialogRef = this.dialog.open(EntityJobComponent, {
        data: { title: T('Export Keys'), disableClose: true }
      });
      dialogRef.componentInstance.setCall('pool.dataset.export_keys', [this.volumeId]);
      dialogRef.componentInstance.success.subscribe(res => {
        console.log(res);
        this.storage.streamDownloadFile(this.http, res, this.fileName, mimetype).subscribe(file => {
          if(res !== null && res !== "") {
            this.storage.downloadBlob(file, this.fileName);
            this.isDownloaded = true;
          }
        });
      });
      dialogRef.componentInstance.failure.subscribe(e => { 
        new EntityUtils().handleWSError(this, e, this.dialog),
        dialogRef.close(false);
      });
      dialogRef.componentInstance.submit();

    } else {
      this.loader.open();
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
