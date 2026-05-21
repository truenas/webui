import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import { firstValueFrom } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { VDevNestedDataNode } from 'app/interfaces/device-nested-data-node.interface';
import { Disk } from 'app/interfaces/disk.interface';
import { VDevItem } from 'app/interfaces/storage.interface';
import { Zpool } from 'app/interfaces/zpool.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { VDevsState, VDevsStore } from 'app/pages/storage/modules/vdevs/stores/vdevs-store.service';

describe('VDevsStore', () => {
  let spectator: SpectatorService<VDevsStore>;
  let testScheduler: TestScheduler;
  const createService = createServiceFactory({
    service: VDevsStore,
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
        if (method === 'zpool.query') {
          return cold('-b|', {
            b: [{
              id: 4,
              name: 'tank',
              topology: {
                data: [
                  {
                    name: 'raidz1-0', guid: 'guid1', vdev_type: 'raidz1', state: 'ONLINE', children: [],
                  },
                ],
                cache: [
                  {
                    name: '/dev/sdr1', guid: 'guid2', vdev_type: 'disk',
                  },
                ],
                log: [] as VDevItem[],
                spares: [] as VDevItem[],
                special: [] as VDevItem[],
                dedup: [] as VDevItem[],
              },
            } as unknown as Zpool],
          });
        }

        if (method === 'disk.query') {
          return cold('-b|', { b: [{ devname: 'sdr' }] as Disk[] });
        }

        throw new Error(`Unexpected method: ${method}`);
      });

      spectator.service.loadNodes(4);
      expectObservable(spectator.service.state$).toBe('a--b', {
        a: {
          isLoading: true,
          error: null,
          poolName: '',
          nodes: [],
          diskDictionary: {},
          poolId: 4,
          selectedNodeGuid: null,
        },
        b: {
          isLoading: false,
          error: null,
          poolName: 'tank',
          nodes: [
            {
              children: [
                expect.objectContaining({
                  name: 'raidz1-0', guid: 'guid1', isRoot: true, type: 'RAIDZ1',
                }),
              ],
              group: 'Data VDEVs',
              guid: 'data',
            },
            {
              children: [
                expect.objectContaining({
                  name: 'sdr', guid: 'guid2', isRoot: true, type: 'DISK', disk: 'sdr',
                }),
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
      } as VDevsState);

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
              { name: 'raidz1-0', guid: 'guid1', isRoot: true } as VDevItem,
            ],
            group: 'Data VDEVs',
            guid: 'data',
          },
          {
            children: [
              { name: 'sdr', guid: 'guid2', isRoot: true } as VDevItem,
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
      } as unknown as VDevsState);

      const disk = spectator.service.getDisk({ name: 'sdr', type: TopologyItemType.Disk, disk: 'sdr' } as VDevNestedDataNode);
      expect(disk).toEqual({ devname: 'sdr' });
    });
  });
});
