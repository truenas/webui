import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { WebSocketService, SystemGeneralService } from '../../../services';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { TranslateService } from '@ngx-translate/core';
import { DialogService } from '../../../services/dialog.service';
import { MatDialog } from '@angular/material/dialog';
import globalHelptext from '../../../helptext/global-helptext';
import { EntityJobComponent } from '../../../../app/pages/common/entity/entity-job/entity-job.component';
import { T } from '../../../translate-marker';
import { LocaleService } from 'app/services/locale.service';

@Component({
  selector: 'app-config-reset',
  templateUrl: './config-reset.component.html',
  styleUrls: ['./config-reset.component.css'],
  providers: []
})
export class ConfigResetComponent implements OnInit {

  public product_type: string;
  public copyrightYear = this.localeService.getCopyrightYearFromBuildTime();
  public dialogRef: any;
  private getProdType: Subscription;

  constructor(protected ws: WebSocketService, protected router: Router,
    protected loader: AppLoaderService, public translate: TranslateService,
    protected dialogService: DialogService, protected dialog: MatDialog,
    private sysGeneralService: SystemGeneralService, private localeService: LocaleService) {
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
      }, 1000);
    }
  }

  ngOnInit() {
    this.product_type = window.localStorage.getItem('product_type');

    this.dialog.closeAll();
    this.resetConfigSubmit();
  }

  resetConfigSubmit() {
    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": "Resetting. Please wait..." }, disableClose: true });
    this.dialogRef.componentInstance.setCall('config.reset', [{ reboot: true}]);
    this.dialogRef.componentInstance.setDescription(T('Resetting system configuration to default settings. The system will restart.'));
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe(() => {
      this.dialogRef.close();
      this.ws.prepare_shutdown();
      this.loader.open();
      setTimeout(() => {
        this.isWSConnected();
      }, 15000);
    });
    this.dialogRef.componentInstance.failure.subscribe((res) => {
      this.dialogRef.close();
      this.dialogService.errorReport(res.error, res.state, res.exception);
    });
  }

}
