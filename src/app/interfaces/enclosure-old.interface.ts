import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { EnclosureElement, EnclosureSlotMetadata, EnclosureVdevDisk } from 'app/interfaces/enclosure.interface';

/**
 * @deprecated
 */
export interface EnclosureOld {
  number?: number; // Provided by UI
  rackmount: boolean;
  top_loaded: boolean;
  front_slots: number;
  rear_slots: number;
  internal_slots: number;
  controller: boolean;
  elements: EnclosureOldElements;
  id: string;
  label: string;
  model: string;
  name: string;
  dmi?: string;
  status?: string[];
  vendor?: string;
  product?: string;
  revision?: string;
  bsg?: string;
  sg?: string;
  pci?: string;
}

/**
 * @deprecated
 */
export interface EnclosureOldElements {
  'Array Device Slot': Record<number, EnclosureOldSlot>;
  'SAS Expander'?: Record<number, EnclosureElement>;
  Enclosure?: Record<number, EnclosureElement>;
  Temperature?: Record<number, EnclosureElement>;
  'Voltage Sensor'?: Record<number, EnclosureElement>;
  Cooling?: Record<number, EnclosureElement>;
}

/**
 * @deprecated
 */
export interface EnclosureOldSlot {
  descriptor: string;
  status: string;
  dev: string;
  original?: EnclosureSlotMetadata;
  name: string;
  size: number;
  model: string;
  serial: string;
  advpowermgmt: DiskPowerLevel;
  togglesmart: boolean;
  smartoptions: string;
  transfermode: string;
  hddstandby: DiskStandby;
  description: string;
  rotationrate: number;
  read_errors?: number;
  write_errors?: number;
  checksum_errors?: number;
  pool_info?: EnclosureOldPool | null;
}

/**
 * @deprecated
 */
export interface EnclosureOldPool {
  pool_name: string;
  disk_status: string;
  vdev_name: string;
  vdev_type: string;
  vdev_disks: EnclosureVdevDisk[];
}
