import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DialogService } from '../../../../services/dialog.service';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import globalHelptext from '../../../../helptext/global-helptext';
import { T } from '../../../../translate-marker';
import { StorageService, SystemGeneralService, WebSocketService, AppLoaderService } from '../../../../services/';

@Component({
  selector: 'about-dialog',
  styleUrls: ['./about-dialog.component.css'],
  templateUrl: './about-dialog.component.html',
  providers: [SystemGeneralService]
})
export class AboutModalDialog {
  public copyrightYear = globalHelptext.copyright_year;
  public info: any = {};
  public product_type: string;
  public ipv4Choices = [];
  public ipv6Choices = [];

  constructor(
    public dialogRef: MatDialogRef<AboutModalDialog>,
    private ws: WebSocketService,
    protected loader: AppLoaderService,
    protected http: HttpClient, protected dialogService: DialogService, 
    protected translate: TranslateService,
    protected systemGeneralService: SystemGeneralService, private storageService: StorageService) { 
      this.ws.call('system.product_type').subscribe((res)=>{
        this.product_type = res;
      });
      this.ws.call('system.info').subscribe((res) => {
        this.info = res;
        this.info.loadavg = this.info.loadavg.map((x) => {return x.toFixed(2);}).join(' ');
        this.info.physmem = this.storageService.convertBytestoHumanReadable(this.info.physmem, 0);
      });
      this.systemGeneralService.ipChoicesv4().subscribe(choices => this.ipv4Choices = choices);
      this.systemGeneralService.ipChoicesv6().subscribe(choices => this.ipv6Choices = choices);
    }

    showLicenses() {
      this.loader.open();
      this.http.get('assets/disclaimer.txt', {responseType: 'text'}).subscribe(licenses => {
        this.loader.close();
        this.dialogService.confirm(T("View Licenses"), licenses, true, T("Ok"), false, null, '', null, null, true).subscribe(ok => {
        });
      });
    }
}
