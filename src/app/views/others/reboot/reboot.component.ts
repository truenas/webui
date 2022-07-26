import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ProductType, productTypeLabels } from 'app/enums/product-type.enum';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { WebSocketService, SystemGeneralService } from 'app/services';
import { DialogService } from 'app/services/dialog.service';
import { LocaleService } from 'app/services/locale.service';

@UntilDestroy()
@Component({
  templateUrl: './reboot.component.html',
  styleUrls: ['./reboot.component.scss'],
})
export class RebootComponent implements OnInit {
  productType: ProductType;
  copyrightYear = this.localeService.getCopyrightYearFromBuildTime();

  readonly ProductType = ProductType;
  readonly productTypeLabels = productTypeLabels;

  constructor(
    protected ws: WebSocketService,
    protected router: Router,
    protected loader: AppLoaderService,
    protected dialogService: DialogService,
    protected dialog: MatDialog,
    private sysGeneralService: SystemGeneralService,
    private localeService: LocaleService,
    private location: Location,
  ) {
    this.sysGeneralService.getProductType$.pipe(untilDestroyed(this)).subscribe((res) => {
      this.productType = res;
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
      }, 5000);
    }
  }

  ngOnInit(): void {
    this.productType = window.localStorage.getItem('product_type') as ProductType;

    // Replace URL so that we don't reboot again if page is refreshed.
    this.location.replaceState('/session/signin');

    // Replace URL so that we don't reboot again if page is refreshed.
    this.location.replaceState('/session/signin');

    this.dialog.closeAll();
    this.ws.call('system.reboot').pipe(untilDestroyed(this)).subscribe(
      () => {
      },
      (res) => { // error on reboot
        this.dialogService.errorReport(res.error, res.reason, res.trace.formatted)
          .pipe(untilDestroyed(this))
          .subscribe(() => {
            this.router.navigate(['/session/signin']);
          });
      },
      () => { // show reboot screen
        this.ws.prepareShutdown();
        this.loader.open();
        setTimeout(() => {
          this.isWsConnected();
        }, 3000);
      },
    );
  }
}
