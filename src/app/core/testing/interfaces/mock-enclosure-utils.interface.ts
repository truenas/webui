import { Enclosure } from 'app/interfaces/enclosure.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { AddEnclosureOptions } from './mock-storage-generator.interface';

export interface MockEnclosureConfigItem {
  enabled: boolean;
  query?: Enclosure[] | Disk[] | Pool; // A snapshot of the query data from real machine
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

export interface MockDisk extends MockEnclosureConfigItem {
  useRealDisks: boolean;
}

export interface MockEnclosureConfig {
  enabled: boolean;
  enclosureOptions: AddEnclosureOptions;
  systemProduct: string;
}
