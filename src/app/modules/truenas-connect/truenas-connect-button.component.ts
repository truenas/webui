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

const failedStatuses: ReadonlySet<TruenasConnectStatus> = new Set([
  TruenasConnectStatus.RegistrationFinalizationFailed,
  TruenasConnectStatus.RegistrationFinalizationTimeout,
  TruenasConnectStatus.CertGenerationFailed,
  TruenasConnectStatus.CertConfigurationFailure,
  TruenasConnectStatus.CertRenewalFailure,
]);

const inProgressStatuses: ReadonlySet<TruenasConnectStatus> = new Set([
  TruenasConnectStatus.RegistrationFinalizationWaiting,
  TruenasConnectStatus.RegistrationFinalizationSuccess,
  TruenasConnectStatus.CertGenerationInProgress,
  TruenasConnectStatus.CertGenerationSuccess,
  TruenasConnectStatus.CertRenewalInProgress,
  TruenasConnectStatus.CertRenewalSuccess,
]);

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
    if (config.status === TruenasConnectStatus.Configured) {
      if (tier != null) {
        const tierConfig = tierDisplayConfig[tier];
        return { label: tierConfig.short, background: tierConfig.background };
      }
      return { icon: 'check', background: 'var(--green)' };
    }

    if (failedStatuses.has(config.status)) {
      return { icon: 'close', background: 'var(--red)' };
    }

    if (inProgressStatuses.has(config.status)) {
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
