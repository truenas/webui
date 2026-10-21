import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { EntitlementReason } from 'app/enums/entitlement-reason.enum';
import { LicenseFeature } from 'app/enums/license-feature.enum';
import { LicenseType } from 'app/enums/license-type.enum';
import { EntitlementMap } from 'app/interfaces/entitlement.interface';
import { License, LicenseFeatureInfo } from 'app/interfaces/system-info.interface';
import {
  getTncFeaturesSummary,
  getTncFeatureUrgency,
  TncFeaturesUrgency,
} from 'app/pages/system/general-settings/tnc-features/tnc-features.utils';

const now = Date.UTC(2026, 9, 21, 12);

function feature(name: string, expiresAt: string | null): LicenseFeatureInfo {
  return {
    name,
    expires_at: expiresAt ? { $type: 'date', $value: expiresAt } : null,
  } as LicenseFeatureInfo;
}

function license(type: LicenseType, features: LicenseFeatureInfo[]): License {
  return { type, features } as License;
}

describe('getTncFeatureUrgency', () => {
  it('escalates as the expiry approaches', () => {
    expect(getTncFeatureUrgency(null)).toBe(TncFeaturesUrgency.Active);
    expect(getTncFeatureUrgency(31)).toBe(TncFeaturesUrgency.Active);
    expect(getTncFeatureUrgency(30)).toBe(TncFeaturesUrgency.Expiring);
    expect(getTncFeatureUrgency(8)).toBe(TncFeaturesUrgency.Expiring);
    expect(getTncFeatureUrgency(7)).toBe(TncFeaturesUrgency.Critical);
    expect(getTncFeatureUrgency(0)).toBe(TncFeaturesUrgency.Critical);
    expect(getTncFeatureUrgency(-1)).toBe(TncFeaturesUrgency.Expired);
  });
});

describe('getTncFeaturesSummary', () => {
  it('returns null without a Community license', () => {
    expect(getTncFeaturesSummary(null, {}, now)).toBeNull();
    expect(getTncFeaturesSummary(
      license(LicenseType.EnterpriseHa, [feature(EntitlementFeature.Webshare, '2027-01-01')]),
      {},
      now,
    )).toBeNull();
  });

  it('lists the features the subscription grants, leaving out support and anything still denied', () => {
    const summary = getTncFeaturesSummary(
      license(LicenseType.Community, [
        feature(EntitlementFeature.Webshare, '2027-01-01'),
        feature(EntitlementFeature.TrueSearch, '2027-01-01'),
        feature(LicenseFeature.Support, '2027-01-01'),
        feature(EntitlementFeature.Sed, '2027-01-01'),
      ]),
      {
        [EntitlementFeature.Sed]: { entitled: false, reason: EntitlementReason.WrongHardware, message: '' },
      } as EntitlementMap,
      now,
    );

    expect(summary?.features.map((item) => item.label)).toEqual(['TrueSearch', 'Webshare']);
    expect(summary?.urgency).toBe(TncFeaturesUrgency.Active);
  });

  it('takes its urgency from the feature that expires first and lists that one first', () => {
    const summary = getTncFeaturesSummary(
      license(LicenseType.Community, [
        feature(EntitlementFeature.Webshare, '2027-06-01'),
        feature(EntitlementFeature.TrueSearch, '2026-10-25'),
        feature(EntitlementFeature.S3Versioning, '2026-11-10'),
      ]),
      null,
      now,
    );

    expect(summary?.urgency).toBe(TncFeaturesUrgency.Critical);
    expect(summary?.soonest?.name).toBe(EntitlementFeature.TrueSearch);
    expect(summary?.soonest?.daysLeft).toBe(4);
    expect(summary?.features.map((item) => item.name)).toEqual([
      EntitlementFeature.TrueSearch,
      EntitlementFeature.S3Versioning,
      EntitlementFeature.Webshare,
    ]);
  });

  it('reports a lapsed subscription as expired', () => {
    const summary = getTncFeaturesSummary(
      license(LicenseType.Community, [feature(EntitlementFeature.Webshare, '2026-10-01')]),
      null,
      now,
    );

    expect(summary?.urgency).toBe(TncFeaturesUrgency.Expired);
  });
});
