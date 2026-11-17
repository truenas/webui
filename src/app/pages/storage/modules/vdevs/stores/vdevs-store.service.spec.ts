import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import { of, Subject } from 'rxjs';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
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
