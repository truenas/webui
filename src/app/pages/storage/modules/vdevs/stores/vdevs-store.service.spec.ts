import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import {
  firstValueFrom, Observable, of, Subject, take,
} from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { CollectionChangeType } from 'app/enums/api.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { VDevNestedDataNode } from 'app/interfaces/device-nested-data-node.interface';
import { Disk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { VDevItem } from 'app/interfaces/storage.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { VDevsState, VDevsStore } from 'app/pages/storage/modules/vdevs/stores/vdevs-store.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('VDevsStore', () => {
  let spectator: SpectatorService<VDevsStore>;
  let testScheduler: TestScheduler;
  const createService = createServiceFactory({
    service: VDevsStore,
    providers: [
      mockProvider(ApiService),
      mockProvider(ErrorHandlerService),
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
                log: [] as VDevItem[],
                spare: [] as VDevItem[],
                special: [] as VDevItem[],
                dedup: [] as VDevItem[],
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
      } as VDevsState);

      const disk = spectator.service.getDisk({ name: 'sdr', type: TopologyItemType.Disk, disk: 'sdr' } as VDevNestedDataNode);
      expect(disk).toEqual({ devname: 'sdr' });
    });
  });

  describe('listenForPoolChanges', () => {
    const pool = {
      id: 4,
      name: 'tank',
      topology: {
        data: [
          { name: 'raidz1-0', guid: 'guid1' },
        ],
        cache: [
          { name: 'sdr', guid: 'guid2' },
        ],
        log: [] as VDevItem[],
        spare: [] as VDevItem[],
        special: [] as VDevItem[],
        dedup: [] as VDevItem[],
      },
    } as Pool;
    const faultedPool = {
      ...pool,
      topology: {
        ...pool.topology,
        cache: [{ name: 'sdr', guid: 'guid2', status: TopologyItemStatus.Faulted }],
      },
    } as Pool;
    let poolEvents$: Subject<{ msg: CollectionChangeType; id: number; fields?: Pool }>;
    let refreshedPools$: Subject<Pool[]>;

    function mockApiCalls(pools$: Observable<Pool[]>): void {
      (spectator.inject(ApiService).call as unknown as jest.Mock).mockImplementation((method: string) => {
        return method === 'pool.query' ? pools$ : of([{ devname: 'sdr' }] as Disk[]);
      });
    }

    function sendPoolChange(id: number, changedPool: Pool): void {
      poolEvents$.next({ msg: CollectionChangeType.Changed, id, fields: changedPool });
      jest.advanceTimersByTime(300);
    }

    function getSelectedNode(): VDevNestedDataNode | null {
      let selectedNode: VDevNestedDataNode | null = null;
      spectator.service.selectedNode$.pipe(take(1)).subscribe((node) => selectedNode = node);
      return selectedNode;
    }

    beforeEach(() => {
      jest.useFakeTimers();
      poolEvents$ = new Subject();
      (spectator.inject(ApiService).subscribe as unknown as jest.Mock).mockReturnValue(poolEvents$);
      mockApiCalls(of([pool]));
      spectator.service.loadNodes(4);
      spectator.service.selectNodeByGuid('guid2');
      spectator.service.listenForPoolChanges().subscribe();

      refreshedPools$ = new Subject<Pool[]>();
      jest.clearAllMocks();
      mockApiCalls(refreshedPools$);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('reloads the pool without the loading indicator and keeps the selection when its devices change', () => {
      sendPoolChange(4, faultedPool);

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.query', [[['id', '=', 4]]]);
      expect(spectator.service.state().isLoading).toBe(false);

      refreshedPools$.next([faultedPool]);

      expect(getSelectedNode()).toEqual(
        expect.objectContaining({ guid: 'guid2', status: TopologyItemStatus.Faulted }),
      );
    });

    it('reloads once for a burst of changes', () => {
      poolEvents$.next({ msg: CollectionChangeType.Changed, id: 4, fields: faultedPool });
      poolEvents$.next({ msg: CollectionChangeType.Changed, id: 4, fields: faultedPool });
      jest.advanceTimersByTime(300);

      expect(spectator.inject(ApiService).call).toHaveBeenCalledTimes(1);
    });

    it('ignores changes to other pools', () => {
      sendPoolChange(5, faultedPool);

      expect(spectator.inject(ApiService).call).not.toHaveBeenCalled();
    });

    it('ignores a change that leaves the pool\'s devices as they are', () => {
      sendPoolChange(4, pool);

      expect(spectator.inject(ApiService).call).not.toHaveBeenCalled();
    });

    it('ignores a change that lists the same devices in another order', () => {
      const reorderedPool = {
        ...pool,
        topology: {
          ...pool.topology,
          data: [
            { name: 'raidz1-0', guid: 'guid1' },
            { name: 'raidz1-1', guid: 'guid3' },
          ],
        },
      } as Pool;
      sendPoolChange(4, reorderedPool);
      refreshedPools$.next([reorderedPool]);
      jest.clearAllMocks();

      sendPoolChange(4, {
        ...reorderedPool,
        topology: { ...reorderedPool.topology, data: [...reorderedPool.topology.data].reverse() },
      } as Pool);

      expect(spectator.inject(ApiService).call).not.toHaveBeenCalled();
    });

    it('keeps following the pool through a change that has no topology', () => {
      const unlistedPool = { ...pool, topology: null } as unknown as Pool;
      sendPoolChange(4, unlistedPool);
      refreshedPools$.next([unlistedPool]);

      expect(spectator.service.state().nodes).toEqual([]);
      expect(spectator.inject(ErrorHandlerService).showErrorModal).not.toHaveBeenCalled();

      jest.clearAllMocks();
      sendPoolChange(4, faultedPool);

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.query', [[['id', '=', 4]]]);
    });

    it('ignores a removed pool', () => {
      poolEvents$.next({ msg: CollectionChangeType.Removed, id: 4 });
      jest.advanceTimersByTime(300);

      expect(spectator.inject(ApiService).call).not.toHaveBeenCalled();
    });
  });
});
