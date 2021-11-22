import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ProductType, productTypeLabels } from 'app/enums/product-type.enum';
import { WebSocketService, SystemGeneralService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { LocaleService } from 'app/services/locale.service';

@UntilDestroy()
@Component({
  selector: 'system-failover',
  templateUrl: './failover.component.html',
  styleUrls: ['./failover.component.scss'],
})
export class FailoverComponent implements OnInit {
  productType: ProductType;
  copyrightYear = this.localeService.getCopyrightYearFromBuildTime();

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
    this.sysGeneralService.getProductType$.pipe(untilDestroyed(this)).subscribe((productType) => {
      this.productType = productType as ProductType;
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

    this.dialog.closeAll();
    // TODO: Check if next and error should trade places
    this.ws.call('failover.become_passive').pipe(untilDestroyed(this)).subscribe(
      (res: any) => { // error on reboot
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
        }, 1000);
      },
    );
  }
}
