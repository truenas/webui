import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog/dialog-ref';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ProductType } from 'app/enums/product-type.enum';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { WebSocketService, SystemGeneralService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { LocaleService } from 'app/services/locale.service';

@UntilDestroy()
@Component({
  selector: 'app-config-reset',
  templateUrl: './config-reset.component.html',
  styleUrls: ['./config-reset.component.scss'],
  providers: [],
})
export class ConfigResetComponent implements OnInit {
  product_type: ProductType;
  copyrightYear = this.localeService.getCopyrightYearFromBuildTime();
  dialogRef: MatDialogRef<EntityJobComponent>;

  readonly ProductType = ProductType;

  constructor(protected ws: WebSocketService, protected router: Router,
    protected loader: AppLoaderService, public translate: TranslateService,
    protected dialogService: DialogService, protected dialog: MatDialog,
    private sysGeneralService: SystemGeneralService, private localeService: LocaleService) {
    this.ws = ws;
    this.sysGeneralService.getProductType$.pipe(untilDestroyed(this)).subscribe((res) => {
      this.product_type = res as ProductType;
    });
  }

  isWSConnected(): void {
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

  ngOnInit(): void {
    this.product_type = window.localStorage.getItem('product_type') as ProductType;

    this.dialog.closeAll();
    this.resetConfigSubmit();
  }

  resetConfigSubmit(): void {
    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { title: this.translate.instant('Resetting. Please wait...') }, disableClose: true });
    this.dialogRef.componentInstance.setCall('config.reset', [{ reboot: true }]);
    this.dialogRef.componentInstance.setDescription(this.translate.instant('Resetting system configuration to default settings. The system will restart.'));
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialogRef.close();
      this.ws.prepareShutdown();
      this.loader.open();
      setTimeout(() => {
        this.isWSConnected();
      }, 15000);
    });
    this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res) => {
      this.dialogRef.close();
      this.dialogService.errorReport(res.error, res.state, res.exception);
    });
  }
}
