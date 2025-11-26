import { ChangeDetectionStrategy, Component, computed, signal, inject } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
  MatDialogTitle, MatDialogContent, MatDialogActions,
} from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  EMPTY, catchError, finalize, of, switchMap, Observable,
} from 'rxjs';
import { TncStatus, HarborosConnectStatus, HarborosConnectStatusReason } from 'app/enums/truenas-connect-status.enum';
import { HarborosConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { HarborosConnectSpinnerComponent } from 'app/modules/truenas-connect/components/truenas-connect-spinner/truenas-connect-spinner.component';
import { HarborosConnectStatusDisplayComponent } from 'app/modules/truenas-connect/components/truenas-connect-status-display/truenas-connect-status-display.component';
import { HarborosConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';

@UntilDestroy()
@Component({
  selector: 'ix-truenas-connect-status-modal',
  imports: [
    MatDivider,
    MatDialogTitle,
    MatDialogContent,
    IxIconComponent,
    MatButton,
    MatIconButton,
    MatDialogActions,
    MatTooltip,
    TranslateModule,
    TestDirective,
    HarborosConnectSpinnerComponent,
    HarborosConnectStatusDisplayComponent,
  ],
  templateUrl: './truenas-connect-status-modal.component.html',
  styleUrl: './truenas-connect-status-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HarborosConnectStatusModalComponent {
  protected tnc = inject(HarborosConnectService);
  private dialog = inject(DialogService);
  private translate = inject(TranslateService);

  readonly HarborosConnectStatus = HarborosConnectStatus;
  readonly HarborosConnectStatusReason = HarborosConnectStatusReason;
  readonly TncStatus = TncStatus;

  protected isLoading = signal(false);
  protected isConnecting = signal(false);
  protected isDisabling = signal(false);
  protected isRetrying = signal(false);

  protected status = computed(() => {
    switch (this.tnc.config()?.status) {
      case HarborosConnectStatus.Configured:
        return TncStatus.Active;
      case HarborosConnectStatus.ClaimTokenMissing:
      case HarborosConnectStatus.RegistrationFinalizationWaiting:
        return TncStatus.Waiting;
      case HarborosConnectStatus.RegistrationFinalizationSuccess:
      case HarborosConnectStatus.CertGenerationInProgress:
      case HarborosConnectStatus.CertGenerationSuccess:
      case HarborosConnectStatus.CertRenewalInProgress:
      case HarborosConnectStatus.CertRenewalSuccess:
        return TncStatus.Connecting;
      case HarborosConnectStatus.RegistrationFinalizationFailed:
      case HarborosConnectStatus.RegistrationFinalizationTimeout:
      case HarborosConnectStatus.CertGenerationFailed:
      case HarborosConnectStatus.CertConfigurationFailure:
      case HarborosConnectStatus.CertRenewalFailure:
        return TncStatus.Failed;
      case HarborosConnectStatus.Disabled:
      default:
        // Show "Get Connected" button for disabled state instead of dead-end "disabled" message
        return TncStatus.Waiting;
    }
  });

  protected open(): void {
    const baseUrl = this.tnc.config()?.tnc_base_url;
    if (baseUrl) {
      this.tnc.openHarborosConnectWindow(baseUrl);
    }
  }

  protected connect(): void {
    this.isConnecting.set(true);

    // Enable service first if it's disabled
    let enableIfNeeded$: Observable<HarborosConnectConfig> = of(this.tnc.config());
    if (this.tnc.config()?.status === HarborosConnectStatus.Disabled) {
      enableIfNeeded$ = this.tnc.enableService();
    }

    enableIfNeeded$
      .pipe(
        // NOW check if we need token generation based on current status
        switchMap(() => {
          if (this.tnc.config()?.status === HarborosConnectStatus.ClaimTokenMissing) {
            return this.tnc.generateToken();
          }
          return of('');
        }),
        switchMap(() => {
          return this.tnc.connect();
        }),
        catchError((_: unknown) => {
          this.dialog.error({
            title: this.translate.instant('Connection Error'),
            message: this.translate.instant('Failed to connect to HarborOS Connect'),
          });
          return EMPTY;
        }),
        finalize(() => this.isConnecting.set(false)),
        untilDestroyed(this),
      )
      .subscribe();
  }

  protected disableService(): void {
    this.dialog.confirm({
      title: this.translate.instant('Disable HarborOS Connect'),
      message: this.translate.instant('Are you sure you wish to disable HarborOS Connect? You will be able to re-connect this system later.'),
      buttonText: this.translate.instant('Disable'),
    })
      .pipe(
        switchMap((confirmed) => {
          if (!confirmed) {
            return EMPTY;
          }
          this.isDisabling.set(true);
          return this.tnc.disableService()
            .pipe(
              catchError((_: unknown) => {
                this.dialog.error({
                  title: this.translate.instant('Disable Error'),
                  message: this.translate.instant('Failed to disable HarborOS Connect service'),
                });
                return EMPTY;
              }),
              finalize(() => this.isDisabling.set(false)),
            );
        }),
        untilDestroyed(this),
      )
      .subscribe();
  }

  protected retryConnection(): void {
    this.isRetrying.set(true);
    this.tnc.disableService()
      .pipe(
        switchMap(() => this.tnc.enableService()),
        catchError((_: unknown) => {
          this.dialog.error({
            title: this.translate.instant('Retry Error'),
            message: this.translate.instant('Failed to retry HarborOS Connect connection'),
          });
          return EMPTY;
        }),
        finalize(() => this.isRetrying.set(false)),
        untilDestroyed(this),
      )
      .subscribe();
  }
}
