import { Overwrite } from 'utility-types';
import { DiskType } from 'app/enums/disk-type.enum';
import { EnclosureStatus, EnclosureDiskStatus, EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { VdevType } from 'app/enums/v-dev-type.enum';

export interface Enclosure {
  number?: number; // Provided by old UI
  name: string;
  model: string;
  controller: boolean;
  dmi: string;
  status: EnclosureStatus[];
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

export type EnclosureElements = {
  [key in EnclosureElementType]?: Record<number, EnclosureElement>;
} & {
  [EnclosureElementType.ArrayDeviceSlot]: Record<number, EnclosureSlot>;
};

export interface EnclosureElement {
  descriptor: string;
  status: string;
  value?: string;
  value_raw?: number;
}

export type DashboardEnclosure = Overwrite<Enclosure, {
  elements: DashboardEnclosureElements;
}>;

export interface DashboardEnclosureSlot {
  drive_bay_number?: number;
  descriptor: string;
  status: string;
  dev: string;
  supports_identify_light?: boolean;
  size?: number;
  model?: string;
  serial?: string;
  type?: DiskType;
  rotationrate?: number;
  pool_info: EnclosureSlotPoolInfo | null;
}

export interface EnclosureVdev {
  enclosure_id: string;
  slot: number;
  dev: string;
}

export interface EnclosureSlotPoolInfo {
  pool_name: string;
  disk_status: EnclosureDiskStatus;
  disk_read_errors?: number;
  disk_write_errors?: number;
  disk_checksum_errors?: number;
  vdev_name: string;
  vdev_type: VdevType;
  vdev_disks: EnclosureVdev[];
}

export type DashboardEnclosureElements = Overwrite<EnclosureElements, {
  [EnclosureElementType.ArrayDeviceSlot]: Record<number, DashboardEnclosureSlot>;
}>;
