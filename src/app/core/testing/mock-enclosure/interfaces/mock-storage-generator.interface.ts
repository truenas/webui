import { MockStorageScenarioOld } from 'app/core/testing/mock-enclosure/enums/mock-storage.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { EnclosureOld } from 'app/interfaces/enclosure-old.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { TopologyItem } from 'app/interfaces/storage.interface';

/**
 * @deprecated
 */
export interface MockStorage {
  poolState: Pool;
  disks: Disk[];
  enclosures?: EnclosureOld[] | null;
}

/**
 * @deprecated
 */
export interface MockTopology {
  topologyItems: TopologyItem[];
  disks: Disk[];
}

/**
 * @deprecated
 */
export interface AddUnAssignedOptions {
  diskSize: number;
  repeats: number;
}

/**
 * @deprecated
 */
export interface AddTopologyOptions extends AddUnAssignedOptions {
  scenario: MockStorageScenarioOld;
  layout: TopologyItemType;
  width: number;
}
