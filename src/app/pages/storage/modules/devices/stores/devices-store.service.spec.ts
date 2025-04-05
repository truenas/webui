import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import { firstValueFrom } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { DeviceNestedDataNode } from 'app/interfaces/device-nested-data-node.interface';
import { Disk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { TopologyItem } from 'app/interfaces/storage.interface';
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
                log: [] as TopologyItem[],
                spare: [] as TopologyItem[],
                special: [] as TopologyItem[],
                dedup: [] as TopologyItem[],
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
        },
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

  describe('getDisk', () => {
    it('returns a disk from disk dictinoary when called with a', () => {
      spectator.service.patchState({
        isLoading: false,
        error: null,
        nodes: [
          {
            children: [
              { name: 'raidz1-0', guid: 'guid1', isRoot: true } as TopologyItem,
            ],
            group: 'Data VDEVs',
            guid: 'data',
          },
          {
            children: [
              { name: 'sdr', guid: 'guid2', isRoot: true } as TopologyItem,
            ],
            group: 'Cache',
            guid: 'cache',
          },
        ],
        diskDictionary: {
          sdr: { devname: 'sdr' } as Disk,
        },
        poolId: 4,
        selectedNodeGuid: null,
      } as DevicesState);

      const disk = spectator.service.getDisk({ name: 'sdr', type: TopologyItemType.Disk, disk: 'sdr' } as DeviceNestedDataNode);
      expect(disk).toEqual({ devname: 'sdr' });
    });
  });
});
