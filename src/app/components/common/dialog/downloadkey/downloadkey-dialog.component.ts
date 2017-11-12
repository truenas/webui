import { MdDialog, MdDialogRef} from '@angular/material';
import { Component } from '@angular/core';
import {
  WebSocketService
} from '../../../../services/';

@Component({
  selector: 'downloadkey-dialog',
  styleUrls: ['./downloadkey-dialog.component.scss'],
  templateUrl: './downloadkey-dialog.component.html'
})
export class DownloadKeyModalDialog {

  public volumeId: any;
  public isDownloaded: Boolean = false;

  constructor(
    public dialogRef: MdDialogRef<DownloadKeyModalDialog>,
    private ws: WebSocketService) { }

  ngOnInit() {
    
  }

  downloadKey() {
    this.ws.call("pool.download_encryption_key", [this.volumeId]).subscribe((res) => {
      console.log("-----res: ", res);
    });
  }
}
