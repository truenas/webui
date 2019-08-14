import { MatDialog, MatDialogRef } from '@angular/material';
import { Component } from '@angular/core';
import {
  WebSocketService
} from '../../../../services/';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import {environment} from '../../../../../environments/environment';
import { TranslateService } from '@ngx-translate/core';

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
    private loader:AppLoaderService) { }

  ngOnInit() {

  }

  downloadKey() {
    this.loader.open();
    const payload = [this.volumeId];
    if (this.fileName !== undefined) {
      payload.push(this.fileName);
    }
    this.ws.call("pool.download_encryption_key", payload).subscribe((res) => {
      this.loader.close();
      if(res !== null && res !== "") {
        window.open(res);
        this.isDownloaded = true;
      }
    }, (resError)=>{
      this.isDownloaded = true;
      this.loader.close();

    });
  }
}
