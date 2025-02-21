import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { isObject } from 'lodash-es';
import { Observable, of, switchMap } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { GiB } from 'app/constants/bytes.constant';
import { oneDayMillis } from 'app/constants/time.constant';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { FeedbackDialogComponent } from 'app/modules/feedback/components/feedback-dialog/feedback-dialog.component';
import { FeedbackType } from 'app/modules/feedback/interfaces/feedback.interface';
import {
  IxSlideToggleComponent,
} from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { getProductImageSrc } from 'app/pages/dashboard/widgets/system/common/widget-sys-info.utils';
import { LicenseComponent } from 'app/pages/system/general-settings/support/license/license.component';
import { LicenseInfoInSupport } from 'app/pages/system/general-settings/support/license-info-in-support.interface';
import { ProactiveComponent } from 'app/pages/system/general-settings/support/proactive/proactive.component';
import {
  SetProductionStatusDialogComponent,
  SetProductionStatusDialogResult,
} from 'app/pages/system/general-settings/support/set-production-status-dialog/set-production-status-dialog.component';
import { supportCardElements } from 'app/pages/system/general-settings/support/support-card/support-card.elements';
import { SysInfoComponent } from 'app/pages/system/general-settings/support/sys-info/sys-info.component';
import { SystemInfoInSupport } from 'app/pages/system/general-settings/support/system-info-in-support.interface';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { AppState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-support-card',
  templateUrl: './support-card.component.html',
  styleUrls: ['./support-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    UiSearchDirective,
    MatToolbarRow,
    MatCardContent,
    SysInfoComponent,
    RequiresRolesDirective,
    TestDirective,
    ReactiveFormsModule,
    FormsModule,
    MatButton,
    MatMenuTrigger,
    IxIconComponent,
    MatMenu,
    MatMenuItem,
    TranslateModule,
    IxSlideToggleComponent,
  ],
})
export class SupportCardComponent implements OnInit {
  protected readonly requiredRoles = [Role.FullAdmin];
  protected readonly Role = Role;
  protected readonly searchableElements = supportCardElements;

  extraMargin = true;
  systemInfo: SystemInfoInSupport;
  hasLicense = false;
  productImageSrc = signal<string | null>(null);
  licenseInfo: LicenseInfoInSupport | null = null;
  links = [helptext.docHub, helptext.forums, helptext.licensing];
  ticketText = helptext.ticket;
  proactiveText = helptext.proactive.title;

  protected readonly isProductionControl = new FormControl(false, { nonNullable: true });

  get licenseButtonText(): string {
    return this.hasLicense ? helptext.updateTxt : helptext.enterTxt;
  }

  constructor(
    protected api: ApiService,
    private loader: AppLoaderService,
    private matDialog: MatDialog,
    private slideIn: SlideIn,
    private store$: Store<AppState>,
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
        this.parseLicenseInfo(this.licenseInfo);
      }
      this.cdr.markForCheck();
    });

    this.loadProductionStatus();
    this.saveProductionStatusOnChange();
  }

  private setupProductImage(systemInfo: SystemInfo): void {
    const productImageUrl = getProductImageSrc(systemInfo.system_product, true);
    this.productImageSrc.set(productImageUrl);
    this.extraMargin = !productImageUrl?.includes('ix-original');
  }

  parseLicenseInfo(licenseInfo: LicenseInfoInSupport): void {
    if (licenseInfo.features.length === 0) {
      licenseInfo.featuresString = 'NONE';
    } else {
      licenseInfo.featuresString = licenseInfo.features.join(', ');
    }
    const expDateConverted = new Date(licenseInfo.contract_end.$value);
    licenseInfo.expiration_date = licenseInfo.contract_end.$value;

    if (licenseInfo.addhw_detail.length === 0) {
      licenseInfo.add_hardware = 'NONE';
    } else {
      licenseInfo.add_hardware = licenseInfo.addhw_detail.join(', ');
    }
    const now = new Date(this.systemInfo.datetime.$date);
    const then = expDateConverted;
    licenseInfo.daysLeftinContract = this.daysTillExpiration(now, then);
  }

  daysTillExpiration(now: Date, then: Date): number {
    return Math.round((then.getTime() - now.getTime()) / oneDayMillis);
  }

  updateLicense(): void {
    this.slideIn.open(LicenseComponent);
  }

  feedbackDialog(): void {
    this.matDialog.open(FeedbackDialogComponent, { data: FeedbackType.Bug });
  }

  openProactive(): void {
    this.slideIn.open(ProactiveComponent, { wide: true });
  }

  updateProductionStatus(newStatus: boolean): void {
    let request$: Observable<boolean | SetProductionStatusDialogResult>;
    if (newStatus) {
      request$ = this.matDialog.open(SetProductionStatusDialogComponent).afterClosed().pipe(
        filter((result: SetProductionStatusDialogResult | false) => {
          if (result) {
            return true;
          }
          this.isProductionControl.setValue(false, { emitEvent: false });
          this.cdr.markForCheck();
          return false;
        }),
      );
    } else {
      request$ = of(false);
    }

    request$.pipe(
      switchMap((result) => {
        const attachDebug = (isObject(result) && result.sendInitialDebug) || false;

        return this.api.job('truenas.set_production', [newStatus, attachDebug]).pipe(
          this.loader.withLoader(),
          this.errorHandler.catchError(),
          tap({
            complete: () => {
              this.snackbar.success(
                this.translate.instant(helptext.is_production_dialog.message),
              );
            },
          }),
        );
      }),
      untilDestroyed(this),
    )
      .subscribe();
  }

  private loadProductionStatus(): void {
    this.api.call('truenas.is_production')
      .pipe(untilDestroyed(this))
      .subscribe((isProduction) => {
        this.isProductionControl.setValue(isProduction, { emitEvent: false });
        this.cdr.markForCheck();
      });
  }

  private saveProductionStatusOnChange(): void {
    this.isProductionControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((newStatus) => this.updateProductionStatus(newStatus));
  }
}
