import { PoolTopologyCategory } from 'app/enums/pool-topology-category.enum';
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
}

export interface EnclosureElementData {
  Descriptor: string;
  Device?: string;
  Status: string; // Enum: OK
  Value: string;
}

export interface EnclosureSlot {
  isSelected: boolean;
  disk?: Disk;
  diskStatus?: string;
  enclosure: number | null;
  slot: number | null;
  slotStatus?: string;
  topologyStatus?: string; // TopologyItemStatus;
  topologyStats?: TopologyItemStats;
  fault: boolean;
  identify: boolean;
  pool?: string | null;
  topologyCategory?: PoolTopologyCategory | null;
  vdev?: TopologyItem | null;
}

export interface EnclosureView {
  isController: boolean;
  isRackmount: boolean;
  slots: EnclosureSlot[];
  number: number;
  model: string;
  isSelected: boolean;
  expanders?: EnclosureElement[];
}

export interface SelectedEnclosureSlot {
  selected: EnclosureSlot;
  vdevSlots: EnclosureSlot[]; // All members including selected
}
