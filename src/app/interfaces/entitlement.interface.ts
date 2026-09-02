import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { EntitlementReason } from 'app/enums/entitlement-reason.enum';

export interface EntitlementEntry {
  entitled: boolean;
  reason: EntitlementReason;
  /** Server-supplied explanation, empty when entitled. English only — middleware has no i18n. */
  message: string;
}

/** Wire shape of `truenas.entitlements.info`. Keys stay open: middleware adds them over releases. */
export interface EntitlementsInfo {
  features: Record<string, EntitlementEntry>;
}

/**
 * `Partial` is load-bearing. A non-partial `Record` accepts the wire type without complaint
 * and then types every lookup as defined, so a missing key throws at runtime — and middleware
 * legitimately omits keys, since an absent one means "not gated".
 */
export type EntitlementMap = Partial<Record<EntitlementFeature, EntitlementEntry>>;
