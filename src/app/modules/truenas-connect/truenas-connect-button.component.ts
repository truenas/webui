import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { helptextTopbar } from 'app/helptext/topbar';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { tierDisplayConfig } from 'app/modules/truenas-connect/truenas-connect-tier.utils';

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
    const tier = this.tier();
    return tier ? tierDisplayConfig[tier].short : '';
  });

  protected tierCssClass = computed(() => {
    const tier = this.tier();
    return tier ? tierDisplayConfig[tier].cssClass : '';
  });

  protected tierName = computed(() => {
    const tier = this.tier();
    return tier ? tierDisplayConfig[tier].label : null;
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
