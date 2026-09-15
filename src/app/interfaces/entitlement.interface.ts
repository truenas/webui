import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { EntitlementReason } from 'app/enums/entitlement-reason.enum';
import { HardwareType } from 'app/enums/hardware-type.enum';

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

/** Wire shape of `truenas.entitlements.facts`: the facts entitlement decisions are computed from. */
export interface EntitlementFacts {
  hardware_type: HardwareType;
  /**
   * Name of the installed iX-issued license type (see `LicenseType`), `null` without one.
   * Left as a plain string by middleware so a newer license type does not fail validation.
   */
  license_type: string | null;
}

/**
 * `Partial` is load-bearing. A non-partial `Record` accepts the wire type without complaint
 * and then types every lookup as defined, so a missing key throws at runtime — and middleware
 * legitimately omits keys, since an absent one means "not gated".
 */
export type EntitlementMap = Partial<Record<EntitlementFeature, EntitlementEntry>>;
