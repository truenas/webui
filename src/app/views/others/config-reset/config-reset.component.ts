import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ProductType, productTypeLabels } from 'app/enums/product-type.enum';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { WebSocketService, SystemGeneralService } from 'app/services';
import { DialogService } from 'app/services/dialog.service';
import { LocaleService } from 'app/services/locale.service';

@UntilDestroy()
@Component({
  templateUrl: './config-reset.component.html',
  styleUrls: ['./config-reset.component.scss'],
})
export class ConfigResetComponent implements OnInit {
  productType: ProductType;
  copyrightYear = this.localeService.getCopyrightYearFromBuildTime();
  dialogRef: MatDialogRef<EntityJobComponent>;

  readonly ProductType = ProductType;
  readonly productTypeLabels = productTypeLabels;

  constructor(
    protected ws: WebSocketService,
    protected router: Router,
    protected loader: AppLoaderService,
    public translate: TranslateService,
    protected dialogService: DialogService,
    protected dialog: MatDialog,
    private sysGeneralService: SystemGeneralService,
    private localeService: LocaleService,
    private location: Location,
  ) {
    this.sysGeneralService.getProductType$.pipe(untilDestroyed(this)).subscribe((productType) => {
      this.productType = productType;
    });
  }

  isWsConnected(): void {
    if (this.ws.connected) {
      this.loader.close();
      // ws is connected
      this.router.navigate(['/session/signin']);
    } else {
      setTimeout(() => {
        this.isWsConnected();
      }, 1000);
    }
  }

  ngOnInit(): void {
    // Replace URL so that we don't reset config again if page is refreshed.
    this.location.replaceState('/session/signin');

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
        this.isWsConnected();
      }, 15000);
    });
    this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((failedJob) => {
      this.dialogRef.close();
      this.dialogService.errorReport(failedJob.error, failedJob.state, failedJob.exception);
    });
  }
}
