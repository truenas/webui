import { Injectable } from '@angular/core';
import { ValidationErrors } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { Store } from '@ngrx/store';
import _ from 'lodash';
import {
  combineLatest,
  forkJoin, Observable, of, Subject,
} from 'rxjs';
import {
  filter,
  map, switchMap, take, tap,
} from 'rxjs/operators';
import { GiB } from 'app/constants/bytes.constant';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ManualDiskSelectionComponent, ManualDiskSelectionParams } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/manual-disk-selection.component';
import {
  DispersalStrategy,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/2-enclosure-wizard-step/enclosure-wizard-step.component';
import { categoryCapacity } from 'app/pages/storage/modules/pool-manager/utils/capacity.utils';
import { filterAllowedDisks } from 'app/pages/storage/modules/pool-manager/utils/disk.utils';
import {
  GenerateVdevsService,
} from 'app/pages/storage/modules/pool-manager/utils/generate-vdevs/generate-vdevs.service';
import {
  isDraidLayout,
  topologyCategoryToDisks,
  topologyToDisks,
} from 'app/pages/storage/modules/pool-manager/utils/topology.utils';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

export interface PoolManagerTopologyCategory {
  layout: CreateVdevLayout;
  width: number;
  diskSize: number;
  diskType: DiskType;
  vdevsNumber: number;
  treatDiskSizeAsMinimum: boolean;
  vdevs: UnusedDisk[][];
  hasCustomDiskSelection: boolean;

  // Only used for data step when dRAID is selected.
  draidDataDisks: number;
  draidSpareDisks: number;
}

export type PoolManagerTopology = {
  [category in VdevType]: PoolManagerTopologyCategory;
};

interface PoolManagerDiskSettings {
  allowNonUniqueSerialDisks: boolean;
  allowExportedPools: string[];
}

export interface PoolManagerEnclosureSettings {
  limitToSingleEnclosure: number | null;
  maximizeEnclosureDispersal: boolean;
  dispersalStrategy: DispersalStrategy;
}

export interface PoolManagerState {
  isLoading: boolean;
  enclosures: Enclosure[];
  name: string;
  nameErrors: ValidationErrors | null;
  encryption: string | null;
  allDisks: UnusedDisk[];
  diskSettings: PoolManagerDiskSettings;
  enclosureSettings: PoolManagerEnclosureSettings;
  topology: PoolManagerTopology;
}

type TopologyCategoryUpdate = Partial<Omit<PoolManagerTopologyCategory, 'vdevs' | 'hasCustomDiskSelection'>>;

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

      draidDataDisks: 0,
      draidSpareDisks: 0,
    } as PoolManagerTopologyCategory,
  };
}, {} as PoolManagerTopology);

export const initialState: PoolManagerState = {
  isLoading: false,
  allDisks: [],
  enclosures: [],
  name: '',
  nameErrors: null,
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

@UntilDestroy()
@Injectable()
export class PoolManagerStore extends ComponentStore<PoolManagerState> {
  readonly startOver$ = new Subject<void>();
  readonly resetStep$ = new Subject<VdevType>();
  readonly isLoading$ = this.select((state) => state.isLoading);
  readonly name$ = this.select((state) => state.name);
  readonly nameErrors$ = this.select((state) => state.nameErrors);
  readonly encryption$ = this.select((state) => state.encryption);
  readonly enclosures$ = this.select((state) => state.enclosures);
  readonly allDisks$ = this.select((state) => state.allDisks);
  readonly topology$ = this.select((state) => state.topology);
  readonly diskSettings$ = this.select((state) => state.diskSettings);
  readonly enclosureSettings$ = this.select((state) => state.enclosureSettings);
  readonly totalUsableCapacity$ = this.select(
    this.topology$,
    this.settingsStore$.pipe(waitForAdvancedConfig, map((config) => config.swapondrive)),
    (topology, swapondrive) => categoryCapacity(topology[VdevType.Data], swapondrive * GiB),
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

  readonly usesDraidLayout$ = this.select(
    this.topology$,
    (topology) => this.isUsingDraidLayout(topology),
  );

  isUsingDraidLayout(topology: PoolManagerTopology): boolean {
    const dataCategory = topology[VdevType.Data];
    return [CreateVdevLayout.Draid1, CreateVdevLayout.Draid2, CreateVdevLayout.Draid3].includes(dataCategory.layout);
  }

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
      this.allowedDisks$,
      this.topology$,
      (allowedDisks, topology) => {
        const disksUsedInOtherCategories = Object.values(topology).flatMap((category) => {
          if (category === topology[type]) {
            return [];
          }
          return topologyCategoryToDisks(category);
        });
        return _.differenceBy(allowedDisks, disksUsedInOtherCategories, (disk) => disk.devname);
      },
    );
  }

  constructor(
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private generateVdevs: GenerateVdevsService,
    private settingsStore$: Store<AppState>,
    private dialog: MatDialog,
  ) {
    super(initialState);
  }

  resetStoreToInitialState(): void {
    this.setState({ ...initialState });
  }

  startOver(): void {
    this.startOver$.next();
    this.setState({ ...initialState, isLoading: true });
    this.loadStateInitialData().pipe(take(1)).subscribe();
  }

  resetStep(vdevType: VdevType): void {
    this.resetTopologyCategory(vdevType);
    this.resetStep$.next(vdevType);
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

  readonly setGeneralOptions = this.updater((state, options: Pick<PoolManagerState, 'nameErrors' | 'name' | 'encryption'>) => {
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

  setTopologyCategoryDiskSizes(
    type: VdevType,
    updates: Pick<TopologyCategoryUpdate, 'diskSize' | 'treatDiskSizeAsMinimum' | 'diskType'>,
  ): void {
    this.updateTopologyCategory(type, updates);
    this.regenerateVdevs();
  }

  setTopologyCategoryLayout(
    type: VdevType,
    newLayout: CreateVdevLayout,
  ): void {
    const isNewLayoutDraid = isDraidLayout(newLayout);
    const isOldLayoutDraid = isDraidLayout(this.get().topology[type].layout);
    if (isNewLayoutDraid !== isOldLayoutDraid) {
      this.resetTopologyCategory(type);
    }

    this.updateTopologyCategory(type, { layout: newLayout });

    if (isDraidLayout(newLayout)) {
      this.resetTopologyCategory(VdevType.Spare);
    }
  }

  setAutomaticTopologyCategory(type: VdevType, updates: TopologyCategoryUpdate): void {
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
      Object.entries(this.get().topology).forEach(([type, category]) => {
        const usedDisks = topologyCategoryToDisks(category);
        if (usedDisks.some((disk) => !allowedDisks.includes(disk))) {
          this.resetStep(type as VdevType);
        }
      });
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

  openManualSelectionDialog(type: VdevType): void {
    this.state$.pipe(
      take(1),
      switchMap((state: PoolManagerState) => combineLatest([
        of(state),
        this.getInventoryForStep(type).pipe(take(1)),
      ])),
      switchMap(([state, inventoryForStep]: [PoolManagerState, UnusedDisk[]]) => {
        const usedDisks = topologyCategoryToDisks(state.topology[type]);
        const inventory = _.differenceBy(inventoryForStep, usedDisks, (disk: UnusedDisk) => disk.devname);
        const isVdevsLimitedToOne = type === VdevType.Spare || type === VdevType.Cache || type === VdevType.Log;
        return this.dialog.open(ManualDiskSelectionComponent, {
          data: {
            inventory,
            layout: state.topology[type].layout,
            enclosures: state.enclosures,
            vdevs: state.topology[type].vdevs,
            vdevsLimit: isVdevsLimitedToOne ? 1 : null,
          } as ManualDiskSelectionParams,
          panelClass: 'manual-selection-dialog',
        }).afterClosed();
      }),
      filter(Boolean),
      tap((customVdevs: UnusedDisk[][]) => {
        if (!customVdevs.length) {
          this.resetTopologyCategory(type);
        } else {
          this.setManualTopologyCategory(type, customVdevs);
        }
      }),
      untilDestroyed(this),
    ).subscribe();
  }
}
