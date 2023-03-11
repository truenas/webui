import { Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import {
  combineLatest, forkJoin, Observable, tap,
} from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PoolTopologyCategory } from 'app/enums/pool-topology-category.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { Enclosure, EnclosureSlot, EnclosureView } from 'app/interfaces/enclosure.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { Disk, TopologyDisk, TopologyItem } from 'app/interfaces/storage.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { DialogService, StorageService, WebSocketService } from 'app/services';

export interface EnclosureState {
  areEnclosuresLoading: boolean;
  arePoolsLoading: boolean;
  areDisksLoading: boolean;
  enclosures: Enclosure[];
  pools: Pool[];
  disks: Disk[];
}

const initialState: EnclosureState = {
  areEnclosuresLoading: false,
  arePoolsLoading: false,
  areDisksLoading: false,
  enclosures: [],
  pools: [],
  disks: [],
};

interface EnclosurePools {
  pools: Pool[];
}

interface SlotTopology {
  category: PoolTopologyCategory | null;
  vdev: TopologyItem | null;
}

@Injectable()
export class EnclosureStore extends ComponentStore<EnclosureState> {
  readonly enclosures$ = this.select((state) => state.enclosures);
  readonly pools$ = this.select((state) => state.pools);
  readonly areEnclosuresLoading$ = this.select((state) => state.areEnclosuresLoading);
  readonly arePoolsLoading$ = this.select((state) => state.arePoolsLoading);
  readonly areDisksLoading$ = this.select((state) => state.areDisksLoading);
  readonly disks$ = this.select((state) => state.disks);
  readonly data$ = this.select((state) => state);

  constructor(
    private ws: WebSocketService,
    private dialogService: DialogService,
    private sorter: StorageService,
  ) {
    super(initialState);
  }

  readonly loadDashboard = this.effect((triggers$: Observable<void>) => {
    return triggers$.pipe(
      tap(() => {
        this.patchState({
          ...initialState,
          areEnclosuresLoading: true,
          arePoolsLoading: true,
          areDisksLoading: true,
        });
      }),
      switchMap(() => this.updateState()),
    );
  });

  updateState(): Observable<{
    enclosures: Enclosure[];
    enclosurePools: Pool[];
    enclosureDisks: Disk[];
  }> {
    return forkJoin({
      enclosures: this.getEnclosures().pipe(
        this.patchStateWithEnclosureData(),
      ),
      enclosurePools: this.getPools().pipe(
        this.patchStateWithPoolData(),
      ),
      enclosureDisks: this.getDisks().pipe(
        this.patchStateWithDisksData(),
      ),
    });
  }

  getEnclosuresAndPools(): Observable<EnclosurePools> {
    return combineLatest({
      pools: this.getPools(),
      enclosures: this.getEnclosures(),
    });
  }

  getEnclosures(): Observable<Enclosure[]> {
    return this.ws.call('enclosure.query');
  }

  patchStateWithEnclosureData(): (source: Observable<Enclosure[]>) => Observable<Enclosure[]> {
    return tapResponse<Enclosure[]>(
      (enclosures: Enclosure[]) => {
        this.patchState({
          areEnclosuresLoading: false,
          enclosures: [...enclosures],
        });
      },
      (error: WebsocketError) => {
        this.patchState({
          areEnclosuresLoading: false,
        });
        new EntityUtils().handleWsError(this, error, this.dialogService);
      },
    );
  }

  mapEnclosures(data: EnclosureState): EnclosureView[] {
    let enclosureViews: EnclosureView[] = [];
    enclosureViews = data.enclosures.map((enclosure) => {
      return {
        isController: enclosure.controller,
        slots: [],
        number: enclosure.number,
        model: enclosure.model,
      };
    });
    enclosureViews.sort((a, b) => a.number - b.number);

    if (data.disks.length) {
      data.disks.forEach((disk: Disk) => {
        if (!disk.enclosure) return;

        const enclosureSlot: EnclosureSlot = {
          disk,
          enclosure: disk.enclosure.number,
          slot: disk.enclosure.slot,
          pool: disk.pool,
          vdev: null,
        };
        if (data.pools) {
          const topologyInfo: SlotTopology = this.findVdevByDisk(
            disk,
            data.pools.find((pool) => pool.name === disk.pool),
          );
          enclosureSlot.topologyCategory = topologyInfo ? topologyInfo.category : null;
          enclosureSlot.vdev = topologyInfo ? topologyInfo.vdev : null;
        }

        enclosureViews[disk.enclosure.number].slots.push(enclosureSlot);
        enclosureViews[disk.enclosure.number].slots.sort((a, b) => a.slot - b.slot);
      });
    }

    return enclosureViews;
  }

  findVdevByDisk(disk: Disk, pool: Pool): { category: PoolTopologyCategory; vdev: TopologyItem | null } {
    if (!pool) return null;

    let topologyItem: TopologyItem | null = null;
    let topologyCategory: PoolTopologyCategory | null;

    const categories: PoolTopologyCategory[] = [
      PoolTopologyCategory.Data,
      PoolTopologyCategory.Cache,
      PoolTopologyCategory.Spare,
      PoolTopologyCategory.Special,
      PoolTopologyCategory.Log,
      PoolTopologyCategory.Dedup,
    ];

    categories.forEach((category: PoolTopologyCategory) => {
      const found: TopologyItem = pool.topology[category].find((item: TopologyItem) => {
        switch (item.type) {
          case TopologyItemType.Disk:
            return item.disk === disk.name;
          case TopologyItemType.Spare:
          case TopologyItemType.Mirror:
          case TopologyItemType.Log:
          case TopologyItemType.Stripe:
          case TopologyItemType.Raidz1:
          case TopologyItemType.Raidz2:
          case TopologyItemType.Raidz3:
            return item.children.find((device: TopologyDisk) => device.disk === disk.name);
          default:
            return false;
        }
      });
      if (found) {
        topologyItem = found;
        topologyCategory = category;
      }
    });
    return {
      vdev: topologyItem,
      category: topologyCategory,
    };
  }

  getPools(): Observable<Pool[]> {
    return this.ws.call('pool.query', [[], { extra: { is_upgraded: true } }]);
  }

  listenForPoolUpdates(): Observable<ApiEvent<Pool>> {
    return this.ws.subscribe('pool.query');
  }

  patchStateWithPoolData(): (source: Observable<Pool[]>) => Observable<Pool[]> {
    return tapResponse<Pool[]>(
      (pools: Pool[]) => {
        this.patchState({
          arePoolsLoading: false,
          pools: this.sorter.tableSorter(pools, 'name', 'asc'),
        });
      },
      (error: WebsocketError) => {
        this.patchState({
          arePoolsLoading: false,
        });
        new EntityUtils().handleWsError(this, error, this.dialogService);
      },
    );
  }

  getDisks(): Observable<Disk[]> {
    return this.ws.call('disk.query', [[], { extra: { pools: true } }]);
  }

  patchStateWithDisksData(): (source: Observable<Disk[]>) => Observable<Disk[]> {
    return tapResponse<Disk[]>(
      (disks: Disk[]) => {
        this.patchState({
          disks: [...disks],
          areDisksLoading: false,
        });
      },
      (error: WebsocketError) => {
        this.patchState({
          areDisksLoading: false,
        });
        new EntityUtils().handleWsError(this, error, this.dialogService);
      },
    );
  }
}
