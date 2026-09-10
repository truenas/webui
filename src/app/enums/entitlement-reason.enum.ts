/**
 * Why a feature was granted or denied. Middleware may add values, so treat an unrecognized
 * one as a generic denial.
 *
 * `NoLicense` and `KeyMissing` differ in what to offer the user: nothing is installed
 * versus a licence that does not carry this feature.
 */
export enum EntitlementReason {
  Entitled = 'ENTITLED',
  NoLicense = 'NO_LICENSE',
  KeyMissing = 'KEY_MISSING',
  WrongHardware = 'WRONG_HARDWARE',
  TierInsufficient = 'TIER_INSUFFICIENT',
  WrongLicenseType = 'WRONG_LICENSE_TYPE',
  NotGated = 'NOT_GATED',
}
