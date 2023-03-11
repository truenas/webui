import { PoolTopologyCategory } from 'app/enums/pool-topology-category.enum';
import { Disk, TopologyItem } from './storage.interface';

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
  disk?: Disk;
  enclosure: number | null;
  slot: number | null;
  pool?: string | null;
  topologyCategory?: PoolTopologyCategory | null;
  vdev?: TopologyItem | null;
}

export interface EnclosureView {
  isController: boolean;
  slots: EnclosureSlot[];
  number: number;
  model: string;
}
