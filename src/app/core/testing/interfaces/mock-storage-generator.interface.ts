import { EnclosureDispersalStrategy, MockStorageScenario } from 'app/core/testing/enums/mock-storage.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { EnclosureUi } from 'app/interfaces/enclosure.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { Disk, TopologyItem } from 'app/interfaces/storage.interface';

export interface MockStorage {
  poolState: Pool;
  disks: Disk[];
  enclosures?: EnclosureUi[] | null;
}

export interface MockTopology {
  topologyItems: TopologyItem[];
  disks: Disk[];
}

export interface AddUnAssignedOptions {
  diskSize: number;
  repeats: number;
}

export interface AddTopologyOptions extends AddUnAssignedOptions {
  scenario: MockStorageScenario;
  layout: TopologyItemType;
  width: number;
}

export interface DispersedData {
  enclosures: EnclosureUi[];
  disks: Disk[];
}

export interface AddEnclosureOptions {
  controllerModel: string;
  expansionModels: string[];
  dispersal: EnclosureDispersalStrategy;
}
