import { ContractType } from 'app/interfaces/system-info.interface';

/**
 * Support-card view-model derived from a normalized `License`. Built once in
 * the support-card component and consumed by `ix-sys-info` for display.
 *
 * Fields with no equivalent on the new license shape (e.g. `customer_name`)
 * are intentionally omitted — the rows that depended on them are removed from
 * the template.
 */
export interface LicenseInfoInSupport {
  contractType: ContractType | null;
  model: string | null;
  /**
   * Pre-formatted expiration date string for display (already run through the
   * user's preferred date format and the UTC-stable formatter). `null` when no
   * expiration is set on either the SUPPORT feature or the top-level license.
   */
  expirationDateDisplay: string | null;
  /** Days until contract end. Negative when expired. */
  daysLeftInContract: number | null;
  /**
   * Feature names with `Support` filtered out (it is surfaced via the contract
   * type row instead). The template renders the comma-joined list or a
   * translated `'NONE'` placeholder.
   */
  featureNames: string[];
  /** Comma-joined list of `count× model` pairs from `enclosures`, or null. */
  additionalHardware: string | null;
  /** All system serials from the license payload. */
  serials: string[];
}
