import { MatDialog, MatDialogRef} from '@angular/material';
import { Component } from '@angular/core';
import * as _ from 'lodash';
import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../../../services/';

@Component({
  selector: 'about-dialog',
  styleUrls: ['./about-dialog.component.css'],
  templateUrl: './about-dialog.component.html',
  providers: [SystemGeneralService]
})
export class AboutModalDialog {

  public info: any = {};
  public ipAddress: any = [];

  constructor(
    public dialogRef: MatDialogRef<AboutModalDialog>,
    private ws: WebSocketService,
    protected systemGeneralService: SystemGeneralService) { }

  ngOnInit() {
    this.ws.call('system.info').subscribe((res) => {
      this.info = res;
      this.info.loadavg =
        this.info.loadavg.map((x, i) => {return x.toFixed(2);}).join(' ');
      this.info.physmem =
        Number(this.info.physmem / 1024 / 1024).toFixed(0) + ' MiB';
    });
    this.systemGeneralService.getIPChoices().subscribe((res) => {
      if (res.length > 0) {
        this.ipAddress = _.uniq(res[0]);
      } else {
        this.ipAddress = res;
      }
    });
  }

}
