import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, signal, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatToolbarRow } from '@angular/material/toolbar';
import { MatTooltip } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable, of, switchMap } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { GiB } from 'app/constants/bytes.constant';
import { oneDayMillis } from 'app/constants/time.constant';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { LicenseFeature, getLabelForLicenseFeature } from 'app/enums/license-feature.enum';
import { Role } from 'app/enums/role.enum';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import { License, SystemInfo } from 'app/interfaces/system-info.interface';
import { FeedbackDialog } from 'app/modules/feedback/components/feedback-dialog/feedback-dialog.component';
import { FeedbackType } from 'app/modules/feedback/interfaces/feedback.interface';
import { LocaleService } from 'app/modules/language/locale.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  formatLicenseExpiration,
  getProductImageSrc,
} from 'app/pages/dashboard/widgets/system/common/widget-sys-info.utils';
import { LicenseComponent } from 'app/pages/system/general-settings/support/license/license.component';
import { LicenseInfoInSupport } from 'app/pages/system/general-settings/support/license-info-in-support.interface';
import { ProactiveComponent } from 'app/pages/system/general-settings/support/proactive/proactive.component';
import {
  SaveDebugButtonComponent,
} from 'app/pages/system/general-settings/support/save-debug-button/save-debug-button.component';
import {
  SetProductionStatusDialog,
  SetProductionStatusDialogResult,
} from 'app/pages/system/general-settings/support/set-production-status-dialog/set-production-status-dialog.component';
import { supportCardElements } from 'app/pages/system/general-settings/support/support-card/support-card.elements';
import { SysInfoComponent } from 'app/pages/system/general-settings/support/sys-info/sys-info.component';
import { SystemInfoInSupport } from 'app/pages/system/general-settings/support/system-info-in-support.interface';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { AppState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-support-card',
  templateUrl: './support-card.component.html',
  styleUrls: ['./support-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    MatTooltip,
    TranslateModule,
    SaveDebugButtonComponent,
  ],
})
export class SupportCardComponent implements OnInit {
  protected api = inject(ApiService);
  private loader = inject(LoaderService);
  private matDialog = inject(MatDialog);
  private slideIn = inject(SlideIn);
  private store$ = inject<Store<AppState>>(Store);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  private errorHandler = inject(ErrorHandlerService);
  private readonly destroyRef = inject(DestroyRef);
  private localeService = inject(LocaleService);

  protected readonly requiredRoles = [Role.FullAdmin];
  protected readonly Role = Role;
  protected readonly searchableElements = supportCardElements;

  systemInfo: SystemInfoInSupport;
  hasLicense = false;
  productImageSrc = signal<string | null>(null);
  licenseInfo: LicenseInfoInSupport | null = null;
  ticketText = helptext.ticket;
  proactiveText = helptext.proactive.title;
  isProactiveSupportAvailable = signal(false);
  isProactiveSupportEnabled = signal(false);
  isContractExpiringSoon = signal(false);

  private readonly expirationWarningDays = 14;

  protected readonly isProductionControl = new FormControl(false, { nonNullable: true });

  get licenseButtonText(): string {
    return this.hasLicense ? helptext.updateTxt : helptext.enterTxt;
  }

  ngOnInit(): void {
    this.store$.pipe(waitForSystemInfo, takeUntilDestroyed(this.destroyRef)).subscribe((systemInfo) => {
      this.systemInfo = { ...systemInfo };
      this.systemInfo.memory = (systemInfo.physmem / GiB).toFixed(0) + ' GiB';

      if (systemInfo.license) {
        this.hasLicense = true;
        this.licenseInfo = this.buildLicenseInfo(systemInfo.license, systemInfo.datetime.$date);
        this.isContractExpiringSoon.set(this.computeExpiringSoon(this.licenseInfo.daysLeftInContract));
        this.checkProactiveSupportAvailability();
        this.setupProductImage(systemInfo);
      } else {
        this.hasLicense = false;
        this.licenseInfo = null;
        this.isContractExpiringSoon.set(false);
      }
      this.cdr.markForCheck();
    });

    this.loadProductionStatus();
    this.saveProductionStatusOnChange();
  }

  private setupProductImage(systemInfo: SystemInfo): void {
    const productImageUrl = getProductImageSrc(systemInfo.system_product);
    this.productImageSrc.set(productImageUrl);
  }

  private buildLicenseInfo(license: License, nowMs: number): LicenseInfoInSupport {
    // Support contract dates live on the SUPPORT feature entry; fall back to the
    // top-level expiration if the SUPPORT entry is absent.
    const supportFeature = license.features.find((feature) => feature.name === LicenseFeature.Support);
    const expiresAt = supportFeature?.expires_at ?? license.expires_at ?? null;

    const expirationDateDisplay = formatLicenseExpiration(expiresAt, this.localeService);
    let daysLeftInContract: number | null = null;
    if (expiresAt?.$value) {
      daysLeftInContract = Math.round((new Date(expiresAt.$value).getTime() - nowMs) / oneDayMillis);
    }

    const featureNames = license.features
      .filter((feature) => feature.name !== LicenseFeature.Support)
      .map((feature) => getLabelForLicenseFeature(feature.name));

    const additionalHardware = Object.entries(license.enclosures)
      .map(([model, count]) => this.translate.instant('{count}× {model}', { count, model }))
      .join(', ') || null;

    return {
      contractType: license.contract_type,
      model: license.model,
      expirationDateDisplay,
      daysLeftInContract,
      featureNames,
      additionalHardware,
      serials: license.serials,
    };
  }

  private computeExpiringSoon(daysLeft: number | null): boolean {
    return daysLeft !== null
      && daysLeft >= 0
      && daysLeft <= this.expirationWarningDays;
  }

  updateLicense(): void {
    this.slideIn.open(LicenseComponent);
  }

  feedbackDialog(): void {
    this.matDialog.open(FeedbackDialog, { data: FeedbackType.Bug });
  }

  openProactive(): void {
    this.slideIn.open(ProactiveComponent, { wide: true })
      .onClose(() => this.checkProactiveSupportAvailability(), this.destroyRef);
  }

  private updateProductionStatus(newStatus: boolean): void {
    let request$: Observable<boolean | SetProductionStatusDialogResult>;
    if (newStatus) {
      request$ = this.matDialog.open(SetProductionStatusDialog).afterClosed().pipe(
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
        const attachDebug = (typeof result === 'object' && result?.sendInitialDebug) || false;

        return this.api.job('truenas.set_production', [newStatus, attachDebug]).pipe(
          this.loader.withLoader(),
          this.errorHandler.withErrorHandler(),
          tap({
            complete: () => {
              this.snackbar.success(
                this.translate.instant(helptext.isProductionDialog.message),
              );
            },
          }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    )
      .subscribe();
  }

  private loadProductionStatus(): void {
    this.api.call('truenas.is_production')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isProduction) => {
        this.isProductionControl.setValue(isProduction, { emitEvent: false });
        this.cdr.markForCheck();
      });
  }

  private saveProductionStatusOnChange(): void {
    this.isProductionControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((newStatus) => this.updateProductionStatus(newStatus));
  }

  private checkProactiveSupportAvailability(): void {
    this.api.call('support.is_available')
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((isAvailable) => {
        this.isProactiveSupportAvailable.set(isAvailable);

        if (isAvailable) {
          this.checkProactiveSupportEnabled();
        } else {
          this.isProactiveSupportEnabled.set(false);
        }

        this.cdr.markForCheck();
      });
  }

  private checkProactiveSupportEnabled(): void {
    this.api.call('support.is_available_and_enabled')
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((isEnabled) => {
        this.isProactiveSupportEnabled.set(isEnabled);
        this.cdr.markForCheck();
      });
  }
}
