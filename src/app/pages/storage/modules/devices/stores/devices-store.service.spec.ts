import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import { firstValueFrom } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { Disk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { DevicesState, DevicesStore } from 'app/pages/storage/modules/devices/stores/devices-store.service';

describe('DevicesStore', () => {
  let spectator: SpectatorService<DevicesStore>;
  let testScheduler: TestScheduler;
  const createService = createServiceFactory({
    service: DevicesStore,
    providers: [
      mockProvider(ApiService),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    testScheduler = getTestScheduler();
  });

  it('loads pool topology, disks and sets loading indicators when loadNodes is called', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const mockedApi = spectator.inject(ApiService);
      jest.spyOn(mockedApi, 'call').mockImplementation((method) => {
        if (method === 'pool.query') {
          return cold('-b|', {
            b: [{
              name: 'tank',
              topology: {
                data: [
                  { name: 'raidz1-0', guid: 'guid1' },
                ],
                cache: [
                  { name: 'sdr', guid: 'guid2' },
                ],
                log: [],
                spare: [],
                special: [],
                dedup: [],
              },
            } as Pool],
          });
        }

        if (method === 'disk.query') {
          return cold('-b|', { b: [{ devname: 'sdr' }] as Disk[] });
        }

        throw new Error(`Unexpected method: ${method}`);
      });

      spectator.service.loadNodes(4);
      expectObservable(spectator.service.state$).toBe('a-b', {
        a: {
          isLoading: true,
          error: null,
          nodes: [],
          diskDictionary: {},
          poolId: 4,
          selectedNodeGuid: null,
          disksWithSmartTestSupport: [],
        },
        b: {
          isLoading: false,
          error: null,
          nodes: [
            {
              children: [
                { name: 'raidz1-0', guid: 'guid1', isRoot: true },
              ],
              group: 'Data VDEVs',
              guid: 'data',
            },
            {
              children: [
                { name: 'sdr', guid: 'guid2', isRoot: true },
              ],
              group: 'Cache',
              guid: 'cache',
            },
          ],
          diskDictionary: {
            sdr: { devname: 'sdr' },
          },
          poolId: 4,
          selectedNodeGuid: null,
          disksWithSmartTestSupport: [],
        },
      });
    });
  });

  describe('loadDisksWithSmartTestSupport', () => {
    it('loads disks with SMART support and sets disksWithSmartTestSupport in state', () => {
      testScheduler.run(({ cold, expectObservable }) => {
        const mockApi = spectator.inject(ApiService);
        jest.spyOn(mockApi, 'call').mockImplementation((method) => {
          if (method === 'smart.test.disk_choices') {
            return cold('-b|', {
              b: {
                '{serial}ha001_c1_os00': 'sda',
                '{serial_lunid}074a18aa-9416-4ea3-89f4-7d54235f1ea1_6001405074a18aa9': 'sdb',
                '{serial_lunid}f4daf9ff-014e-4c41-a683-7d37469a5177_6001405f4daf9ff0': 'sdd',
                '{serial_lunid}1e69def5-73c2-4ab0-b78b-3eb654470da2_60014051e69def57': 'sdc',
                '{serial_lunid}d51c6c0b-b202-4292-a9cd-22a3fd123130_6001405d51c6c0bb': 'sde',
                '{serial_lunid}3f46e9ef-482b-4ace-84f1-187e86dba9d4_60014053f46e9ef4': 'sdf',
                '{serial_lunid}fc56b68c-ea0a-4f90-8bb7-94955f15a59f_6001405fc56b68ce': 'sdg',
                '{serial_lunid}453c2f7e-4edb-49f8-8a6d-391520c2d894_6001405453c2f7e4': 'sdh',
                '{serial_lunid}68e8f06f-fd41-4a37-8ae3-5f61ae9f9fa1_600140568e8f06ff': 'sdi',
                '{serial_lunid}f5920a8b-f1d3-4f07-a3ec-5f5276efa7be_6001405f5920a8bf': 'sdj',
                '{serial_lunid}c9aa6f83-1ab0-442d-8ab7-d3fc7c48d7ef_6001405c9aa6f831': 'sdk',
              },
            });
          }

          throw new Error(`Unexpected method: ${method}`);
        });

        spectator.service.loadDisksWithSmartTestSupport();

        expect(mockApi.call).toHaveBeenCalledWith('smart.test.disk_choices');
        expectObservable(spectator.service.state$).toBe('ab', {
          a: expect.objectContaining({
            disksWithSmartTestSupport: [],
          }),
          b: expect.objectContaining({
            disksWithSmartTestSupport: ['sda', 'sdb', 'sdd', 'sdc', 'sde', 'sdf', 'sdg', 'sdh', 'sdi', 'sdj', 'sdk'],
          }),
        });
      });
    });
  });

  describe('selectNodeByGuid', () => {
    it('updates selectNodeByGuid in state', () => {
      testScheduler.run(({ expectObservable }) => {
        spectator.service.selectNodeByGuid('guid2');
        expectObservable(spectator.service.state$).toBe('a', {
          a: expect.objectContaining({
            selectedNodeGuid: 'guid2',
          }),
        });
      });
    });
  });

  describe('selectedBranch$', () => {
    it('returns an array of nodes going from parent to child matching selected guid', async () => {
      spectator.service.patchState({
        nodes: [
          {
            children: [
              { name: 'raidz1-0', guid: 'guid1' },
            ],
            group: 'Data VDEVs',
            guid: 'data',
          },
        ],
        selectedNodeGuid: 'guid1',
      } as DevicesState);

      const selectedBranch = await firstValueFrom(spectator.service.selectedBranch$);
      expect(selectedBranch).toEqual([
        expect.objectContaining({ guid: 'data' }),
        expect.objectContaining({ guid: 'guid1' }),
      ]);
    });
  });
});
