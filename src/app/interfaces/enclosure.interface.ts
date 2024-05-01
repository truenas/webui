import { Overwrite } from 'utility-types';
import { VdevType } from 'app/enums/v-dev-type.enum';

export interface Enclosure {
  name: string;
  model: string;
  controller: boolean;
  dmi: string;
  status: string;
  id: string;
  vendor: string;
  product: string;
  revision: string;
  bsg: string;
  sg: string;
  pci: string;
  rackmount: boolean;
  top_loaded: boolean;
  front_slots: number;
  rear_slots: number;
  internal_slots: number;
  elements: EnclosureElements;
  label: string;
}

export interface EnclosureSlot {
  descriptor: string;
  status: string;
  value: unknown;
  value_raw: number;
  dev: string;
  supports_identify_light: boolean;
  original: EnclosureSlotMetadata;
}

export interface EnclosureSlotMetadata {
  enclosure_id: string;
  enclosure_sg: string;
  enclosure_bsg: string;
  descriptor: string;
  slot: number;
}

export interface EnclosureElements {
  'Array Device Slot': Record<number, EnclosureSlot>;
  'SAS Expander'?: Record<number, EnclosureElement>;
  'Enclosure'?: Record<number, EnclosureElement>;
  'Temperature'?: Record<number, EnclosureElement>;
  'Voltage Sensor'?: Record<number, EnclosureElement>;
  'Cooling'?: Record<number, EnclosureElement>;
}

export interface EnclosureElement {
  descriptor: string;
  status: string;
  value: string;
  value_raw: number;
}

export type DashboardEnclosure = Overwrite<Enclosure, {
  elements: DashboardEnclosureElements;
}>;

export interface DashboardEnclosureSlot {
  descriptor: string;
  status: string; // TODO: Enum?
  dev: string;
  supports_identify_light: boolean;
  size: number;
  model: string;
  serial: string;
  type: string; // TODO: Enum HDD,
  rotationrate: number;
  pool_info: EnclosureSlotPoolInfo | null;
}

export interface EnclosureVdev {
  enclosure_id: string;
  slot: number;
  dev: string;
}

export interface EnclosureSlotPoolInfo {
  pool_name: string;
  disk_status: string; // TODO: Enum: ONLINE,
  disk_read_errors: number;
  disk_write_errors: number;
  disk_checksum_errors: number;
  vdev_name: string;
  vdev_type: VdevType;
  vdev_disks: EnclosureVdev[];
}

export type DashboardEnclosureElements = Overwrite<EnclosureElements, {
  'Array Device Slot': Record<number, DashboardEnclosureSlot>;
}>;
