import { MockEnclosureConfig } from 'app/core/testing/interfaces/mock-enclosure-utils.interface';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { ApiMethod } from 'app/interfaces/api-directory.interface';
import { IncomingWebsocketMessage, ResultMessage } from 'app/interfaces/api-message.interface';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { MockStorageGenerator } from './mock-storage-generator.utils';

export class MockEnclosureUtils {
  mockConfig: MockEnclosureConfig;
  mockStorage: MockStorageGenerator;

  constructor(config: MockEnclosureConfig) {
    this.mockConfig = config;
    this.mockStorage = new MockStorageGenerator();
    this.mockStorage.addEnclosures(this.mockConfig.enclosureOptions);
  }

  overrideMessage<K extends ApiMethod>(data: ResultMessage, method: K): ResultMessage {
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
        // Sometimes response only has two keys "name" and "type"
        const keys = Object.keys([...data as Disk[]][0]);
        if (this.mockStorage.enclosures.length > 0 && data && keys.length > 2) {
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
