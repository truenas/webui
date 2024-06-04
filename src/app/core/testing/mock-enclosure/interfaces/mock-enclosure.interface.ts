import { AddEnclosureOptions, AddTopologyOptions, AddUnAssignedOptions } from 'app/core/testing/mock-enclosure/interfaces/mock-storage-generator.interface';
import { EnclosureOld } from 'app/interfaces/enclosure-old.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { Disk } from 'app/interfaces/storage.interface';

export interface MockEnclosureConfigItem {
  enabled: boolean;
  query?: EnclosureOld[] | Disk[] | Pool; // A snapshot of the query data from real machine
}

/*
* MockEnclosure
* If overflowShelf is set to true and there are more disks
* than the controller supports, a mock shelf will be generated
* and extra disks will be assigned to that shelf
*
* Unlike with Pools and Disks, the query property snapshot
* should be that of an empty chassis
* */
export interface MockEnclosure extends MockEnclosureConfigItem {
  overflowShelf: boolean;
  overflowShelfModel: string;
}

export interface MockDiskOptions extends MockEnclosureConfigItem {
  enabled: boolean;
  topologyOptions: AddTopologyOptions;
  mockPools: boolean;
  unassignedOptions: AddUnAssignedOptions;
}

export interface MockEnclosureConfig {
  enabled: boolean;
  mockEnclosure: boolean;
  enclosureOptions: AddEnclosureOptions;
  systemProduct: string;
  diskOptions?: MockDiskOptions;
}
