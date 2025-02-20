import { DiskBus } from 'app/enums/disk-bus.enum';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { DiskType } from 'app/enums/disk-type.enum';
import { DiskWipeMethod } from 'app/enums/disk-wipe-method.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { SmartTestResult } from 'app/interfaces/smart-test.interface';
import { EnclosureAndSlot, TemperatureAgg } from 'app/interfaces/storage.interface';

export interface Disk {
  advpowermgmt: DiskPowerLevel;
  bus: DiskBus;
  critical: number;
  description: string;
  devname: string;
  difference: number;
  duplicate_serial: string[];
  expiretime: string;
  hddstandby: DiskStandby;
  identifier: string;
  informational: number;
  lunid?: string;
  model: string;
  name: string;
  number: number;
  passwd?: string;
  pool: string;
  rotationrate: number;
  serial: string;
  size: number;
  subsystem: string;
  supports_smart?: boolean;
  togglesmart: boolean;
  transfermode: string;
  type: DiskType;
  zfs_guid: string;
  tests?: SmartTestResult[];
}

export interface StorageDashboardDisk extends Disk {
  alerts: Alert[];
  tempAggregates: TemperatureAgg;
}

/**
 * Additional disk query options
 */
export interface ExtraDiskQueryOptions {
  extra?: {
    /**
     * Will also include expired disks.
     */
    include_expired?: boolean;

    /**
     * Will not hide KMIP password for the disks.
     */
    passwords?: boolean;

    /**
     * Will join pool name for each disk.
     */
    pools?: boolean;

    /**
     * Can be used for single disk query only.
     * Prefer to use `smart.test.disk_choices` for multiple disks
     */
    supports_smart?: boolean;
  };
}

export interface DiskUpdate {
  togglesmart?: boolean;
  advpowermgmt?: DiskPowerLevel;
  description?: string;
  hddstandby?: DiskStandby;
  passwd?: string;
  critical?: number;
  difference?: number;
  informational?: number;
  number?: number;
  pool?: string;
}

export interface DetailsDisk {
  identifier: string;
  name: string;
  sectorsize: number;
  number: number;
  subsystem: string;
  driver: string;
  hctl: string;
  size: number;
  mediasize: number;
  ident: string;
  serial: string;
  model: string;
  descr: string;
  lunid: string;
  bus: DiskBus;
  type: DiskType;
  blocks: number;
  serial_lunid: string;
  rotationrate: number;
  stripesize: number;
  parts: unknown[];
  dif: boolean;
  exported_zpool: string;
  unsupported_md_devices: unknown;
  duplicate_serial: unknown[];
  devname: string;
  partitions: {
    path: string;
  }[];
  enclosure?: EnclosureAndSlot;
  vendor: string;
  imported_zpool: string;
}

export type DiskWipeParams = [
  disk: string,
  method: DiskWipeMethod,
];
export type DiskTemperatures = Record<string, number | null>;
export type DiskTemperatureAgg = Record<string, TemperatureAgg>;

export interface DiskDetailsParams {
  join_partitions?: boolean;
}

export interface DiskDetailsResponse {
  used: DetailsDisk[];
  unused: DetailsDisk[];
}
