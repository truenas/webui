import { TruenasConnectTier } from 'app/enums/truenas-connect-tier.enum';

export interface TierDisplayConfig {
  label: string;
  short: string;
  background: string;
}

export const tierDisplayConfig: Record<TruenasConnectTier, TierDisplayConfig> = {
  [TruenasConnectTier.Foundation]: { label: 'Foundation', short: 'F', background: 'var(--green)' },
  [TruenasConnectTier.Plus]: { label: 'Plus', short: '+', background: 'var(--blue)' },
  [TruenasConnectTier.Business]: { label: 'Business', short: 'B', background: 'var(--violet)' },
};
