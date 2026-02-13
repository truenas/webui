import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import {
  MatDialogTitle, MatDialogContent, MatDialogActions,
} from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  EMPTY, catchError, finalize, of, switchMap, Observable,
} from 'rxjs';
import { TncStatus, TruenasConnectStatus, TruenasConnectStatusReason } from 'app/enums/truenas-connect-status.enum';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TruenasConnectInterfaceSelectorComponent } from 'app/modules/truenas-connect/components/truenas-connect-interface-selector/truenas-connect-interface-selector.component';
import { TruenasConnectSpinnerComponent } from 'app/modules/truenas-connect/components/truenas-connect-spinner/truenas-connect-spinner.component';
import { TruenasConnectStatusDisplayComponent } from 'app/modules/truenas-connect/components/truenas-connect-status-display/truenas-connect-status-display.component';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';

enum ModalView {
  Status = 'status',
  InterfaceSelector = 'interface-selector',
}

@Component({
  selector: 'ix-truenas-connect-status-modal',
  imports: [
    MatDivider,
    MatDialogTitle,
    MatDialogContent,
    MatButton,
    MatDialogActions,
    TranslateModule,
    TestDirective,
    TruenasConnectSpinnerComponent,
    TruenasConnectStatusDisplayComponent,
    TruenasConnectInterfaceSelectorComponent,
  ],
  templateUrl: './truenas-connect-status-modal.component.html',
  styleUrl: './truenas-connect-status-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TruenasConnectStatusModalComponent {
  protected tnc = inject(TruenasConnectService);
  private dialog = inject(DialogService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  readonly TruenasConnectStatus = TruenasConnectStatus;
  readonly TruenasConnectStatusReason = TruenasConnectStatusReason;
  readonly TncStatus = TncStatus;
  readonly ModalView = ModalView;

  protected currentView = signal<ModalView>(ModalView.Status);
  protected selectedInterfaces = signal<string[]>([]);

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
        return TncStatus.Disabled;
      default:
        return TncStatus.Waiting;
    }
  });

  protected open(): void {
    const baseUrl = this.tnc.config()?.tnc_base_url;
    if (baseUrl) {
      this.tnc.openTruenasConnectWindow(baseUrl);
    }
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
          if (
            config?.status === TruenasConnectStatus.ClaimTokenMissing
            || config?.status === TruenasConnectStatus.RegistrationFinalizationTimeout
          ) {
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
        takeUntilDestroyed(this.destroyRef),
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
        takeUntilDestroyed(this.destroyRef),
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
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected showInterfaceSelector(): void {
    this.currentView.set(ModalView.InterfaceSelector);
  }

  protected onInterfacesSelected(interfaces: string[]): void {
    this.selectedInterfaces.set(interfaces);
  }
}
