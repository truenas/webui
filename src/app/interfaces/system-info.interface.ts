import { LicenseFeature } from 'app/enums/license-feature.enum';
import { ApiDate, ApiTimestamp } from 'app/interfaces/api-date.interface';

export interface SystemInfo {
  birthday: ApiTimestamp;
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
}

export interface SystemLicense {
  addhw: unknown[];
  addhw_detail: unknown[];
  contract_end: ApiDate;
  contract_start: ApiDate;
  contract_type: string;
  customer_name: string;
  expired: boolean;
  features: LicenseFeature[];
  legacy_contract_hardware: unknown;
  legacy_contract_software: unknown;
  model: string;
  system_serial: string;
  system_serial_ha: string;
}
