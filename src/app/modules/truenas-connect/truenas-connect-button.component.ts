import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TnIconButtonComponent } from '@truenas/ui-components';
import { TruenasConnectStatus, TruenasConnectStatusReason } from 'app/enums/truenas-connect-status.enum';
import { helptextTopbar } from 'app/helptext/topbar';
import { StatusBadge, StatusBadgeComponent } from 'app/modules/layout/topbar/status-badge/status-badge.component';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { tierDisplayConfig } from 'app/modules/truenas-connect/truenas-connect-tier.utils';

type StatusKind = 'success' | 'failure' | 'in-progress' | 'idle';

const statusKinds = {
  [TruenasConnectStatus.Configured]: 'success',

  [TruenasConnectStatus.RegistrationFinalizationFailed]: 'failure',
  [TruenasConnectStatus.RegistrationFinalizationTimeout]: 'failure',
  [TruenasConnectStatus.CertGenerationFailed]: 'failure',
  [TruenasConnectStatus.CertConfigurationFailure]: 'failure',
  [TruenasConnectStatus.CertRenewalFailure]: 'failure',

  [TruenasConnectStatus.RegistrationFinalizationWaiting]: 'in-progress',
  [TruenasConnectStatus.RegistrationFinalizationSuccess]: 'in-progress',
  [TruenasConnectStatus.CertGenerationInProgress]: 'in-progress',
  [TruenasConnectStatus.CertGenerationSuccess]: 'in-progress',
  [TruenasConnectStatus.CertRenewalInProgress]: 'in-progress',
  [TruenasConnectStatus.CertRenewalSuccess]: 'in-progress',

  [TruenasConnectStatus.Disabled]: 'idle',
  [TruenasConnectStatus.ClaimTokenMissing]: 'idle',
} as const satisfies Record<TruenasConnectStatus, StatusKind>;

function classifyStatus(status: TruenasConnectStatus): StatusKind {
  return statusKinds[status] ?? 'idle';
}

@Component({
  selector: 'ix-truenas-connect-button',
  imports: [
    TnIconButtonComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './truenas-connect-button.component.html',
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
      const name = this.translate.instant(tierDisplayConfig[tier].label);
      return `${base}\n${this.translate.instant('Tier: {tier}', { tier: name })}`;
    }
    return base;
  });

  protected showStatus(): void {
    this.truenasConnectService.openStatusModal();
  }
}
