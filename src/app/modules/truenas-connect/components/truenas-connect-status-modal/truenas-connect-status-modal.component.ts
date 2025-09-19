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
import { TncStatus, TruenasConnectStatus, TruenasConnectStatusReason } from 'app/enums/truenas-connect-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TruenasConnectSpinnerComponent } from 'app/modules/truenas-connect/components/truenas-connect-spinner/truenas-connect-spinner.component';
import { TruenasConnectStatusDisplayComponent } from 'app/modules/truenas-connect/components/truenas-connect-status-display/truenas-connect-status-display.component';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';

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
    TruenasConnectSpinnerComponent,
    TruenasConnectStatusDisplayComponent,
  ],
  templateUrl: './truenas-connect-status-modal.component.html',
  styleUrl: './truenas-connect-status-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TruenasConnectStatusModalComponent {
  private window = inject<Window>(WINDOW);
  protected tnc = inject(TruenasConnectService);
  private dialog = inject(DialogService);
  private translate = inject(TranslateService);

  readonly TruenasConnectStatus = TruenasConnectStatus;
  readonly TruenasConnectStatusReason = TruenasConnectStatusReason;
  readonly TncStatus = TncStatus;

  protected isLoading = signal(false);
  protected isConnecting = signal(false);
  protected isDisabling = signal(false);
  protected isRetrying = signal(false);

  protected status = computed(() => {
    switch (this.tnc.config()?.status) {
      case TruenasConnectStatus.Configured:
        return TncStatus.Active;
      case TruenasConnectStatus.ClaimTokenMissing:
      case TruenasConnectStatus.RegistrationFinalizationWaiting:
        return TncStatus.Waiting;
      case TruenasConnectStatus.RegistrationFinalizationSuccess:
      case TruenasConnectStatus.CertGenerationInProgress:
      case TruenasConnectStatus.CertGenerationSuccess:
      case TruenasConnectStatus.CertRenewalInProgress:
      case TruenasConnectStatus.CertRenewalSuccess:
        return TncStatus.Connecting;
      case TruenasConnectStatus.RegistrationFinalizationFailed:
      case TruenasConnectStatus.RegistrationFinalizationTimeout:
      case TruenasConnectStatus.CertGenerationFailed:
      case TruenasConnectStatus.CertConfigurationFailure:
      case TruenasConnectStatus.CertRenewalFailure:
        return TncStatus.Failed;
      case TruenasConnectStatus.Disabled:
      default:
        // Show "Get Connected" button for disabled state instead of dead-end "disabled" message
        return TncStatus.Waiting;
    }
  });

  protected open(): void {
    this.window.open(this.tnc.config()?.tnc_base_url);
  }

  protected connect(): void {
    this.isConnecting.set(true);

    // Enable service first if it's disabled
    let enableIfNeeded$: Observable<TruenasConnectConfig> = of(this.tnc.config());
    if (this.tnc.config()?.status === TruenasConnectStatus.Disabled) {
      enableIfNeeded$ = this.tnc.enableService();
    }

    enableIfNeeded$
      .pipe(
        // NOW check if we need token generation based on updated config
        switchMap((config) => {
          if (config?.status === TruenasConnectStatus.ClaimTokenMissing) {
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
            message: this.translate.instant('Failed to connect to TrueNAS Connect'),
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
      title: this.translate.instant('Disable TrueNAS Connect'),
      message: this.translate.instant('Are you sure you wish to disable TrueNAS Connect? You will be able to re-connect this system later.'),
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
                  message: this.translate.instant('Failed to disable TrueNAS Connect service'),
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
            message: this.translate.instant('Failed to retry TrueNAS Connect connection'),
          });
          return EMPTY;
        }),
        finalize(() => this.isRetrying.set(false)),
        untilDestroyed(this),
      )
      .subscribe();
  }
}
