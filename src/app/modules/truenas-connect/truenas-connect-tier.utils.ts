import { TruenasConnectTier } from 'app/enums/truenas-connect-tier.enum';
import { StatusBadgeKind } from 'app/modules/layout/topbar/status-badge/status-badge.component';

type TierKind = Extract<StatusBadgeKind, `tier-${string}`>;

export interface TierDisplayConfig {
  label: string;
  short: string;
  cssClass: TierKind;
}

export const tierDisplayConfig: Record<TruenasConnectTier, TierDisplayConfig> = {
  [TruenasConnectTier.Foundation]: { label: 'Foundation', short: 'F', cssClass: 'tier-foundation' },
  [TruenasConnectTier.Plus]: { label: 'Plus', short: '+', cssClass: 'tier-plus' },
  [TruenasConnectTier.Business]: { label: 'Business', short: 'B', cssClass: 'tier-business' },
};
