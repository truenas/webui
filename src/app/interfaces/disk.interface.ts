import { CallResponse } from '@truenas/api-client';
import { DiskBus } from 'app/enums/disk-bus.enum';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { DiskType } from 'app/enums/disk-type.enum';
import { SedStatus } from 'app/enums/sed-status.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { EnclosureAndSlot, TemperatureAgg } from 'app/interfaces/storage.interface';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

export interface Disk {
  advpowermgmt: DiskPowerLevel;
  bus: DiskBus;
  description: string;
  devname: string;
  expiretime: string;
  hddstandby: DiskStandby;
  identifier: string;
  lunid?: string;
  model: string;
  name: string;
  number: number;
  passwd?: string;
  pool: string;
  rotationrate: number | null;
  serial: string;
  size: number;
  subsystem: string;
  transfermode: string;
  type: DiskType;
  zfs_guid: string;
  sed?: boolean | null;
  sed_status?: SedStatus;
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
     * Will include SED status for each disk.
     */
    sed_status?: boolean;
  };
}

export interface DiskUpdate {
  advpowermgmt?: DiskPowerLevel;
  description?: string;
  hddstandby?: DiskStandby;
  passwd?: string;
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
  rotationrate: number | null;
  sed_status?: SedStatus;
  stripesize: number;
  parts: unknown[];
  dif: boolean;
  exported_zpool: string | null;
  unsupported_md_devices: unknown;
  duplicate_serial: string[];
  devname: string;
  partitions: {
    path: string;
  }[];
  enclosure: EnclosureAndSlot | Record<string, never>;
  vendor: string;
  imported_zpool: string;
}

export type DiskTemperatures = Record<string, number | null>;
export type DiskTemperatureAgg = Record<string, TemperatureAgg>;

export interface DiskDetailsParams {
  join_partitions?: boolean;
  type?: string;
}

export interface DiskDetailsResponse {
  used: DetailsDisk[];
  unused: DetailsDisk[];
}

/**
 * Reads a `disk.query` row into `Disk`. Middleware types `bus`, `type`, the power settings and the SED status as
 * plain strings the UI narrows to its enums; it describes the same object.
 */
export function toDisk(disk: WebUiQueryEntity<'disk.query'>): Disk {
  return disk as Disk;
}

/**
 * Reads `disk.details` called without a `type`: the used/unused split. Middleware declares the response loosely
 * because its shape depends on `type`, so there is nothing in the generated type to check this against.
 */
export function toDiskDetails(response: CallResponse<WebUiApiDirectory, 'disk.details'>): DiskDetailsResponse {
  return response as unknown as DiskDetailsResponse;
}
