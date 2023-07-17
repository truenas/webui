import { EnclosureSlotTopologyStatus } from 'app/enums/enclosure-slot-status.enum';
import { VdevType } from 'app/enums/v-dev-type.enum';
import { Disk, TopologyItem, TopologyItemStats } from './storage.interface';

export interface Enclosure {
  controller: boolean;
  elements: EnclosureElementsGroup[] | EnclosureElement[];
  id: string;
  label: string;
  model: string;
  name: string;
  number: number;
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
  fault: boolean;
  identify: boolean;
  pool?: string | null;
  topologyCategory?: VdevType | null;
  vdev?: TopologyItem | null;
}

export interface EnclosureView {
  isController: boolean;
  isRackmount: boolean;
  slots: EnclosureSlot[];
  number: number;
  model: string;
  expanders?: EnclosureElement[];
  pools?: string[];
}

export interface SelectedEnclosureSlot {
  selected: EnclosureSlot;
  vdevSlots: EnclosureSlot[]; // All members including selected
}
