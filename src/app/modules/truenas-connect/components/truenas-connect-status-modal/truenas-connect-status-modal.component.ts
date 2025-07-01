import {
  ChangeDetectionStrategy, Component, computed, Inject, OnInit, signal,
} from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
  MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  EMPTY, catchError, finalize, switchMap,
} from 'rxjs';
import { TncStatus, TruenasConnectStatus, TruenasConnectStatusReason } from 'app/enums/truenas-connect-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
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
    MatDialogClose,
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
export class TruenasConnectStatusModalComponent implements OnInit {
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
      default:
        return TncStatus.Disabled;
    }
  });

  constructor(
    @Inject(WINDOW) private window: Window,
    protected tnc: TruenasConnectService,
    private dialog: DialogService,
    private translate: TranslateService,
  ) { }

  ngOnInit(): void {
    this.enableServiceIfDisabled();
  }

  private enableServiceIfDisabled(): void {
    if (this.tnc.config()?.status === TruenasConnectStatus.Disabled) {
      this.isLoading.set(true);
      this.tnc.enableService()
        .pipe(
          catchError((_: unknown) => {
            this.dialog.error({
              title: this.translate.instant('Error'),
              message: this.translate.instant('Failed to enable TrueNAS Connect service'),
            });
            return EMPTY;
          }),
          finalize(() => this.isLoading.set(false)),
          untilDestroyed(this),
        )
        .subscribe();
    }
  }

  protected open(): void {
    this.window.open(this.tnc.config()?.tnc_base_url);
  }

  protected connect(): void {
    this.isConnecting.set(true);
    this.tnc.connect()
      .pipe(
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
    this.isDisabling.set(true);
    this.tnc.disableService()
      .pipe(
        catchError((_: unknown) => {
          this.dialog.error({
            title: this.translate.instant('Disable Error'),
            message: this.translate.instant('Failed to disable TrueNAS Connect service'),
          });
          return EMPTY;
        }),
        finalize(() => this.isDisabling.set(false)),
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
