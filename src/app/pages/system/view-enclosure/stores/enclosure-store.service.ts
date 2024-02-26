import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import {
  forkJoin, Observable, of, Subject, tap,
} from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { VdevType, TopologyItemType } from 'app/enums/v-dev-type.enum';
import { EnclosureUi, EnclosureUiSlot } from 'app/interfaces/enclosure.interface';
import { Pool } from 'app/interfaces/pool.interface';
import {
  Disk, TopologyDisk, TopologyItem,
} from 'app/interfaces/storage.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { DisksUpdateService } from 'app/services/disks-update.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

export interface EnclosureState {
  areEnclosuresLoading: boolean;
  areDisksLoading: boolean;
  enclosures: EnclosureUi[];
  selectedEnclosure?: string | null;
  selectedEnclosureDisks?: EnclosureUiSlot[] | null;
}

const initialState: EnclosureState = {
  areEnclosuresLoading: false,
  areDisksLoading: false,
  enclosures: [],
  selectedEnclosure: null,
  selectedEnclosureDisks: [],
};

@UntilDestroy()
@Injectable()
export class EnclosureStore extends ComponentStore<EnclosureState> {
  readonly data$ = this.select((state) => state);
  readonly enclosureViews$ = this.select((state) => state.enclosures);

  private disksUpdateSubscriptionId: string;

  constructor(
    private ws: WebSocketService,
    private disksUpdateService: DisksUpdateService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
  ) {
    super(initialState);
    this.listenForDiskUpdates();
  }

  readonly loadData = this.effect((triggers$: Observable<void>) => {
    return triggers$.pipe(
      tap(() => {
        this.patchState({
          ...initialState,
          areEnclosuresLoading: true,
          areDisksLoading: true,
        });
      }),
      switchMap(() => this.updateState()),
    );
  });

  updateState(): Observable<{
    enclosures: EnclosureUi[];
  }> {
    return forkJoin({
      enclosures: this.getEnclosures().pipe(
        this.patchStateWithEnclosureData(),
      ),
    });
  }

  getEnclosures(): Observable<EnclosureUi[]> {
    return this.ws.call('webui.enclosure.dashboard');
  }

  patchStateWithEnclosureData(): (source: Observable<EnclosureUi[]>) => Observable<EnclosureUi[]> {
    return tapResponse<EnclosureUi[]>(
      (enclosures: EnclosureUi[]) => {
        const selectedEnclosure = enclosures.length ? enclosures[0].id : null;
        this.patchState({
          areEnclosuresLoading: false,
          enclosures: [...enclosures],
          selectedEnclosure,
        });
      },
      (error: unknown) => {
        this.patchState({
          areEnclosuresLoading: false,
        });
        this.dialogService.error(this.errorHandler.parseError(error));
      },
    );
  }

  processData({
    enclosures,
  }: {
    enclosures: EnclosureUi[];
    selectedEnclosure: string;
  }): Observable<EnclosureUi[]> {
    enclosures.map((enclosure, index) => {
      enclosure.number = index;
      return enclosure;
    });
    return of(enclosures);
  }

  findVdevByDisk(disk: Disk, pool: Pool): { category: VdevType | null; vdev: TopologyItem | null } | null {
    if (!disk || !pool) return null;

    let topologyItem: TopologyItem | null = null;
    let topologyCategory: VdevType | null;

    const categories: VdevType[] = [
      VdevType.Data,
      VdevType.Cache,
      VdevType.Spare,
      VdevType.Special,
      VdevType.Log,
      VdevType.Dedup,
    ];

    categories.forEach((category: VdevType) => {
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
          case TopologyItemType.Draid:
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

  updateLabel(enclosureId: string, label: string): void {
    this.patchState((state) => {
      return {
        ...state,
        enclosures: state.enclosures.map((enclosure: EnclosureUi) => {
          if (enclosure.id !== enclosureId) {
            return enclosure;
          }

          return {
            ...enclosure,
            label,
          };
        }),
      };
    });
  }

  getPools(enclosure: EnclosureUi): string[] {
    if (!enclosure) return [];
    const pools = Object.entries(enclosure?.elements['Array Device Slot'])
      .filter((entry: [string, EnclosureUiSlot]) => entry[1].pool_info !== null)
      .map((keyValue: [string, EnclosureUiSlot]) => (keyValue[1]).pool_info?.pool_name);
    const uniquePools = new Set(pools);
    return Array.from(uniquePools);
  }

  listenForDiskUpdates(): void {
    if (!this.disksUpdateSubscriptionId) {
      const diskUpdatesTrigger$ = new Subject<Disk[]>();
      this.disksUpdateSubscriptionId = this.disksUpdateService.addSubscriber(diskUpdatesTrigger$, true);
      diskUpdatesTrigger$.pipe(untilDestroyed(this)).subscribe(() => {
        this.loadData();
      });
    }
  }

  updateSelectedEnclosureDisks(selectedEnclosure: EnclosureUi): void {
    const disks = Object.entries(selectedEnclosure.elements['Array Device Slot'])
      .map((keyValue: [string, EnclosureUiSlot]) => {
        return keyValue[1];
      });

    this.updateStateWithSelectedEnclosureDisks(disks);
  }

  readonly updateStateWithSelectedEnclosureDisks = this.updater((state, selectedEnclosureDisks: EnclosureUiSlot[]) => {
    return {
      ...state,
      selectedEnclosureDisks,
    };
  });

  readonly updateSelectedEnclosure = this.updater((state, selectedEnclosure: string) => {
    const selected: EnclosureUi = state.enclosures.find((enclosure: EnclosureUi) => {
      return enclosure.id === selectedEnclosure;
    });
    this.updateSelectedEnclosureDisks(selected);
    return {
      ...state,
      selectedEnclosure,
    };
  });
}
