import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { TncStatus, TruenasConnectStatus, TruenasConnectStatusReason } from 'app/enums/truenas-connect-status.enum';
import { TruenasConnectTier } from 'app/enums/truenas-connect-tier.enum';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TruenasConnectSpinnerComponent } from 'app/modules/truenas-connect/components/truenas-connect-spinner/truenas-connect-spinner.component';

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
    switch (this.tier()) {
      case TruenasConnectTier.Foundation: return 'Foundation';
      case TruenasConnectTier.Plus: return 'Plus';
      case TruenasConnectTier.Business: return 'Business';
      default: return null;
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
}
