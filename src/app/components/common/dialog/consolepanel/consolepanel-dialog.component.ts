import { MdDialog, MdDialogRef} from '@angular/material';
import { Component } from '@angular/core';
import {
  WebSocketService
} from '../../../../services/';

@Component({
  selector: 'consolepanel-dialog',
  styleUrls: ['./consolepanel-dialog.component.scss'],
  templateUrl: './consolepanel-dialog.component.html'
})
export class ConsolePanelModalDialog {

  public info: any = {};

  constructor(
    public dialogRef: MdDialogRef<ConsolePanelModalDialog>,
    private ws: WebSocketService) { }

  ngOnInit() {
    this.ws.call('system.info').subscribe((res) => {
      this.info = res;
    });
  }

  onStopRefresh(data) {
    
  }

}
