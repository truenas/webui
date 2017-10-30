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

  public info: any = {};
  public isDownloaded: Boolean = false;

  constructor(
    public dialogRef: MdDialogRef<DownloadKeyModalDialog>,
    private ws: WebSocketService) { }

  ngOnInit() {
    
  }

}
