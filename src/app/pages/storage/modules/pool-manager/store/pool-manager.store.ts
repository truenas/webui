import { Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import _ from 'lodash';
import {
  forkJoin, Observable, of, Subject,
} from 'rxjs';
import { switchMap, take, tap } from 'rxjs/operators';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { DispersalStrategy } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/2-enclosure-wizard-step/enclosure-wizard-step.component';
import { filterAllowedDisks } from 'app/pages/storage/modules/pool-manager/utils/disk.utils';
import {
  GenerateVdevsService,
} from 'app/pages/storage/modules/pool-manager/utils/generate-vdevs/generate-vdevs.service';
import {
  categoryCapacity,
  topologyCategoryToDisks,
  topologyToDisks,
} from 'app/pages/storage/modules/pool-manager/utils/topology.utils';
import { DialogService, WebSocketService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';

export interface PoolManagerTopologyCategory {
  layout: CreateVdevLayout;
  width: number;
  diskSize: number;
  diskType: DiskType;
  vdevsNumber: number;
  treatDiskSizeAsMinimum: boolean;
  vdevs: UnusedDisk[][];
  hasCustomDiskSelection: boolean;
}

export type PoolManagerTopology = {
  [category in VdevType]: PoolManagerTopologyCategory;
};

interface PoolManagerDiskSettings {
  allowNonUniqueSerialDisks: boolean;
  allowExportedPools: string[];
}

interface PoolManagerEnclosureSettings {
  limitToSingleEnclosure: number | null;
  maximizeEnclosureDispersal: boolean;
  dispersalStrategy: DispersalStrategy;
}

export interface PoolManagerState {
  isLoading: boolean;
  enclosures: Enclosure[];
  name: string;
  encryption: string | null;
  allDisks: UnusedDisk[];
  diskSettings: PoolManagerDiskSettings;
  enclosureSettings: PoolManagerEnclosureSettings;
  topology: PoolManagerTopology;
}

const initialTopology = Object.values(VdevType).reduce((topology, value) => {
  return {
    ...topology,
    [value]: {
      width: null,
      diskSize: null,
      diskType: null,
      vdevsNumber: null,
      treatDiskSizeAsMinimum: false,
      vdevs: [],
      hasCustomDiskSelection: false,
    } as PoolManagerTopologyCategory,
  };
}, {} as PoolManagerTopology);

export const initialState: PoolManagerState = {
  isLoading: false,
  allDisks: [],
  enclosures: [],
  name: '',
  encryption: null,

  diskSettings: {
    allowNonUniqueSerialDisks: false,
    allowExportedPools: [],
  },
  enclosureSettings: {
    limitToSingleEnclosure: null,
    maximizeEnclosureDispersal: false,
    dispersalStrategy: null,
  },

  topology: initialTopology,
};

@Injectable()
export class PoolManagerStore extends ComponentStore<PoolManagerState> {
  readonly startOver$ = new Subject<void>();
  readonly resetStep$ = new Subject<VdevType>();
  readonly isLoading$ = this.select((state) => state.isLoading);
  readonly name$ = this.select((state) => state.name);
  readonly encryption$ = this.select((state) => state.encryption);
  readonly enclosures$ = this.select((state) => state.enclosures);
  readonly allDisks$ = this.select((state) => state.allDisks);
  readonly topology$ = this.select((state) => state.topology);
  readonly diskSettings$ = this.select((state) => state.diskSettings);
  readonly enclosureSettings$ = this.select((state) => state.enclosureSettings);
  readonly totalUsableCapacity$ = this.select(
    this.topology$,
    (topology) => categoryCapacity(topology[VdevType.Data]),
  );
  readonly allowedDisks$ = this.select(
    this.allDisks$,
    this.diskSettings$,
    this.enclosureSettings$,
    (allDisks, diskOptions, enclosureOptions) => filterAllowedDisks(allDisks, {
      ...diskOptions,
      ...enclosureOptions,
    }),
  );

  readonly hasMultipleEnclosuresAfterFirstStep$ = this.select(
    this.allDisks$,
    this.diskSettings$,
    (allDisks, diskOptions) => {
      const disksAfterFirstStep = filterAllowedDisks(allDisks, {
        ...diskOptions,
        limitToSingleEnclosure: null,
      });
      const uniqueEnclosures = new Set<number>();
      disksAfterFirstStep.forEach((disk) => uniqueEnclosures.add(disk.enclosure?.number));
      return uniqueEnclosures.size > 1;
    },
  );

  getLayoutsForVdevType(vdevType: VdevType): Observable<CreateVdevLayout[]> {
    switch (vdevType) {
      case VdevType.Cache:
        return of([CreateVdevLayout.Stripe]);
      case VdevType.Dedup:
        return this.select((state) => [state.topology[VdevType.Data].layout]);
      case VdevType.Log:
        return of([CreateVdevLayout.Mirror, CreateVdevLayout.Stripe]);
      case VdevType.Spare:
        return of([CreateVdevLayout.Stripe]);
      case VdevType.Special:
        return this.select((state) => [state.topology[VdevType.Data].layout]);
      default:
        return of([...Object.values(CreateVdevLayout)]);
    }
  }

  readonly inventory$ = this.select(
    this.allowedDisks$,
    this.topology$,
    (allowedDisks, topology) => {
      const usedDisks = topologyToDisks(topology);
      return _.differenceBy(allowedDisks, usedDisks, (disk) => disk.devname);
    },
  );

  // TODO: Check if this needs to be optimized
  getInventoryForStep(type: VdevType): Observable<UnusedDisk[]> {
    return this.select(
      this.inventory$,
      this.topology$,
      (inventory, topology) => {
        const disksUsedInCategory = topologyCategoryToDisks(topology[type]);
        return [...inventory, ...disksUsedInCategory];
      },
    );
  }

  constructor(
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private generateVdevs: GenerateVdevsService,
  ) {
    super(initialState);
  }

  reset(): void {
    this.startOver$.next();
    this.setState({ ...initialState, isLoading: true });
    this.loadStateInitialData().pipe(take(1)).subscribe();
  }

  resetStep(vdevType: VdevType): void {
    this.resetStep$.next(vdevType);
    this.updateTopologyCategory(vdevType, initialTopology[vdevType]);
  }

  readonly initialize = this.effect((trigger$) => {
    return trigger$.pipe(
      tap(() => this.setState({ ...initialState, isLoading: true })),
      switchMap(() => this.loadStateInitialData()),
    );
  });

  loadStateInitialData(): Observable<[UnusedDisk[], Enclosure[]]> {
    return forkJoin([
      this.ws.call('disk.get_unused'),
      this.ws.call('enclosure.query'),
    ]).pipe(
      tapResponse(([allDisks, enclosures]) => {
        this.patchState({
          isLoading: false,
          allDisks,
          enclosures,
        });
      },
      (error: WebsocketError) => {
        this.patchState({ isLoading: false });
        this.dialogService.error(this.errorHandler.parseWsError(error));
      }),
    );
  }

  readonly resetTopologyCategory = this.updater((state, category: VdevType) => {
    return {
      ...state,
      topology: {
        ...state.topology,
        [category]: initialTopology[category],
      },
    };
  });

  readonly resetTopology = this.updater((state) => {
    return {
      ...state,
      topology: initialTopology,
    };
  });

  readonly setGeneralOptions = this.updater((state, options: Pick<PoolManagerState, 'name' | 'encryption'>) => {
    return {
      ...state,
      ...options,
    };
  });

  setDiskWarningOptions(diskOptions: PoolManagerDiskSettings): void {
    this.patchState({
      diskSettings: diskOptions,
    });

    this.resetTopologyIfNotEnoughDisks();
  }

  setEnclosureOptions(enclosureOptions: PoolManagerEnclosureSettings): void {
    this.patchState({
      enclosureSettings: enclosureOptions,
    });

    this.resetTopologyIfNotEnoughDisks();
  }

  setAutomaticTopologyCategory(type: VdevType, updates: Omit<PoolManagerTopologyCategory, 'vdevs' | 'hasCustomDiskSelection'>): void {
    this.updateTopologyCategory(type, updates);

    this.regenerateVdevs();
  }

  setManualTopologyCategory(type: VdevType, vdevs: UnusedDisk[][]): void {
    this.updateTopologyCategory(type, {
      vdevs,
      hasCustomDiskSelection: true,
    });

    this.regenerateVdevs();
  }

  private updateTopologyCategory(type: VdevType, update: Partial<PoolManagerTopologyCategory>): void {
    this.patchState((state) => {
      const topology = state.topology[type];
      return {
        ...state,
        topology: {
          ...state.topology,
          [type]: {
            ...topology,
            ...update,
          },
        },
      };
    });
  }

  private resetTopologyIfNotEnoughDisks(): void {
    this.allowedDisks$.pipe(take(1)).subscribe((allowedDisks) => {
      const usedDisks = topologyToDisks(this.get().topology);
      if (usedDisks.length > allowedDisks.length) {
        this.resetTopology();
      }
    });
  }

  /**
   * Regenerates the vdevs for all categories.
   * Regeneration of all categories is needed because user may use maximizeEnclosureDispersal option.
   * In this case the vdevs of one category may affect the vdevs of another category.
   */
  private regenerateVdevs(): void {
    // TODO: subscription is not great. Can this be an effect?
    this.allowedDisks$
      .pipe(take(1))
      .subscribe((allowedDisks) => {
        const newVdevs = this.generateVdevs.generateVdevs({
          allowedDisks,
          topology: this.get().topology,
          maximizeDispersal: this.get().enclosureSettings.maximizeEnclosureDispersal,
        });
        Object.entries(newVdevs).forEach(([type, vdevs]) => {
          this.updateTopologyCategory(type as VdevType, { vdevs });
        });
      });
  }
}
