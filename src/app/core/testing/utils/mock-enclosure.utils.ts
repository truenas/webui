import { environment } from 'environments/environment';
import { MockEnclosureConfig } from 'app/core/testing/interfaces/mock-enclosure-utils.interface';
import { ApiCallMethod } from 'app/interfaces/api/api-call-directory.interface';
import { ApiJobMethod } from 'app/interfaces/api/api-job-directory.interface';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { IncomingWebsocketMessage, ResultMessage } from 'app/interfaces/api-message.interface';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { Disk, UnusedDisk } from 'app/interfaces/storage.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { MockStorageGenerator } from './mock-storage-generator.utils';
import { mockRootDataset } from './other-templates/root-dataset.template';

export class MockEnclosureUtils {
  mockConfig: MockEnclosureConfig = environment.mockConfig;
  mockStorage: MockStorageGenerator;

  get canMock(): boolean {
    return (
      environment.mockConfig.mockEnclosure
      || environment.mockConfig.diskOptions?.enabled
      || environment.mockConfig.diskOptions?.mockPools
    );
  }

  constructor() {
    const diskOptions = this.mockConfig?.diskOptions;
    this.mockStorage = new MockStorageGenerator(diskOptions.mockPools);

    // Add Pools and VDEVs
    if (diskOptions?.mockPools && diskOptions?.topologyOptions) {
      this.mockStorage.addDataTopology(this.mockConfig.diskOptions.topologyOptions);
    }

    // Add Unassigned Disks
    if (diskOptions?.enabled && diskOptions?.unassignedOptions) {
      // Simulate pools
      this.mockStorage.addUnassignedDisks(this.mockConfig.diskOptions.unassignedOptions);
    }

    // Mock Enclosure Settings
    if (this.mockConfig?.mockEnclosure && this.mockConfig?.enclosureOptions) {
      this.mockStorage.addEnclosures(this.mockConfig.enclosureOptions);
    }
  }

  overrideMessage<K extends ApiCallMethod | ApiJobMethod>(data: ResultMessage, method: K): ResultMessage {
    const mockData = this.enclosureOverrides(data.result, method);
    const mockMessage: IncomingWebsocketMessage = {
      id: data.id,
      msg: data.msg,
      result: mockData,
    };
    return mockMessage;
  }

  private enclosureOverrides<K extends ApiCallMethod | ApiJobMethod>(data: unknown, method: K): unknown {
    let mockPayload: unknown;
    const enclosureData: Enclosure[] = this.mockStorage.enclosures;
    switch (method) {
      case 'enclosure.query': {
        mockPayload = enclosureData === null ? [] : enclosureData;
        break;
      }
      case 'pool.query': {
        if (this.mockConfig.diskOptions.mockPools) {
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
        if (this.mockConfig.diskOptions.mockPools) {
          const rootDataset = mockRootDataset(this.mockStorage.poolState.name);
          mockPayload = [rootDataset];
          break;
        } else if (this.mockConfig.diskOptions.enabled) {
          mockPayload = [];
          break;
        } else {
          return data;
        }
      }
      case 'system.build_time': {
        if (this.mockConfig.mockEnclosure) {
          let sysBuildtimeClone: ApiTimestamp = { ...data as ApiTimestamp };
          sysBuildtimeClone = { $date: 1676641039000 };
          mockPayload = sysBuildtimeClone;
        } else {
          return data;
        }
        break;
      }
      case 'system.info': {
        if (this.mockConfig.mockEnclosure) {
          const sysinfoClone: SystemInfo = { ...data as SystemInfo };
          sysinfoClone.system_manufacturer = 'iXsystems';
          sysinfoClone.buildtime = { $date: 1676641039000 };
          sysinfoClone.system_product = this.mockConfig.systemProduct;
          sysinfoClone.system_serial = 'abcdefgh12345678';
          mockPayload = sysinfoClone;
        } else {
          return data;
        }
        break;
      }
      case 'system.is_ix_hardware':
        if (this.mockConfig.mockEnclosure) {
          return true;
        }
        return data;
      case 'smart.test.results':
      case 'disk.query': {
        // Sometimes response only has two keys "name" and "type"
        const keys = Object.keys([...data as Disk[]][0]);

        if ((this.mockConfig.diskOptions.enabled || this.mockConfig.diskOptions.mockPools) && keys.length > 2) {
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
          const payload = this.mockStorage.disks.filter((disk: Disk) => {
            return !Object.keys(disk).includes('pool') || typeof disk.pool === 'undefined' || disk.pool === null;
          }).map((disk: Disk) => {
            const unusedDisk: UnusedDisk | Disk = { ...disk };
            (unusedDisk as UnusedDisk).partitions = [{ path: '' }];
            (unusedDisk as UnusedDisk).exported_zpool = '';
            return unusedDisk as UnusedDisk;
          });

          mockPayload = payload;
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
