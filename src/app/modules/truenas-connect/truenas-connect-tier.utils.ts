import { TruenasConnectTier } from 'app/enums/truenas-connect-tier.enum';

export interface TierDisplayConfig {
  label: string;
  short: string;
  cssClass: string;
}

export const tierDisplayConfig: Record<TruenasConnectTier, TierDisplayConfig> = {
  [TruenasConnectTier.Foundation]: { label: 'Foundation', short: 'F', cssClass: 'tier-foundation' },
  [TruenasConnectTier.Plus]: { label: 'Plus', short: '+', cssClass: 'tier-plus' },
  [TruenasConnectTier.Business]: { label: 'Business', short: 'B', cssClass: 'tier-business' },
};
