import { Overwrite } from 'utility-types';
import { DiskType } from 'app/enums/disk-type.enum';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';
import {
  EnclosureStatus,
  EnclosureDiskStatus,
  EnclosureElementType,
  DriveBayLightStatus,
} from 'app/enums/enclosure-slot-status.enum';
import { VdevType } from 'app/enums/v-dev-type.enum';

export interface Enclosure {
  name: string;
  model: EnclosureModel;
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
  front_loaded: boolean;
  front_slots: number;
  rear_slots: number;
  top_slots: number;
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
  is_front: boolean;
  is_top: boolean;
  is_rear: boolean;
  is_internal: boolean;
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
  value: string | null;
  value_raw?: number | string;
}

export type DashboardEnclosure = Overwrite<Enclosure, {
  elements: DashboardEnclosureElements;
}>;

export interface DashboardEnclosureSlot {
  /**
   * `drive_bay_number` is not an index and starts from 1
   */
  drive_bay_number: number;
  descriptor: string;
  status: EnclosureStatus;
  dev: string | null;
  supports_identify_light: boolean;
  drive_bay_light_status: DriveBayLightStatus | null;
  size: number | null;
  model: string | null;
  is_top: boolean;
  is_front: boolean;
  is_rear: boolean;
  is_internal: boolean;
  serial: string | null;
  type: DiskType | null;
  rotationrate: number | null;
  pool_info: EnclosureSlotPoolInfo | null;
}

export interface EnclosureVdevDisk {
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
  vdev_disks: EnclosureVdevDisk[];
}

export type DashboardEnclosureElements = Overwrite<EnclosureElements, {
  [EnclosureElementType.ArrayDeviceSlot]: Record<number, DashboardEnclosureSlot>;
}>;

export interface SetDriveBayLightStatus {
  enclosure_id: string;
  slot: number;
  status: DriveBayLightStatus;
}
