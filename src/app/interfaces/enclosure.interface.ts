import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { EnclosureSlotTopologyStatus } from 'app/enums/enclosure-slot-status.enum';
import { VdevType } from 'app/enums/v-dev-type.enum';
import { Disk, TopologyItem, TopologyItemStats } from './storage.interface';

// DEPRECATED
// TODO: Remove deprecated interfaces once mock templates have been updated
export interface Enclosure {
  controller: boolean;
  elements: EnclosureElementsGroup[] | EnclosureElement[];
  id: string;
  label: string;
  model: string;
  name: string;
  number?: number; // UI adds this
}

export interface EnclosureElementsGroup {
  descriptor: string;
  elements: EnclosureElement[];
  has_slot_status: boolean;
  header: string[];
  name: string;
}

export interface EnclosureElement {
  data: EnclosureElementData;
  descriptor: string;
  fault?: boolean;
  identify?: boolean;
  name: string;
  slot: number;
  status: string; // Enum: OK
  value: string;
  value_raw: string;
  original?: EnclosureElementOriginal;
}

export interface EnclosureElementData {
  Descriptor: string;
  Device?: string;
  Status: string; // Enum: OK
  Value: string;
}

export interface EnclosureElementOriginal {
  enclosure_id: string;
  slot: number;
}

export interface EnclosureSlot {
  isSelected: boolean;
  disk?: Disk;
  diskStatus?: string;
  enclosure: number | null;
  slot: number | null;
  slotStatus?: string;
  topologyStatus?: EnclosureSlotTopologyStatus;
  topologyStats?: TopologyItemStats;
  fault?: boolean; // TODO: Deprecated
  identify?: boolean; // TODO Deprecated
  pool?: string | null;
  topologyCategory?: VdevType | null;
  vdev?: TopologyItem | null;
}

export interface EnclosureView {
  isController: boolean;
  isRackmount: boolean;
  hasSlotStatus: boolean;
  slots: EnclosureSlot[];
  number: number;
  model: string;
  expanders?: EnclosureElement[];
  pools?: string[];
}
// END OF DEPRECATED

// NEW
export interface EnclosureUi {
  number?: number; // Provided by UI
  rackmount: boolean;
  top_loaded: boolean;
  front_slots: number;
  rear_slots: number;
  internal_slots: number;
  controller: boolean;
  elements: EnclosureUiElements;
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

export interface EnclosureUiElements {
  'Array Device Slot': Record<number, EnclosureUiSlot>;
  'SAS Expander'?: Record<number, EnclosureUiElement>;
  'Enclosure'?: Record<number, EnclosureUiElement>;
  'Temperature'?: Record<number, EnclosureUiElement>;
  'Voltage Sensor'?: Record<number, EnclosureUiElement>;
  'Cooling'?: Record<number, EnclosureUiElement>;
}

export interface EnclosureUiElement {
  descriptor: string;
  status: string;
  value: string;
  value_raw: number;
}

export interface EnclosureUiSlot {
  descriptor: string;
  status: string;
  dev: string;
  original?: EnclosureUiSlotMetadata;
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
  pool_info: EnclosureUiPool | null;
}

export interface EnclosureUiPool {
  pool_name: string;
  disk_status: string;
  vdev_name: string;
  vdev_type: string;
  vdev_disks: EnclosureUiVdev[];
}

export interface EnclosureUiVdev {
  enclosure_id: string;
  slot: number;
  dev: string;
}

export interface EnclosureUiSlotMetadata {
  enclosure_id: string;
  enclosure_sg: string;
  enclosure_bsg: string;
  descriptor: string;
  slot: number;
}

export interface SelectedEnclosureSlot {
  slotNumber: number;
  slotDetails: EnclosureUiSlot;
  enclosureId: string;
}

export interface DiskEnclosureInfo {
  enclosure: number;
  slot: number;
}
