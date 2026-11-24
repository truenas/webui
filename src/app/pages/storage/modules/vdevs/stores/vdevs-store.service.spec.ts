import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import { of, Subject } from 'rxjs';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { VDevNestedDataNode } from 'app/interfaces/device-nested-data-node.interface';
import { Disk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { VDevItem } from 'app/interfaces/storage.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { VDevsStore } from 'app/pages/storage/modules/vdevs/stores/vdevs-store.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

const pool = {
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

describe('VDevsStore', () => {
  let spectator: SpectatorService<VDevsStore>;
  let pools$: Subject<Pool[]>;
  let poolEvents$: Subject<{ msg: string; id: number; fields?: Pool }>;
  const createService = createServiceFactory({
    service: VDevsStore,
    providers: [
      mockProvider(ApiService, {
        // An instance property, so `mockProvider` cannot stub it on its own.
        query: jest.fn(),
      }),
      mockProvider(ErrorHandlerService),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    pools$ = new Subject<Pool[]>();
    poolEvents$ = new Subject();
    (spectator.inject(ApiService).subscribe as unknown as jest.Mock).mockReturnValue(poolEvents$);
    (spectator.inject(ApiService).query as unknown as jest.Mock).mockImplementation((method: string) => {
      if (method === 'pool.query') {
        return pools$;
      }
      if (method === 'disk.query') {
        return of([{ devname: 'sdr' }] as Disk[]);
      }
      throw new Error(`Unexpected method: ${method}`);
    });
  });

  function loadTank(): void {
    spectator.service.loadNodes(4);
    pools$.next([pool]);
  }

  it('loads pool topology, disks and sets loading indicators when loadNodes is called', () => {
    spectator.service.loadNodes(4);

    expect(spectator.service.isLoading()).toBe(true);
    expect(spectator.service.nodes()).toEqual([]);
    expect(spectator.inject(ApiService).query).toHaveBeenCalledWith('pool.query', [['id', '=', 4]]);

    pools$.next([pool]);

    expect(spectator.service.isLoading()).toBe(false);
    expect(spectator.service.poolName()).toBe('tank');
    expect(spectator.service.diskDictionary()).toEqual({ sdr: { devname: 'sdr' } });
    expect(spectator.service.nodes()).toEqual([
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
    ]);
  });

  it('keeps the loaded pool and reports it as available when ZFS lists its devices', () => {
    loadTank();

    expect(spectator.service.pool()).toEqual(pool);
    expect(spectator.service.isPoolUnavailable()).toBe(false);
  });

  it('reports a pool without topology as unavailable, without an error', () => {
    const offlinePool = { ...pool, topology: null } as unknown as Pool;
    spectator.service.loadNodes(4);
    pools$.next([offlinePool]);

    expect(spectator.service.isPoolUnavailable()).toBe(true);
    expect(spectator.service.nodes()).toEqual([]);
    expect(spectator.inject(ErrorHandlerService).showErrorModal).not.toHaveBeenCalled();
  });

  it('clears the loading indicator and shows the error when loading fails', () => {
    spectator.service.loadNodes(4);
    pools$.error(new Error('Boom'));

    expect(spectator.service.isLoading()).toBe(false);
    expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalledWith(new Error('Boom'));
  });

  it('reloads the last loaded pool when reloadList is called', () => {
    loadTank();
    jest.clearAllMocks();

    spectator.service.reloadList();

    expect(spectator.inject(ApiService).query).toHaveBeenCalledWith('pool.query', [['id', '=', 4]]);
  });

  describe('listenForPoolChanges', () => {
    const faultedPool = {
      ...pool,
      topology: {
        ...pool.topology,
        cache: [{ name: 'sdr', guid: 'guid2', status: TopologyItemStatus.Faulted }],
      },
    } as Pool;
    let refreshedPools$: Subject<Pool[]>;

    beforeEach(() => {
      jest.useFakeTimers();
      loadTank();
      spectator.service.selectNodeByGuid('guid2');
      spectator.service.listenForPoolChanges().subscribe();

      refreshedPools$ = new Subject<Pool[]>();
      jest.clearAllMocks();
      (spectator.inject(ApiService).query as unknown as jest.Mock).mockImplementation((method: string) => {
        return method === 'pool.query' ? refreshedPools$ : of([{ devname: 'sdr' }] as Disk[]);
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    function sendPoolChange(id: number, changedPool: Pool): void {
      poolEvents$.next({ msg: 'changed', id, fields: changedPool });
      jest.advanceTimersByTime(300);
    }

    it('reloads the pool without the loading indicator and keeps the selection when its devices change', () => {
      sendPoolChange(4, faultedPool);

      expect(spectator.inject(ApiService).query).toHaveBeenCalledWith('pool.query', [['id', '=', 4]]);
      expect(spectator.service.isLoading()).toBe(false);

      refreshedPools$.next([faultedPool]);

      expect(spectator.service.selectedNode()).toEqual(
        expect.objectContaining({ guid: 'guid2', status: TopologyItemStatus.Faulted }),
      );
    });

    it('reloads once for a burst of changes', () => {
      poolEvents$.next({ msg: 'changed', id: 4, fields: faultedPool });
      poolEvents$.next({ msg: 'changed', id: 4, fields: faultedPool });
      jest.advanceTimersByTime(300);

      expect(spectator.inject(ApiService).query).toHaveBeenCalledTimes(1);
    });

    it('ignores changes to other pools', () => {
      sendPoolChange(5, faultedPool);

      expect(spectator.inject(ApiService).query).not.toHaveBeenCalled();
    });

    it('ignores a change that leaves the pool\'s devices as they are', () => {
      sendPoolChange(4, pool);

      expect(spectator.inject(ApiService).query).not.toHaveBeenCalled();
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

      expect(spectator.inject(ApiService).query).not.toHaveBeenCalled();
    });

    it('keeps following the pool through a change that has no topology', () => {
      const unlistedPool = { ...pool, topology: null } as Pool;
      sendPoolChange(4, unlistedPool);
      refreshedPools$.next([unlistedPool]);

      expect(spectator.service.nodes()).toEqual([]);
      expect(spectator.inject(ErrorHandlerService).showErrorModal).not.toHaveBeenCalled();

      jest.clearAllMocks();
      sendPoolChange(4, faultedPool);

      expect(spectator.inject(ApiService).query).toHaveBeenCalledWith('pool.query', [['id', '=', 4]]);
    });

    it('keeps the refreshed devices when a reload started before the change answers after it', () => {
      const staleReload$ = new Subject<Pool[]>();
      const refreshAfterChange$ = new Subject<Pool[]>();
      (spectator.inject(ApiService).query as unknown as jest.Mock)
        .mockImplementationOnce(() => staleReload$)
        .mockImplementationOnce(() => refreshAfterChange$);

      spectator.service.reloadList();
      sendPoolChange(4, faultedPool);
      refreshAfterChange$.next([faultedPool]);
      staleReload$.next([pool]);

      expect(spectator.service.isLoading()).toBe(false);
      expect(spectator.service.nodes()[1].children[0]).toEqual(
        expect.objectContaining({ guid: 'guid2', status: TopologyItemStatus.Faulted }),
      );
    });

    describe('while a replacement is in progress', () => {
      const disk = (guid: string): VDevItem => ({ guid, type: TopologyItemType.Disk, children: [] }) as VDevItem;
      const mirrorWith = (...children: VDevItem[]): Pool => ({
        ...pool,
        topology: {
          ...pool.topology,
          data: [{ guid: 'mirror', type: TopologyItemType.Mirror, children } as VDevItem],
        },
      } as Pool);
      const replacingPool = mirrorWith(disk('vdc'), {
        guid: 'replacing', type: TopologyItemType.Replacing, children: [disk('vdb'), disk('vdd')],
      } as VDevItem);
      const replacedPool = mirrorWith(disk('vdc'), disk('vdd'));
      let poolOnAppliance: Pool;

      function queriedMethods(): string[] {
        return (spectator.inject(ApiService).query as unknown as jest.Mock).mock.calls.map(([method]) => method);
      }

      beforeEach(() => {
        poolOnAppliance = replacingPool;
        (spectator.inject(ApiService).query as unknown as jest.Mock).mockImplementation((method: string) => {
          return method === 'pool.query' ? of([poolOnAppliance]) : of([{ devname: 'sdr' }] as Disk[]);
        });
        sendPoolChange(4, replacingPool);
        jest.clearAllMocks();
      });

      it('reloads the pool once the replacement is gone, even without a change event', () => {
        poolOnAppliance = replacedPool;

        jest.advanceTimersByTime(5000);

        expect(queriedMethods()).toEqual(['pool.query', 'pool.query', 'disk.query']);
        expect(spectator.service.nodes()[0].children[0].children).toEqual([disk('vdc'), disk('vdd')]);
      });

      it('only checks, without reloading, while the pool still shows the replacement', () => {
        jest.advanceTimersByTime(10000);

        expect(queriedMethods()).toEqual(['pool.query', 'pool.query']);
      });

      it('stops checking once the replacement is gone', () => {
        poolOnAppliance = replacedPool;
        jest.advanceTimersByTime(5000);
        jest.clearAllMocks();

        jest.advanceTimersByTime(15000);

        expect(queriedMethods()).toEqual([]);
      });
    });

    it('does not check the pool on its own when no replacement is in progress', () => {
      jest.advanceTimersByTime(15000);

      expect(spectator.inject(ApiService).query).not.toHaveBeenCalled();
    });

    it('ignores a removed pool', () => {
      poolEvents$.next({ msg: 'removed', id: 4 });
      jest.advanceTimersByTime(300);

      expect(spectator.inject(ApiService).query).not.toHaveBeenCalled();
    });
  });

  describe('selected node', () => {
    it('exposes the branch, node, parent and topology category of the selected guid', () => {
      loadTank();

      spectator.service.selectNodeByGuid('guid1');

      expect(spectator.service.selectedBranch()).toEqual([
        expect.objectContaining({ guid: 'data' }),
        expect.objectContaining({ guid: 'guid1' }),
      ]);
      expect(spectator.service.selectedNode()).toEqual(expect.objectContaining({ guid: 'guid1' }));
      expect(spectator.service.selectedParentNode()).toEqual(expect.objectContaining({ guid: 'data' }));
      expect(spectator.service.selectedTopologyCategory()).toBe('data');
    });

    it('is empty when nothing is selected', () => {
      loadTank();

      expect(spectator.service.selectedBranch()).toBeNull();
      expect(spectator.service.selectedNode()).toBeNull();
    });
  });

  describe('getDisk', () => {
    it('returns a disk from the disk dictionary for a topology disk', () => {
      loadTank();

      const disk = spectator.service.getDisk({ name: 'sdr', type: TopologyItemType.Disk, disk: 'sdr' } as VDevNestedDataNode);
      expect(disk).toEqual({ devname: 'sdr' });
    });
  });
});
