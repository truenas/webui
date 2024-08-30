import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
  signal,
} from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash-es';
import { Observable, of, switchMap } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { GiB } from 'app/constants/bytes.constant';
import { oneDayMillis } from 'app/constants/time.constant';
import { Role } from 'app/enums/role.enum';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FeedbackDialogComponent } from 'app/modules/feedback/components/feedback-dialog/feedback-dialog.component';
import { FeedbackType } from 'app/modules/feedback/interfaces/feedback.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { getProductImageSrc } from 'app/pages/dashboard/widgets/system/common/widget-sys-info.utils';
import { LicenseComponent } from 'app/pages/system/general-settings/support/license/license.component';
import { LicenseInfoInSupport } from 'app/pages/system/general-settings/support/license-info-in-support.interface';
import { ProactiveComponent } from 'app/pages/system/general-settings/support/proactive/proactive.component';
import {
  SetProductionStatusDialogComponent,
  SetProductionStatusDialogResult,
} from 'app/pages/system/general-settings/support/set-production-status-dialog/set-production-status-dialog.component';
import { supportCardElements } from 'app/pages/system/general-settings/support/support-card/support-card.elements';
import { SystemInfoInSupport } from 'app/pages/system/general-settings/support/system-info-in-support.interface';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppsState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-support-card',
  templateUrl: './support-card.component.html',
  styleUrls: ['./support-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportCardComponent implements OnInit {
  readonly requiredRoles = [Role.FullAdmin];
  protected readonly searchableElements = supportCardElements;

  isProduction: boolean;
  extraMargin = true;
  systemInfo: SystemInfoInSupport;
  hasLicense = false;
  productImageSrc = signal<string>(null);
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
    private store$: Store<AppsState>,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
  ) {}

  ngOnInit(): void {
    this.store$.pipe(waitForSystemInfo, untilDestroyed(this)).subscribe((systemInfo) => {
      this.systemInfo = { ...systemInfo };
      this.systemInfo.memory = (systemInfo.physmem / GiB).toFixed(0) + ' GiB';

      this.setupProductImage(systemInfo);

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

  private setupProductImage(systemInfo: SystemInfo): void {
    const productImageUrl = getProductImageSrc(systemInfo.system_product, true);
    this.productImageSrc.set(productImageUrl);
    this.extraMargin = !productImageUrl.includes('ix-original');
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
    return Math.round((then.getTime() - now.getTime()) / (oneDayMillis));
  }

  updateLicense(): void {
    this.slideInService.open(LicenseComponent);
  }

  feedbackDialog(): void {
    this.matDialog.open(FeedbackDialogComponent, { data: FeedbackType.Bug });
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
        error: (error: unknown) => {
          this.dialog.error(this.errorHandler.parseError(error));
        },
      });
  }
}
