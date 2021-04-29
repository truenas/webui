// As returned by pool.query under topology[<vdevtype>]
export interface VDev {
  type: string;
  path: string;
  guid: string;
  status: string;
  children: this[];
  device?: string;
  disk?: string;
  unavail_disk: any;
  stats: VDevStats;
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
  acousticlevel: string;
  advpowermgmt: string;
  critical: string;
  description: string;
  devname: string;
  difference: string;
  enclosure: EnclosureSlot;
  expiretime: string;
  hddstandby: string;
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
  togglesmart: string;
  transfermode: string;
  type: string;
  zfs_guid: string;
}
