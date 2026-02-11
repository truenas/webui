import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { TruenasConnectTier } from 'app/enums/truenas-connect-tier.enum';
import { helptextTopbar } from 'app/helptext/topbar';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';

@Component({
  selector: 'ix-truenas-connect-button',
  imports: [
    TnIconComponent,
    MatButtonModule,
    MatIconButton,
    MatTooltip,
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

  protected tier = computed(() => this.truenasConnectService.config()?.tier ?? null);

  protected showBadge = computed(() => {
    const config = this.truenasConnectService.config();

    return config?.status === TruenasConnectStatus.Configured && config?.tier != null;
  });

  protected tierLabel = computed(() => {
    switch (this.tier()) {
      case TruenasConnectTier.Foundation: return 'F';
      case TruenasConnectTier.Plus: return '+';
      case TruenasConnectTier.Business: return 'B';
      default: return '';
    }
  });

  protected tierCssClass = computed(() => {
    switch (this.tier()) {
      case TruenasConnectTier.Foundation: return 'tier-foundation';
      case TruenasConnectTier.Plus: return 'tier-plus';
      case TruenasConnectTier.Business: return 'tier-business';
      default: return '';
    }
  });

  protected tierName = computed(() => {
    switch (this.tier()) {
      case TruenasConnectTier.Foundation: return 'Foundation';
      case TruenasConnectTier.Plus: return 'Plus';
      case TruenasConnectTier.Business: return 'Business';
      default: return null;
    }
  });

  protected tooltip = computed(() => {
    const base = this.translate.instant(helptextTopbar.tooltips.tncStatus);
    const name = this.tierName();
    if (name && this.showBadge()) {
      return `${base}\n${this.translate.instant('Tier: {tier}', { tier: name })}`;
    }
    return base;
  });

  protected showStatus(): void {
    this.truenasConnectService.openStatusModal();
  }
}
