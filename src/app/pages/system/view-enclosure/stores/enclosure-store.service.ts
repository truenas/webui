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

interface ProcessParameters {
  pools: Pool[];
  disks: Disk[];
  enclosures: Enclosure[];
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

  readonly loadData = this.effect((triggers$: Observable<void>) => {
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
    /*
    * EnclosureViews setup
    * */
    let enclosureViews: EnclosureView[] = [];
    if (!enclosures.length) return of(enclosureViews);

    // Deal with M50
    const isM50 = enclosures.filter((enclosure: Enclosure) => {
      return enclosure.id === 'm50_plx_enclosure' || enclosure.id === 'm60_plx_enclosure';
    }).length;
    if (isM50) {
      const mergedData = this.mergeMseriesEnclosures({
        pools,
        disks,
        enclosures,
      });
      disks = mergedData.disks;
      enclosures = mergedData.enclosures;
    }

    enclosureViews = enclosures.map((enclosure: Enclosure) => {
      return {
        isSelected: selectedEnclosure && selectedEnclosure === enclosure.number
          ? selectedEnclosure
          : false,
        isController: enclosure.controller,
        isRackmount: this.isRackmount(enclosure),
        slots: [],
        number: enclosure.number,
        model: enclosure.model,
        expanders: (enclosure.elements as EnclosureElementsGroup[]).find((item) => {
          return item.name === 'SAS Expander';
        })?.elements,
      } as EnclosureView;
    });
    enclosureViews.sort((a, b) => a.number - b.number);

    // Setup default Enclosure Selection
    if (!selectedEnclosure && enclosureViews.length) {
      // Selected enclosure should be controller by default
      enclosureViews.find((enclosure: EnclosureView) => enclosure.isController).isSelected = true;
    }

    /*
    * EnclosureSlots setup
    * */

    // Add Slots to View
    enclosures.forEach((enclosure: Enclosure) => {
      const slots = (enclosure.elements as EnclosureElementsGroup[]).find((element: EnclosureElementsGroup) => {
        return element.name === 'Array Device Slot';
      }).elements;

      const enclosureSlots = slots.map((slotSource: EnclosureElement) => {
        const enclosureDisk = disks.find((disk: Disk) => disk.name === slotSource.data.Device);
        const pool = this.verifiedDiskPool(enclosureDisk, pools);
        const topologyInfo = pool ? this.findVdevByDisk(enclosureDisk, pool) : null;

        const enclosureSlot: EnclosureSlot = {
          disk: enclosureDisk,
          isSelected: false,
          enclosure: enclosure.number,
          slot: slotSource.slot,
          slotStatus: slotSource.status,
          fault: slotSource.fault,
          identify: slotSource.identify,
          pool: pool ? pool.name : null,
          vdev: pool ? topologyInfo.vdev : null,
          topologyStatus: enclosureDisk ? 'AVAILABLE' : null,
        };

        if (topologyInfo?.vdev || topologyInfo?.category) {
          enclosureSlot.topologyCategory = topologyInfo ? topologyInfo.category : null;
          enclosureSlot.vdev = topologyInfo ? topologyInfo.vdev : null;

          const topologyDisk = this.findTopologyDiskInVdev(
            topologyInfo.vdev,
            enclosureSlot.disk.name,
          );
          enclosureSlot.topologyStatus = topologyDisk.status as string;
          enclosureSlot.topologyStats = topologyDisk.stats;
        }

        return enclosureSlot;
      });

      // Attach it to the EnclosureView
      const enclosureView: EnclosureView = enclosureViews.find((view: EnclosureView) => {
        return view.number === enclosure.number;
      });
      enclosureView.slots = enclosureSlots;
      enclosureView.pools = this.getPoolNamesInEnclosureView(enclosureView);
    });

    return of(enclosureViews);
  }

  mergeMseriesEnclosures(data: ProcessParameters): ProcessParameters {
    let rearId = '';
    const rearNumber = data.enclosures.find((enclosure: Enclosure) => {
      if (enclosure.id === 'm50_plx_enclosure' || enclosure.id === 'm60_plx_enclosure') {
        rearId = enclosure.id;
        return true;
      }
      return false;
    }).number;

    const frontNumber = data.enclosures.find((enclosure: Enclosure) => {
      return enclosure.id !== rearId && enclosure.controller;
    }).number;

    const updatedDisks = data.disks.map((disk: Disk) => {
      const updatedDisk = disk;
      if (disk.enclosure && disk.enclosure.number === rearNumber) {
        updatedDisk.enclosure.number = frontNumber;
        updatedDisk.enclosure.slot += 24;
      }
      return updatedDisk || disk;
    });

    const rearChassisElements: EnclosureElement | EnclosureElementsGroup = data.enclosures[rearNumber].elements[0];
    const rearSlotElements: EnclosureElement[] = (rearChassisElements as EnclosureElementsGroup).elements
      .map((element: EnclosureElement) => {
        element.slot += 24;
        return element;
      });

    const frontChassisElements: EnclosureElement | EnclosureElementsGroup = data.enclosures[frontNumber].elements[0];
    const frontSlotElements = (frontChassisElements as EnclosureElementsGroup).elements;
    const mergedSlotElements = frontSlotElements.concat(rearSlotElements);
    (data.enclosures[frontNumber].elements as EnclosureElementsGroup[])[0].elements = mergedSlotElements;
    const updatedEnclosures = data.enclosures.filter((enclosure: Enclosure) => enclosure.number !== rearNumber);

    const updatedData: ProcessParameters = {
      pools: data.pools,
      disks: updatedDisks,
      enclosures: updatedEnclosures,
    };

    return updatedData;
  }

  findVdevByDisk(disk: Disk, pool: Pool): { category: PoolTopologyCategory | null; vdev: TopologyItem | null } | null {
    if (!disk || !pool) return null;

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

  // Temporarily here until mock ability is merged
  private verifiedDiskPool(disk: Disk, pools: Pool[]): Pool | null {
    let result: Pool | null = null;
    pools.forEach((pool: Pool) => {
      if (pool.topology) {
        // console.error('Pool Data Integrity: pool.topology is null');
        const test = this.findVdevByDisk(disk, pool);
        if (test?.category || test?.vdev) result = pool;
      }
    });
    return result;
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

  private isRackmount(enclosure: Enclosure): boolean {
    switch (enclosure.model) {
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

  private getPoolNamesInEnclosureView(enclosureView: EnclosureView): string[] {
    const pools: string[] = enclosureView?.slots
      .map((slot: EnclosureSlot) => slot.pool)
      .filter((poolName: string) => poolName !== null);

    return [...new Set(pools)];
  }
}
