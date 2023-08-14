import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { Observable, of, switchMap } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { GiB } from 'app/constants/bytes.constant';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { FileTicketFormComponent } from 'app/pages/system/file-ticket/file-ticket-form/file-ticket-form.component';
import {
  FileTicketLicensedFormComponent,
} from 'app/pages/system/file-ticket/file-ticket-licensed-form/file-ticket-licensed-form.component';
import { LicenseComponent } from 'app/pages/system/general-settings/support/license/license.component';
import { LicenseInfoInSupport } from 'app/pages/system/general-settings/support/license-info-in-support.interface';
import { ProactiveComponent } from 'app/pages/system/general-settings/support/proactive/proactive.component';
import {
  SetProductionStatusDialogComponent,
  SetProductionStatusDialogResult,
} from 'app/pages/system/general-settings/support/set-production-status-dialog/set-production-status-dialog.component';
import { SystemInfoInSupport } from 'app/pages/system/general-settings/support/system-info-in-support.interface';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { ProductImageService } from 'app/services/product-image.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-support-card',
  templateUrl: './support-card.component.html',
  styleUrls: ['./support-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportCardComponent implements OnInit {
  isProduction: boolean;
  productImage = 'ix-original-cropped.png';
  isProductImageRack = false;
  extraMargin = true;
  systemInfo: SystemInfoInSupport;
  hasLicense = false;
  licenseInfo: LicenseInfoInSupport = null;
  links = [helptext.docHub, helptext.forums, helptext.licensing];
  ticketText = helptext.ticket;
  proactiveText = helptext.proactive.title;

  get licenseButtonText(): string {
    return this.hasLicense ? helptext.updateTxt : helptext.enterTxt;
  }

  constructor(
    protected ws: WebSocketService,
    private loader: AppLoaderService,
    private dialog: DialogService,
    private matDialog: MatDialog,
    private slideInService: IxSlideInService,
    private store$: Store<AppState>,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private productImageService: ProductImageService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
  ) {}

  ngOnInit(): void {
    this.store$.pipe(waitForSystemInfo, untilDestroyed(this)).subscribe((systemInfo) => {
      this.systemInfo = { ...systemInfo };
      this.systemInfo.memory = (systemInfo.physmem / GiB).toFixed(0) + ' GiB';
      if (systemInfo.system_product.includes('MINI')) {
        const getImage = this.productImageService.getMiniImagePath(systemInfo.system_product);
        if (this.productImageService.isRackmount(systemInfo.system_product)) {
          this.isProductImageRack = true;
          this.extraMargin = true;
        } else {
          this.isProductImageRack = false;
          this.extraMargin = false;
        }
        this.productImage = getImage || 'ix-original-cropped.png';
      } else {
        this.getServerImage(systemInfo.system_product);
      }
      if (systemInfo.license) {
        this.hasLicense = true;
        this.licenseInfo = { ...systemInfo.license };
        this.parseLicenseInfo();
      }
      this.cdr.markForCheck();
    });
    this.ws.call('truenas.is_production')
      .pipe(untilDestroyed(this))
      .subscribe((isProduction) => {
        this.isProduction = isProduction;
        this.cdr.markForCheck();
      });
  }

  parseLicenseInfo(): void {
    if (this.licenseInfo.features.length === 0) {
      this.licenseInfo.featuresString = 'NONE';
    } else {
      this.licenseInfo.featuresString = this.licenseInfo.features.join(', ');
    }
    const expDateConverted = new Date(this.licenseInfo.contract_end.$value);
    this.licenseInfo.expiration_date = this.licenseInfo.contract_end.$value;

    if (this.licenseInfo.addhw_detail.length === 0) {
      this.licenseInfo.add_hardware = 'NONE';
    } else {
      this.licenseInfo.add_hardware = this.licenseInfo.addhw_detail.join(', ');
    }
    const now = new Date(this.systemInfo.datetime.$date);
    const then = expDateConverted;
    this.licenseInfo.daysLeftinContract = this.daysTillExpiration(now, then);
  }

  daysTillExpiration(now: Date, then: Date): number {
    const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
    return Math.round((then.getTime() - now.getTime()) / (oneDay));
  }

  getServerImage(sysProduct: string): void {
    const imagePath = this.productImageService.getServerProduct(sysProduct);

    if (imagePath) {
      this.isProductImageRack = true;
      this.productImage = `/servers/${imagePath}.png`;
    } else {
      this.productImage = 'ix-original-cropped.png';
      this.isProductImageRack = false;
      this.extraMargin = false;
    }
  }

  updateLicense(): void {
    this.slideInService.open(LicenseComponent);
  }

  fileTicket(): void {
    if (this.hasLicense) {
      this.slideInService.open(FileTicketLicensedFormComponent, { wide: true });
    } else {
      this.slideInService.open(FileTicketFormComponent);
    }
  }

  openProactive(): void {
    this.slideInService.open(ProactiveComponent, { wide: true });
  }

  updateProductionStatus(event: MatCheckboxChange): void {
    let request$: Observable<boolean | SetProductionStatusDialogResult> = of(false);
    if (event.checked) {
      request$ = request$.pipe(
        switchMap(() => this.matDialog.open(SetProductionStatusDialogComponent).afterClosed().pipe(
          tap((confirmed) => {
            if (confirmed) {
              return true;
            }
            this.isProduction = false;
            this.cdr.markForCheck();
            return false;
          }),
        )),
        filter(Boolean),
      ) as Observable<boolean>;
    }

    request$.pipe(
      switchMap((result) => {
        const attachDebug = (_.isObject(result) && result.sendInitialDebug) || false;

        return this.ws.job('truenas.set_production', [event.checked, attachDebug]).pipe(this.loader.withLoader());
      }),
      untilDestroyed(this),
    )
      .subscribe({
        complete: () => {
          this.snackbar.success(
            this.translate.instant(helptext.is_production_dialog.message),
          );
        },
        error: (error: WebsocketError) => {
          this.dialog.error(this.errorHandler.parseWsError(error));
        },
      });
  }
}
