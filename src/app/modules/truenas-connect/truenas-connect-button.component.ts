import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { TruenasConnectStatus, TruenasConnectStatusReason } from 'app/enums/truenas-connect-status.enum';
import { helptextTopbar } from 'app/helptext/topbar';
import { StatusBadge, StatusBadgeComponent } from 'app/modules/layout/topbar/status-badge/status-badge.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { tierDisplayConfig } from 'app/modules/truenas-connect/truenas-connect-tier.utils';

type StatusKind = 'success' | 'failure' | 'in-progress' | 'idle';

function classifyStatus(status: TruenasConnectStatus): StatusKind {
  switch (status) {
    case TruenasConnectStatus.Configured:
      return 'success';
    case TruenasConnectStatus.RegistrationFinalizationFailed:
    case TruenasConnectStatus.RegistrationFinalizationTimeout:
    case TruenasConnectStatus.CertGenerationFailed:
    case TruenasConnectStatus.CertConfigurationFailure:
    case TruenasConnectStatus.CertRenewalFailure:
      return 'failure';
    case TruenasConnectStatus.RegistrationFinalizationWaiting:
    case TruenasConnectStatus.RegistrationFinalizationSuccess:
    case TruenasConnectStatus.CertGenerationInProgress:
    case TruenasConnectStatus.CertGenerationSuccess:
    case TruenasConnectStatus.CertRenewalInProgress:
    case TruenasConnectStatus.CertRenewalSuccess:
      return 'in-progress';
    case TruenasConnectStatus.Disabled:
    case TruenasConnectStatus.ClaimTokenMissing:
      return 'idle';
    default:
      return assertNever(status);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled TruenasConnectStatus: ${value as string}`);
}

@Component({
  selector: 'ix-truenas-connect-button',
  imports: [
    TnIconComponent,
    MatButtonModule,
    MatIconButton,
    MatTooltip,
    StatusBadgeComponent,
    TranslateModule,
    TestDirective,
  ],
  templateUrl: './truenas-connect-button.component.html',
  styleUrl: './truenas-connect-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TruenasConnectButtonComponent {
  private truenasConnectService = inject(TruenasConnectService);
  private translate = inject(TranslateService);

  private tier = computed(() => this.truenasConnectService.config()?.tier ?? null);

  protected badge = computed<StatusBadge | null>(() => {
    const config = this.truenasConnectService.config();
    if (!config) {
      return null;
    }

    const tier = this.tier();
    const kind = classifyStatus(config.status);
    if (kind === 'success') {
      if (tier != null) {
        const tierConfig = tierDisplayConfig[tier];
        return { label: tierConfig.short, background: tierConfig.background };
      }
      return { icon: 'check', background: 'var(--green)' };
    }
    if (kind === 'failure') {
      return { icon: 'close', background: 'var(--red)' };
    }
    if (kind === 'in-progress') {
      return { icon: 'clock-outline', background: 'var(--yellow)', spinning: true };
    }
    return null;
  });

  protected tooltip = computed(() => {
    const config = this.truenasConnectService.config();
    if (!config) {
      return this.translate.instant(helptextTopbar.tooltips.tncStatus);
    }
    const base = this.translate.instant(TruenasConnectStatusReason[config.status]);
    const tier = this.tier();
    if (tier && config.status === TruenasConnectStatus.Configured) {
      const name = tierDisplayConfig[tier].label;
      return `${base}\n${this.translate.instant('Tier: {tier}', { tier: name })}`;
    }
    return base;
  });

  protected showStatus(): void {
    this.truenasConnectService.openStatusModal();
  }
}
