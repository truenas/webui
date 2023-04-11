import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { ApiMethod } from 'app/interfaces/api-directory.interface';
import { IncomingWebsocketMessage, ResultMessage } from 'app/interfaces/api-message.interface';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { AddEnclosureOptions, EnclosureDispersalStrategy, MockStorageGenerator } from './mock-storage-generator.utils';

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
  enclosureOptions: AddEnclosureOptions;
  systemProduct: string;
}

export class MockEnclosureUtils {
  mockConfig: MockEnclosureConfig;
  mockM40: MockEnclosureConfig = {
    enclosureOptions: {
      controllerModel: 'M40',
      expansionModels: [],
      dispersal: EnclosureDispersalStrategy.Default,
    },
    systemProduct: 'TRUENAS-M40',
  };
  mockMini: MockEnclosureConfig = {
    enclosureOptions: {
      controllerModel: 'MINI-3.0-XL+',
      expansionModels: [],
      dispersal: EnclosureDispersalStrategy.Default,
    },
    systemProduct: 'FREENAS-MINI-3.0-XL+',
  };
  mockStorage: MockStorageGenerator;

  constructor(config: MockEnclosureConfig) {
    this.mockConfig = config;
    // this.mockConfig = this.mockMini;
    // this.mockConfig = this.mockM40;
    this.mockStorage = new MockStorageGenerator();
    this.mockStorage.addEnclosures(this.mockConfig.enclosureOptions);
  }

  overrideMessage<K extends ApiMethod>(data: ResultMessage, method: K): ResultMessage {
    if (method === 'disk.query' && Object.keys(data.result as Disk[]).length < 3) {
      console.warn({
        message: 'DISKS DATA WARNING: Not enough properties',
        keys: Object.keys(data.result as Disk[]),
      });
    }
    // const uuid = UUID.UUID();
    let mockData: unknown = data.result;
    mockData = this.enclosureOverrides(data.result, method);
    const mockMessage: IncomingWebsocketMessage = {
      id: data.id,
      msg: data.msg,
      result: mockData,
    };
    return mockMessage;
  }

  private enclosureOverrides<K extends ApiMethod>(data: unknown, method: K): unknown {
    let mockPayload: unknown;
    const enclosureData: Enclosure[] = this.mockStorage.enclosures;
    switch (method) {
      case 'enclosure.query': {
        mockPayload = enclosureData;
        break;
      }
      case 'system.build_time': {
        let sysBuildtimeClone: ApiTimestamp = { ...data as ApiTimestamp };
        sysBuildtimeClone = { $date: 1676641039000 };
        mockPayload = sysBuildtimeClone;
        break;
      }
      case 'system.info': {
        const sysinfoClone: SystemInfo = { ...data as SystemInfo };
        sysinfoClone.system_manufacturer = 'iXsystems';
        sysinfoClone.buildtime = { $date: 1676641039000 };
        sysinfoClone.system_product = this.mockConfig.systemProduct; // 'TRUENAS-' + model;
        sysinfoClone.system_serial = 'abcdefgh12345678';
        mockPayload = sysinfoClone;
        break;
      }
      case 'disk.query': {
        if (this.mockStorage.enclosures.length > 0 && data) {
          const sorted = (data as Disk[]).sort((a, b) => (a.name < b.name ? -1 : 1));
          mockPayload = this.mockStorage.updateDisks(sorted, this.mockConfig.enclosureOptions.dispersal);
        } else {
          return data;
        }
        break;
      }
      default:
        return data;
    }

    return mockPayload;
  }
}
