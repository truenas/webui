import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import globalHelptext from '../../../../helptext/global-helptext';
import { StorageService, SystemGeneralService, WebSocketService } from '../../../../services/';

@Component({
  selector: 'about-dialog',
  styleUrls: ['./about-dialog.component.css'],
  templateUrl: './about-dialog.component.html',
  providers: [SystemGeneralService]
})
export class AboutModalDialog {
  public copyrightYear = globalHelptext.copyright_year;
  public info: any = {};
  public is_freenas: false;
  public ipv4Choices = [];
  public ipv6Choices = [];

  constructor(
    public dialogRef: MatDialogRef<AboutModalDialog>,
    private ws: WebSocketService,
    protected translate: TranslateService,
    protected systemGeneralService: SystemGeneralService, private storageService: StorageService) { 
      this.ws.call('system.is_freenas').subscribe((res)=>{
        this.is_freenas = res;
      });
      this.ws.call('system.info').subscribe((res) => {
        this.info = res;
        this.info.loadavg = this.info.loadavg.map((x) => {return x.toFixed(2);}).join(' ');
        this.info.physmem = this.storageService.convertBytestoHumanReadable(this.info.physmem, 0);
      });
      this.systemGeneralService.ipChoicesv4().subscribe(choices => this.ipv4Choices = choices);
      this.systemGeneralService.ipChoicesv6().subscribe(choices => this.ipv6Choices = choices);
    }
}
