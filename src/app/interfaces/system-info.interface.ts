import { Codename } from 'app/enums/codename.enum';
import { LicenseFeature } from 'app/enums/license-feature.enum';
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
  license: SystemLicense;
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
  remote_info?: SystemInfo;
  codename: Codename;
}

export interface SystemLicense {
  addhw: unknown[];
  addhw_detail: unknown[];
  contract_end: ApiDate;
  contract_start: ApiDate;
  contract_type: ContractType;
  customer_name: string;
  expired: boolean;
  features: LicenseFeature[];
  legacy_contract_hardware: unknown;
  legacy_contract_software: unknown;
  model: string;
  system_serial: string;
  system_serial_ha: string;
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

export function getLabelForContractType(contractType: ContractType): string {
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
