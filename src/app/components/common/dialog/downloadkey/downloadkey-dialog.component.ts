import { MatDialog, MatDialogRef } from '@angular/material';
import { Component } from '@angular/core';
import {
  WebSocketService
} from '../../../../services/';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import {environment} from '../../../../../environments/environment';

@Component({
  selector: 'downloadkey-dialog',
  styleUrls: ['./downloadkey-dialog.component.scss'],
  templateUrl: './downloadkey-dialog.component.html'
})
export class DownloadKeyModalDialog {

  public volumeId: any;
  public isDownloaded: Boolean = false;

  constructor(
    public dialogRef: MatDialogRef<DownloadKeyModalDialog>,
    private ws: WebSocketService,
    private loader:AppLoaderService) { }

  ngOnInit() {
    
  }

  downloadKey() {
    this.loader.open();
    this.ws.call("pool.download_encryption_key", [this.volumeId]).subscribe((res) => {
      this.loader.close();
      if(res !== null && res !== "") {
        window.open("http://" + environment.remote + res);
        this.isDownloaded = true;
      }
    });
  }
}
