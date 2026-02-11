import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { TncStatus, TruenasConnectStatus, TruenasConnectStatusReason } from 'app/enums/truenas-connect-status.enum';
import { TruenasConnectTier } from 'app/enums/truenas-connect-tier.enum';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TruenasConnectSpinnerComponent } from 'app/modules/truenas-connect/components/truenas-connect-spinner/truenas-connect-spinner.component';
import { tierDisplayConfig } from 'app/modules/truenas-connect/truenas-connect-tier.utils';

@Component({
  selector: 'ix-truenas-connect-status-display',
  imports: [
    TnIconComponent,
    TranslateModule,
    TestDirective,
    TruenasConnectSpinnerComponent,
  ],
  templateUrl: './truenas-connect-status-display.component.html',
  styleUrl: './truenas-connect-status-display.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TruenasConnectStatusDisplayComponent {
  readonly TncStatus = TncStatus;
  readonly TruenasConnectStatusReason = TruenasConnectStatusReason;

  status = input.required<typeof TncStatus[keyof typeof TncStatus]>();
  rawStatus = input.required<TruenasConnectStatus>();
  tier = input<TruenasConnectTier | null>(null);

  protected tierLabel = computed(() => {
    const tier = this.tier();
    return tier ? tierDisplayConfig[tier].label : null;
  });

  protected tierCssClass = computed(() => {
    const tier = this.tier();
    return tier ? tierDisplayConfig[tier].cssClass : '';
  });
}
