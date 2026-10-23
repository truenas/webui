import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { getLabelForLicenseFeature, LicenseFeature } from 'app/enums/license-feature.enum';
import { LicenseType } from 'app/enums/license-type.enum';
import { ApiDate } from 'app/interfaces/api-date.interface';
import { EntitlementEntry, EntitlementMap } from 'app/interfaces/entitlement.interface';
import { License } from 'app/interfaces/system-info.interface';
import { getDaysUntilLicenseExpiration } from 'app/pages/dashboard/widgets/system/common/widget-sys-info.utils';

/**
 * How close the subscription-provided features are to switching off, from calm to alarming.
 * Ordered, so the card can take the worst of its features.
 */
export enum TncFeaturesUrgency {
  Active = 0,
  Expiring = 1,
  Critical = 2,
  Expired = 3,
}

/** Days left at or under which the card stops being informational. */
export const tncExpiringDays = 30;
/** Days left at or under which the card turns red. */
export const tncCriticalDays = 7;

export interface TncFeature {
  name: string;
  label: string;
  expiresAt: ApiDate | null;
  daysLeft: number | null;
  urgency: TncFeaturesUrgency;
}

export interface TncFeaturesSummary {
  features: TncFeature[];
  urgency: TncFeaturesUrgency;
  /** The feature whose expiry drives `urgency`; `null` when nothing expires. */
  soonest: TncFeature | null;
}

const entitlementFeatureLabels: Partial<Record<string, string>> = {
  [EntitlementFeature.CatalogEnterpriseTrain]: T('Enterprise App Train'),
  [EntitlementFeature.DirectoryServicesAuth]: T('Directory Services Authentication'),
  [EntitlementFeature.Kmip]: T('KMIP'),
  [EntitlementFeature.MissionCritical]: T('Mission Critical Updates'),
  [EntitlementFeature.NetworkFec]: T('FEC Mode Configuration'),
  [EntitlementFeature.NfsSnapshot]: T('NFS Snapshot Exposure'),
  [EntitlementFeature.NvmeOfSpdk]: T('NVMe-oF SPDK'),
  [EntitlementFeature.Rdma]: T('RDMA'),
  [EntitlementFeature.S3Audit]: T('S3 Audit Logging'),
  [EntitlementFeature.S3Versioning]: T('S3 Versioning'),
  [EntitlementFeature.SmbBlockCloning]: T('SMB Block Cloning'),
  [EntitlementFeature.Stig]: T('STIG and FIPS'),
  [EntitlementFeature.TrueSearch]: T('TrueSearch'),
  [EntitlementFeature.Webshare]: T('Webshare'),
};

export function getLabelForTncFeature(name: string): string {
  return entitlementFeatureLabels[name] ?? getLabelForLicenseFeature(name);
}

export function getTncFeatureUrgency(daysLeft: number | null): TncFeaturesUrgency {
  if (daysLeft === null || daysLeft > tncExpiringDays) {
    return TncFeaturesUrgency.Active;
  }
  if (daysLeft < 0) {
    return TncFeaturesUrgency.Expired;
  }
  if (daysLeft <= tncCriticalDays) {
    return TncFeaturesUrgency.Critical;
  }
  return TncFeaturesUrgency.Expiring;
}

/**
 * The features a Community system has because of its TrueNAS Connect subscription.
 *
 * A COMMUNITY license is the one TrueNAS Connect installs; iX never issues one for an
 * appliance. What it carries is what the subscription grants, less what middleware still
 * denies on this hardware — a key the matrix cannot honour here is not a feature the user has.
 * SUPPORT is left to the Support card, which already counts down its contract.
 *
 * `null` when the system has no subscription-provided license at all.
 */
export function getTncFeaturesSummary(
  license: License | null,
  entitlements: EntitlementMap | null,
  nowMs: number,
): TncFeaturesSummary | null {
  if (license?.type !== LicenseType.Community) {
    return null;
  }

  // License keys and entitlement keys share their spelling but not their TypeScript enum.
  const decisions: Partial<Record<string, EntitlementEntry>> = entitlements ?? {};
  const features = license.features
    .filter((feature) => feature.name !== LicenseFeature.Support)
    .filter((feature) => decisions[feature.name]?.entitled !== false)
    .map((feature): TncFeature => {
      const daysLeft = getDaysUntilLicenseExpiration(feature.expires_at, nowMs);
      return {
        name: feature.name,
        label: getLabelForTncFeature(feature.name),
        expiresAt: feature.expires_at,
        daysLeft,
        urgency: getTncFeatureUrgency(daysLeft),
      };
    })
    .sort((a, b) => b.urgency - a.urgency || a.label.localeCompare(b.label));

  if (!features.length) {
    return null;
  }

  const soonest = features
    .filter((feature) => feature.daysLeft !== null)
    .reduce<TncFeature | null>((min, feature) => {
      return !min || (feature.daysLeft as number) < (min.daysLeft as number) ? feature : min;
    }, null);

  return {
    features,
    urgency: soonest?.urgency ?? TncFeaturesUrgency.Active,
    soonest,
  };
}
