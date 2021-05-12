import { DiskAcousticLevel } from 'app/enums/disk-acoustic-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';

// As returned by pool.query under topology[<vdevtype>]
export interface VDev {
  type: string;
  path: string;
  guid: string;
  status: string;
  children: this[];
  unavail_disk: any;
  stats: VDevStats;

  // TODO: These fields are not present in pool.query response
  device?: string;
  disk?: string;
}

export interface VDevStats {
  timestamp: number;
  read_errors: number;
  write_errors: number;
  checksum_errors: number;
  ops: number[];
  bytes: number[];
  size: number;
  allocated: number;
  fragmentation: number;
  self_healed: number;
  configured_ashift: number;
  logical_ashift: number;
  physical_ashift: number;
}

// As returned by enclosure.query
export interface Enclosure {
  controller: boolean;
  elements: any[]; // Requires types for nested properties
  id: string;
  label: string;
  model: string;
  name: string;
  number: number;
}

// As returned by disk.query
export interface EnclosureSlot {
  number: number;
  slot: number;
}

export interface Disk {
  acousticlevel: DiskAcousticLevel;
  advpowermgmt: DiskPowerLevel;
  critical: string;
  description: string;
  devname: string;
  difference: string;
  enclosure: EnclosureSlot;
  expiretime: string;
  hddstandby: DiskStandby;
  hddstandby_force: string;
  identifier: string;
  informational: string;
  model: string;
  multipath_member: string;
  multipath_name: string;
  name: string;
  number: number;
  pool: string;
  rotationrate: number;
  serial: string;
  size: number;
  smartoptions: string;
  subsystem: string;
  togglesmart: boolean;
  transfermode: string;
  type: string;
  zfs_guid: string;
}

/**
 * Additional disk query options
 */
export interface DiskQueryOptions {
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
}

export interface DiskUpdate {
  togglesmart?: boolean;
  acousticlevel: DiskAcousticLevel;
  advpowermgmt?: DiskPowerLevel;
  description?: string;
  hddstandby?: DiskStandby;
  hddstandby_force?: boolean;
  passwd?: string;
  smartoptions?: string;
  critical?: number;
  difference?: number;
  informational?: number;
  enclosure?: EnclosureSlot;
}
