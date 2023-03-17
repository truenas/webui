import { Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import {
  combineLatest, forkJoin, Observable, Observer, of, tap,
} from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PoolTopologyCategory } from 'app/enums/pool-topology-category.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import {
  Enclosure,
  EnclosureElement,
  EnclosureElementsGroup,
  EnclosureSlot,
  EnclosureView,
} from 'app/interfaces/enclosure.interface';
import { Pool } from 'app/interfaces/pool.interface';
import {
  Disk, TopologyDisk, TopologyItem, VDev,
} from 'app/interfaces/storage.interface';
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
  enclosureViews?: EnclosureView[];
  selectedEnclosure?: number | null;
}

const initialState: EnclosureState = {
  areEnclosuresLoading: false,
  arePoolsLoading: false,
  areDisksLoading: false,
  enclosures: [],
  pools: [],
  disks: [],
  enclosureViews: [],
  selectedEnclosure: 0,
};

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
  readonly enclosureViews$ = this.select((state) => state.enclosureViews);
  readonly selectedEnclosure$ = this.select((state) => state.selectedEnclosure);

  private defaultEnclosureSelection = 0;
  private selectedSlotNumber: number | null = null;

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
    pools: Pool[];
    disks: Disk[];
    enclosureViews: EnclosureView[];
  }> {
    return forkJoin({
      enclosures: this.getEnclosures().pipe(
        this.patchStateWithEnclosureData(),
      ),
      pools: this.getPools().pipe(
        this.patchStateWithPoolData(),
      ),
      disks: this.getDisks().pipe(
        this.patchStateWithDisksData(),
      ),
      enclosureViews: this.getEnclosureViewsData().pipe(
        this.patchStateWithEnclosureViewsData(),
      ),
      selectedEnclosure: this.getSelectedEnclosure().pipe(
        this.patchStateWithSelectedEnclosure(),
      ),
    });
  }

  getSelectedEnclosure(): Observable<number> {
    return new Observable((subscriber: Observer<number>) => {
      subscriber.next(this.defaultEnclosureSelection);
    });
  }

  patchStateWithSelectedEnclosure(): (source: Observable<number>) => Observable<number> {
    return tapResponse<number>(
      (selected: number) => {
        this.patchState({
          selectedEnclosure: selected,
        });
      },
      (error: Error) => {
        console.error(error);
      },
    );
  }

  patchStateWithEnclosureViewsData(): (source: Observable<EnclosureView[]>) => Observable<EnclosureView[]> {
    return tapResponse<EnclosureView[]>(
      (views: EnclosureView[]) => {
        this.patchState({
          enclosureViews: [...views],
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

  getEnclosureViewsData(): Observable<EnclosureView[]> {
    return combineLatest({
      enclosures: this.getEnclosures(),
      pools: this.getPools(),
      disks: this.getDisks(),
      selectedEnclosure: this.getSelectedEnclosure(),
    }).pipe(
      switchMap(this.processData.bind(this)),
    );
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

  processData({
    enclosures, pools, disks, selectedEnclosure,
  }: {
    enclosures: Enclosure[];
    pools: Pool[];
    disks: Disk[];
    selectedEnclosure: number;
  }): Observable<EnclosureView[]> {
    let enclosureViews: EnclosureView[] = [];
    if (!enclosures.length) return of(enclosureViews);

    enclosureViews = enclosures.map((enclosure: Enclosure) => {
      return {
        isSelected: selectedEnclosure && selectedEnclosure === enclosure.number
          ? selectedEnclosure
          : false,
        isController: enclosure.controller,
        slots: [],
        number: enclosure.number,
        model: enclosure.model,
        isRearChassis: enclosure.id === 'm50_plx_enclosure',
      } as EnclosureView;
    });
    enclosureViews.sort((a, b) => a.number - b.number);

    // Setup Selections
    if (!selectedEnclosure && enclosureViews.length) {
      enclosureViews.find((enclosure: EnclosureView) => enclosure.isController).isSelected = true;
      const selectedView = enclosureViews.find((enclosure: EnclosureView) => enclosure.isSelected);
      if (selectedView) {
        const selectedSlots = selectedView.slots.filter((enclosureSlot) => {
          return enclosureSlot.slot === this.selectedSlotNumber;
        });
        if (selectedSlots.length) {
          selectedSlots[0].isSelected = true;
        }
      }
    }

    // TODO: Incorporate empty slots by iterating over enclosure elements instead of disks
    if (disks.length) {
      disks.forEach((disk: Disk) => {
        if (!disk.enclosure) return;

        let slotElements: EnclosureElementsGroup;
        enclosures[disk.enclosure.number].elements
          .forEach((elementGroup: EnclosureElementsGroup | EnclosureElement) => {
            if (elementGroup.name === 'Array Device Slot') slotElements = elementGroup as EnclosureElementsGroup;
          });

        const slotSource = slotElements.elements
          .find((element: EnclosureElement) => element.slot === disk.enclosure.slot);

        const enclosureSlot: EnclosureSlot = {
          disk,
          isSelected: false,
          enclosure: disk.enclosure.number,
          slot: disk.enclosure.slot,
          slotStatus: slotSource.status,
          fault: slotSource.fault,
          identify: slotSource.identify,
          pool: disk.pool,
          vdev: null,
        };
        if (pools && disk.pool) {
          const topologyInfo: SlotTopology | null = this.findVdevByDisk(
            disk,
            pools.find((pool) => pool.name === disk.pool),
          );

          if (topologyInfo.vdev || topologyInfo.category) {
            enclosureSlot.topologyCategory = topologyInfo ? topologyInfo.category : null;
            enclosureSlot.vdev = topologyInfo ? topologyInfo.vdev : null;

            const topologyDisk = this.findTopologyDiskInVdev(
              topologyInfo.vdev,
              enclosureSlot.disk.name,
            );
            enclosureSlot.topologyStatus = topologyDisk.status ? topologyDisk.status as string : 'AVAILABLE';
            enclosureSlot.topologyStats = topologyDisk.stats;
          } else {
            console.warn('Could not find topology info for disk ' + disk.name);
          }
        }

        enclosureViews[disk.enclosure.number].slots.push(enclosureSlot);
        enclosureViews[disk.enclosure.number].slots.sort((a, b) => a.slot - b.slot);
      });
    }

    return of(enclosureViews);
  }

  findVdevByDisk(disk: Disk, pool: Pool): { category: PoolTopologyCategory | null; vdev: TopologyItem | null } {
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

  private findTopologyDiskInVdev(vdev: TopologyItem, name: string): TopologyDisk | VDev | null {
    if (!vdev?.type) return null;

    return vdev.type !== TopologyItemType.Disk
      ? vdev.children.find((topologyDisk: TopologyDisk) => topologyDisk.disk === name)
      : vdev;
  }

  getPools(): Observable<Pool[]> {
    return this.ws.call('pool.query', [[], { extra: { is_upgraded: true } }]);
  }

  listenForPoolUpdates(): Observable<ApiEvent<Pool>> {
    return this.ws.subscribe('pool.query');
  }

  listenForDiskUpdates(): Observable<ApiEvent<Disk>> {
    return this.ws.subscribe('disk.query');
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

  // TODO: This should be part of enclosureViews
  isRackmount(data: EnclosureState): boolean {
    const controller = data.enclosures.find((enclosure: Enclosure) => enclosure.controller);

    switch (controller.model) {
      case 'FREENAS-MINI-3.0':
      case 'TRUENAS-MINI-3.0':
      case 'FREENAS-MINI-3.0-E':
      case 'TRUENAS-MINI-3.0-E':
      case 'FREENAS-MINI-3.0-E+':
      case 'TRUENAS-MINI-3.0-E+':
      case 'FREENAS-MINI-3.0-X':
      case 'TRUENAS-MINI-3.0-X':
      case 'FREENAS-MINI-3.0-X+':
      case 'TRUENAS-MINI-3.0-X+':
      case 'FREENAS-MINI-3.0-XL+':
      case 'TRUENAS-MINI-3.0-XL+':
        return false;
      default:
        return true;
    }
  }

  readonly updateSelectedEnclosure = this.updater((state, selectedEnclosure: number) => {
    return {
      ...state,
      selectedEnclosure,
    };
  });

  getPoolNamesInEnclosureView(enclosureView: EnclosureView): string[] {
    const pools: string[] = enclosureView?.slots
      .map((slot: EnclosureSlot) => slot.pool)
      .filter((poolName: string) => poolName !== null);

    return [...new Set(pools)];
  }
}
