import {
  ChangeDetectionStrategy, Component, computed, inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnBannerComponent,
  TnButtonComponent,
  TnCardComponent,
  TnCardFooterActionsDirective,
  TnCardHeaderDirective,
  TnIconComponent,
  TnListComponent,
  TnListItemComponent,
  TnTestIdDirective,
  type TnBannerType,
} from '@truenas/ui-components';
import { truenasConnectLink } from 'app/constants/truenas-connect-link.constant';
import { WINDOW } from 'app/helpers/window.helper';
import { ApiDate } from 'app/interfaces/api-date.interface';
import { LocaleService } from 'app/modules/language/locale.service';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { tierDisplayConfig } from 'app/modules/truenas-connect/truenas-connect-tier.utils';
import { formatLicenseExpiration } from 'app/pages/dashboard/widgets/system/common/widget-sys-info.utils';
import {
  getTncFeaturesSummary, TncFeaturesUrgency,
} from 'app/pages/system/general-settings/tnc-features/tnc-features.utils';
import { AppState } from 'app/store';
import { selectEntitlements } from 'app/store/entitlements/entitlements.selectors';
import { selectLicense, selectSystemInfo } from 'app/store/system-info/system-info.selectors';

const bannerTypes: Record<TncFeaturesUrgency, TnBannerType> = {
  [TncFeaturesUrgency.Active]: 'info',
  [TncFeaturesUrgency.Expiring]: 'warning',
  [TncFeaturesUrgency.Critical]: 'error',
  [TncFeaturesUrgency.Expired]: 'error',
};

/**
 * Lists what a Community system can do only because of its TrueNAS Connect subscription, so
 * a lapse does not switch features off without explanation. Calm while the subscription runs,
 * escalating to a warning and then an error as the earliest feature nears its expiry.
 *
 * Renders nothing when there is no subscription-provided license.
 */
@Component({
  selector: 'ix-tnc-features-card',
  templateUrl: './tnc-features-card.component.html',
  styleUrls: ['./tnc-features-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // Out of the settings grid entirely when there is nothing to show, not an empty cell.
    '[style.display]': 'summary() ? null : "none"',
  },
  imports: [
    TnBannerComponent,
    TnButtonComponent,
    TnCardComponent,
    TnCardFooterActionsDirective,
    TnCardHeaderDirective,
    TnIconComponent,
    TnListComponent,
    TnListItemComponent,
    TnTestIdDirective,
    TranslateModule,
  ],
})
export class TncFeaturesCardComponent {
  private store$ = inject<Store<AppState>>(Store);
  private localeService = inject(LocaleService);
  private tncService = inject(TruenasConnectService);
  private window = inject<Window>(WINDOW);

  protected readonly Urgency = TncFeaturesUrgency;

  private readonly license = toSignal(this.store$.select(selectLicense), { initialValue: null });
  private readonly entitlements = toSignal(this.store$.select(selectEntitlements), { initialValue: null });
  private readonly systemInfo = toSignal(this.store$.select(selectSystemInfo), { initialValue: null });

  protected readonly summary = computed(() => {
    const systemInfo = this.systemInfo();
    if (!systemInfo) {
      return null;
    }
    // The appliance clock, not the browser's: the subscription expires on the system's calendar.
    return getTncFeaturesSummary(this.license(), this.entitlements(), systemInfo.datetime.$date);
  });

  protected readonly bannerType = computed(() => bannerTypes[this.summary()?.urgency ?? TncFeaturesUrgency.Active]);

  protected readonly tierLabel = computed(() => {
    const tier = this.tncService.config()?.tier;
    return tier ? tierDisplayConfig[tier]?.label ?? null : null;
  });

  protected readonly soonestDate = computed(() => this.formatDate(this.summary()?.soonest?.expiresAt ?? null));

  protected openMembership(): void {
    this.window.open(truenasConnectLink, '_blank', 'noopener,noreferrer');
  }

  protected formatDate(date: ApiDate | null): string | null {
    return formatLicenseExpiration(date, this.localeService);
  }
}
