import { MdDialog, MdDialogRef} from '@angular/material';
import { Component } from '@angular/core';
import {
  WebSocketService
} from '../../../services/';

@Component({
  selector: 'about-dialog',
  styleUrls: ['./about-dialog.component.scss'],
  templateUrl: './about-dialog.component.html'
})
export class AboutModalDialog {

  public info: any = {};

  constructor(
    public dialogRef: MdDialogRef<AboutModalDialog>,
    private ws: WebSocketService) { }

  ngOnInit() {
    this.ws.call('system.info').subscribe((res) => {
      this.info = res;
    });
  }

}
