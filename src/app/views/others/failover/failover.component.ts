import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { WebSocketService, SystemGeneralService } from '../../../services';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { TranslateService } from '@ngx-translate/core';
import { DialogService } from '../../../services/dialog.service';
import { MatDialog } from '@angular/material/dialog';
import globalHelptext from '../../../helptext/global-helptext';

@Component({
  selector: 'system-failover',
  templateUrl: './failover.component.html',
  styleUrls: ['./failover.component.css']
})
export class FailoverComponent implements OnInit {

  public product_type: string;
  public copyrightYear = globalHelptext.copyright_year;
  private getProdType: Subscription;

  constructor(protected ws: WebSocketService, protected router: Router, 
    protected loader: AppLoaderService, public translate: TranslateService,
    protected dialogService: DialogService, protected dialog: MatDialog,
    private sysGeneralService: SystemGeneralService) {
      this.ws = ws;
      this.getProdType = this.sysGeneralService.getProductType.subscribe((res)=>{
        this.product_type = res;
        this.getProdType.unsubscribe();
      });
  }

  isWSConnected() {
    if (this.ws.connected) {
      this.loader.close();
      // ws is connected
      this.router.navigate(['/session/signin']);
    } else {
      setTimeout(() => {
        this.isWSConnected();
      }, 5000);
    }
  }

  ngOnInit() {
    this.product_type = window.localStorage.getItem('product_type');

    this.dialog.closeAll();
    this.ws.call('failover.force_master', {}).subscribe(
      (res) => {
      },
      (res) => { // error on reboot
        this.dialogService.errorReport(res.error, res.reason, res.trace.formatted).subscribe(closed => {
          this.router.navigate(['/session/signin']);
        });
      },
      () => { // show reboot screen
        this.ws.prepare_shutdown();
        this.loader.open();
        setTimeout(() => {
          this.isWSConnected();
        }, 1000);
      });
  }
}
