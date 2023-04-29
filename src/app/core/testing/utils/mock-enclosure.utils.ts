import { environment } from 'environments/environment';
import { MockEnclosureConfig } from 'app/core/testing/interfaces/mock-enclosure-utils.interface';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { ApiMethod } from 'app/interfaces/api-directory.interface';
import { IncomingWebsocketMessage, ResultMessage } from 'app/interfaces/api-message.interface';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { MockStorageGenerator } from './mock-storage-generator.utils';
import { mockRootDataset } from './other-templates/root-dataset.template';

export class MockEnclosureUtils {
  mockConfig: MockEnclosureConfig = environment.mockConfig;
  mockStorage: MockStorageGenerator;

  constructor() {
    const diskOptions = this.mockConfig?.diskOptions;

    // Mock Disk Settings
    if (diskOptions?.enabled && diskOptions?.mockPools) {
      // Simulate pools
      this.mockStorage = new MockStorageGenerator(diskOptions.mockPools);

      this.mockStorage.addDataTopology(this.mockConfig.diskOptions.topologyOptions);
    } else if (diskOptions?.enabled && !diskOptions?.mockPools) {
      // Just add unassigned disks
      this.mockStorage = new MockStorageGenerator(diskOptions.mockPools);

      this.mockStorage.addUnassignedDisks(
        this.mockConfig.diskOptions.topologyOptions.diskSize,
        this.mockConfig.diskOptions.topologyOptions.repeats,
      );
    } else {
      this.mockStorage = new MockStorageGenerator(false);
    }

    // Mock Enclosure Settings
    if (this.mockConfig?.enclosureOptions) {
      this.mockStorage.addEnclosures(this.mockConfig.enclosureOptions);
    }
  }

  overrideMessage<K extends ApiMethod>(data: ResultMessage, method: K): ResultMessage {
    const mockData = this.enclosureOverrides(data.result, method);
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
      case 'pool.query': {
        if (this.mockConfig.diskOptions.enabled && this.mockConfig.diskOptions.mockPools) {
          mockPayload = [this.mockStorage.poolState];
          break;
        } else if (this.mockConfig.diskOptions.enabled && !this.mockConfig.diskOptions.mockPools) {
          mockPayload = [];
          break;
        } else {
          mockPayload = data;
          break;
        }
      }
      case 'pool.dataset.query': {
        if (this.mockConfig.diskOptions.enabled && this.mockConfig.diskOptions.mockPools) {
          const rootDataset = mockRootDataset(this.mockStorage.poolState.name);
          mockPayload = [rootDataset]; // [this.mockStorage.poolState];
          break;
        } else if (this.mockConfig.diskOptions.enabled && !this.mockConfig.diskOptions.mockPools) {
          mockPayload = [];
          break;
        } else {
          return data;
        }
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
        sysinfoClone.system_product = this.mockConfig.systemProduct;
        sysinfoClone.system_serial = 'abcdefgh12345678';
        mockPayload = sysinfoClone;
        break;
      }
      case 'smart.test.results':
      case 'disk.query': {
        // Sometimes response only has two keys "name" and "type"
        const keys = Object.keys([...data as Disk[]][0]);

        if (this.mockConfig.diskOptions.enabled && keys.length > 2) {
          mockPayload = this.mockStorage.disks;
        } else if (this.mockStorage.enclosures.length > 0 && data && keys.length > 2) {
          const sorted = (data as Disk[]).sort((a, b) => (a.name < b.name ? -1 : 1));
          mockPayload = this.mockStorage.updateDisks(sorted, this.mockConfig.enclosureOptions.dispersal);
        } else {
          return data;
        }
        break;
      }
      case 'disk.get_unused': {
        if (this.mockConfig.diskOptions.enabled) {
          mockPayload = this.mockStorage.disks.filter((disk: Disk) => {
            return !Object.keys(disk).includes('pool') || typeof disk.pool === 'undefined' || disk.pool === null;
          });
          break;
        } else {
          return data;
        }
      }
      default:
        return data;
    }

    return mockPayload;
  }
}
