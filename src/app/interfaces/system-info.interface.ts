import { LicenseFeature } from 'app/enums/license-feature.enum';
import { LicenseType } from 'app/enums/license-type.enum';
import { ApiDate, ApiTimestamp } from 'app/interfaces/api-date.interface';

// TODO: Split mixed interface for system.info and webui.main.dashboard.sys_info
export interface SystemInfo {
  platform: string;
  boottime: ApiTimestamp;
  buildtime: ApiTimestamp;
  cores: number;
  datetime: ApiTimestamp;
  ecc_memory: boolean;
  hostname: string;
  license: License | null;
  loadavg: [number, number, number];
  model: string;
  physical_cores: number;
  physmem: number;
  system_manufacturer: string;
  system_product: string;
  system_product_version: string;
  system_serial: string;
  timezone: string;
  uptime: string;
  uptime_seconds: number;
  version: string;
  remote_info: SystemInfo | null;
}

/**
 * Per-feature license entry.
 *
 * Dates are wrapped in the `ApiDate` envelope (`{ $type: 'date', $value: 'YYYY-MM-DD' }`)
 * or null. The `Support` entry, when present, carries the contract dates surfaced on
 * the support card; other features may have null dates.
 */
export interface LicenseFeatureInfo {
  name: LicenseFeature;
  start_date: ApiDate | null;
  expires_at: ApiDate | null;
}

/**
 * Normalized license payload returned by `truenas.license.info`.
 *
 * Middleware always returns this shape (legacy on-disk licenses are
 * pre-normalized; their `id` is prefixed with `legacy_`). The UI does not
 * need to handle the historical `system.license` shape.
 */
export interface License {
  id: string;
  type: LicenseType;
  contract_type: ContractType | null;
  model: string | null;
  expires_at: ApiDate | null;
  features: LicenseFeatureInfo[];
  serials: string[];
  enclosures: Record<string, number>;
}

export enum ContractType {
  Gold = 'GOLD',
  SilverInternational = 'SILVERINTERNATIONAL',
  Legacy = 'LEGACY',
  Standard = 'STANDARD',
  Bronze = 'BRONZE',
  Silver = 'SILVER',
  FreeNasCertified = 'FREENASCERTIFIED',
  FreeNasMini = 'FREENASMINI',
}

export function getLabelForContractType(contractType: ContractType | string | null | undefined): string {
  if (!contractType) {
    return '';
  }

  const contractTypeToLabelsMap: Record<ContractType, string> = {
    [ContractType.Gold]: 'Gold',
    [ContractType.Legacy]: 'Legacy',
    [ContractType.Standard]: 'Standard',
    [ContractType.Bronze]: 'Bronze',
    [ContractType.Silver]: 'Silver',
    [ContractType.FreeNasCertified]: 'Free NAS Certified',
    [ContractType.FreeNasMini]: 'Free NAS Mini',
    [ContractType.SilverInternational]: 'Silver International',
  };
  // For values not in the known set (e.g. a future PLATINUM tier), fall back
  // to the raw string so we surface something useful instead of an empty cell.
  return contractTypeToLabelsMap[contractType as ContractType] ?? contractType;
}
