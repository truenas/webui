import { LicenseFeature } from 'app/enums/license-feature.enum';
import { LicenseType } from 'app/enums/license-type.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';

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
 * `start_date` and `expires_at` are ISO date strings (`YYYY-MM-DD`) or null.
 * The `Support` entry, when present, carries the contract dates surfaced on
 * the support card; other features may have null dates.
 */
export interface LicenseFeatureInfo {
  name: LicenseFeature;
  start_date: string | null;
  expires_at: string | null;
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
  expires_at: string | null;
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

export function getLabelForContractType(contractType: ContractType | null | undefined): string {
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
  return contractTypeToLabelsMap[contractType] || contractType;
}
