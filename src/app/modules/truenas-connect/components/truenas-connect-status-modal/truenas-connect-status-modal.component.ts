import {
  ChangeDetectionStrategy, Component, computed, Inject, OnInit,
} from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
  MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { switchMap } from 'rxjs';
import { TncStatus, TruenasConnectStatus, TruenasConnectStatusReason } from 'app/enums/truenas-connect-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TruenasConnectSpinnerComponent } from 'app/modules/truenas-connect/components/truenas-connect-spinner/truenas-connect-spinner.component';
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
  ],
  templateUrl: './truenas-connect-status-modal.component.html',
  styleUrl: './truenas-connect-status-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TruenasConnectStatusModalComponent implements OnInit {
  readonly TruenasConnectStatus = TruenasConnectStatus;
  readonly TruenasConnectStatusReason = TruenasConnectStatusReason;
  readonly TncStatus = TncStatus;

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
  ) { }

  ngOnInit(): void {
    // Automatically re-enable the service if it's disabled
    if (this.tnc.config()?.status === TruenasConnectStatus.Disabled) {
      this.tnc.enableService()
        .pipe(untilDestroyed(this))
        .subscribe();
    }
  }

  protected open(): void {
    this.window.open(this.tnc.config()?.tnc_base_url);
  }

  protected connect(): void {
    this.tnc.connect()
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  protected disableService(): void {
    this.tnc.disableService()
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  protected retryConnection(): void {
    this.tnc.disableService()
      .pipe(
        switchMap(() => this.tnc.enableService()),
        untilDestroyed(this),
      )
      .subscribe();
  }
}
