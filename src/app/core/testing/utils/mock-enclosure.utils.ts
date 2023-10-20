import { environment } from 'environments/environment';
import { MockEnclosureConfig } from 'app/core/testing/interfaces/mock-enclosure-utils.interface';
import { ApiCallDirectory, ApiCallMethod } from 'app/interfaces/api/api-call-directory.interface';
import { ApiJobMethod } from 'app/interfaces/api/api-job-directory.interface';
import { IncomingWebsocketMessage, ResultMessage } from 'app/interfaces/api-message.interface';
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
    switch (method) {
      case 'enclosure.query':
        return this.mockStorage.enclosures ?? [];
      case 'pool.query':
        return this.mockPoolQuery() ?? data;
      case 'pool.dataset.query':
        return this.mockPoolDatasetQuery() ?? data;
      case 'system.build_time':
        return this.mockConfig.mockEnclosure ? { $date: 1676641039000 } : data;
      case 'system.info':
        return this.mockConfig.mockEnclosure ? this.mockSystemInfo(data as SystemInfo) : data;
      case 'system.is_ix_hardware':
        return this.mockConfig.mockEnclosure ? true : data;
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
      case 'disk.get_unused':
        return this.mockConfig.diskOptions.enabled ? this.mockDiskGetUnused() : data;
      default:
        return data;
    }

    return mockPayload;
  }

  private mockPoolQuery(): ApiCallDirectory['pool.query']['response'] {
    if (this.mockConfig.diskOptions.mockPools) {
      return [this.mockStorage.poolState];
    } else if (this.mockConfig.diskOptions.enabled) {
      return [];
    }
  }

  private mockPoolDatasetQuery(): ApiCallDirectory['pool.dataset.query']['response'] {
    if (this.mockConfig.diskOptions.mockPools) {
      return [mockRootDataset(this.mockStorage.poolState.name)];
    } else if (this.mockConfig.diskOptions.enabled) {
      return [];
    }
    return null;
  }

  private mockSystemInfo(data: SystemInfo): ApiCallDirectory['system.info']['response'] {
    return {
      ...data,
      system_manufacturer: 'iXsystems',
      buildtime: { $date: 1676641039000 },
      system_product: this.mockConfig.systemProduct,
      system_serial: 'abcdefgh12345678',
    };
  }

  private mockDiskGetUnused(): ApiCallDirectory['disk.get_unused']['response'] {
    return this.mockStorage.disks.filter((disk: Disk) => {
      return !Object.keys(disk).includes('pool') || typeof disk.pool === 'undefined' || disk.pool === null;
    }).map((disk: Disk) => {
      return {
        ...disk,
        partitions: [{ path: '' }],
        exported_zpool: '',
      } as UnusedDisk;
    });
  }
}
