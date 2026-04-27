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
  /** Pre-formatted expiration date for display, or null when unavailable. */
  expirationDate: string | null;
  /** Days until contract end. Negative when expired. */
  daysLeftInContract: number | null;
  /** Comma-joined feature list, or 'NONE'. SUPPORT is omitted (surfaced via contract type). */
  featuresString: string;
  /** Comma-joined list of `count× model` pairs from `enclosures`, or null. */
  additionalHardware: string | null;
  /** All system serials from the license payload. */
  serials: string[];
}
