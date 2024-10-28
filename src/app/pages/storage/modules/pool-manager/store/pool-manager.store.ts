import { Injectable } from '@angular/core';
import { ValidationErrors } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { tapResponse } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { differenceBy, isEqual, without } from 'lodash-es';
import {
  combineLatest,
  forkJoin, Observable, of, Subject,
} from 'rxjs';
import {
  filter, switchMap, take, tap,
} from 'rxjs/operators';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk, DiskDetailsResponse } from 'app/interfaces/disk.interface';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ManualDiskSelectionComponent, ManualDiskSelectionParams } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/manual-disk-selection.component';
import {
  DispersalStrategy,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/2-enclosure-wizard-step/enclosure-wizard-step.component';
import { DiskStore } from 'app/pages/storage/modules/pool-manager/store/disk.store';
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
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';

export interface PoolManagerTopologyCategory {
  layout: CreateVdevLayout;
  width: number;
  diskSize: number;
  diskType: DiskType;
  vdevsNumber: number;
  treatDiskSizeAsMinimum: boolean;
  vdevs: DetailsDisk[][];
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
  limitToSingleEnclosure: string | null;
  maximizeEnclosureDispersal: boolean;
  dispersalStrategy: DispersalStrategy;
}

export interface PoolManagerState {
  isLoading: boolean;
  enclosures: Enclosure[];
  name: string;
  nameErrors: ValidationErrors | null;
  encryption: string | null;
  diskSettings: PoolManagerDiskSettings;
  enclosureSettings: PoolManagerEnclosureSettings;
  topology: PoolManagerTopology;
  categorySequence: VdevType[];
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

  categorySequence: [
    VdevType.Data,
    VdevType.Log,
    VdevType.Spare,
    VdevType.Cache,
    VdevType.Special,
    VdevType.Dedup,
  ],
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
  readonly topology$ = this.select((state) => state.topology);
  readonly diskSettings$ = this.select((state) => state.diskSettings);
  readonly enclosureSettings$ = this.select((state) => state.enclosureSettings);
  readonly totalUsableCapacity$ = this.select(
    this.topology$,
    (topology) => categoryCapacity(topology[VdevType.Data]),
  );

  readonly allowedDisks$ = this.select(
    this.diskStore.selectableDisks$,
    this.diskSettings$,
    this.enclosureSettings$,
    (unusedDisks, diskOptions, enclosureOptions) => filterAllowedDisks(unusedDisks, {
      ...diskOptions,
      ...enclosureOptions,
    }),
  );

  readonly hasMultipleEnclosuresAfterFirstStep$ = this.select(
    this.diskStore.selectableDisks$,
    this.diskSettings$,
    (unusedDisks, diskOptions) => {
      const disksAfterFirstStep = filterAllowedDisks(unusedDisks, {
        ...diskOptions,
        limitToSingleEnclosure: null,
      });
      const uniqueEnclosures = new Set<string>();
      disksAfterFirstStep.forEach((disk) => {
        if (disk.enclosure) {
          uniqueEnclosures.add(disk.enclosure.id);
        }
      });
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
      return differenceBy(allowedDisks, usedDisks, (disk) => disk.devname);
    },
  );

  // TODO: Check if this needs to be optimized
  getInventoryForStep(type: VdevType): Observable<DetailsDisk[]> {
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
        return differenceBy(allowedDisks, disksUsedInOtherCategories, (disk) => disk.devname);
      },
    );
  }

  constructor(
    private diskStore: DiskStore,
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private generateVdevs: GenerateVdevsService,
    private settingsStore$: Store<AppState>,
    private matDialog: MatDialog,
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

  loadStateInitialData(): Observable<[Enclosure[], DiskDetailsResponse]> {
    return forkJoin([
      this.ws.call('enclosure2.query'),
      this.diskStore.loadDisks(),
    ]).pipe(
      tapResponse(
        ([enclosures]) => {
          this.patchState({
            isLoading: false,
            enclosures,
          });
        },
        (error: unknown) => {
          this.patchState({ isLoading: false });
          this.dialogService.error(this.errorHandler.parseError(error));
        },
      ),
    );
  }

  readonly resetTopologyCategory = this.updater((state, category: VdevType) => {
    const newCategory = { ...initialTopology[category] };
    if (category === VdevType.Spare || category === VdevType.Cache) {
      newCategory.layout = CreateVdevLayout.Stripe;
    }
    return {
      ...state,
      topology: {
        ...state.topology,
        [category]: newCategory,
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

  setManualTopologyCategory(type: VdevType, vdevs: DetailsDisk[][]): void {
    this.updateTopologyCategory(type, {
      vdevs,
      hasCustomDiskSelection: true,
    });

    this.regenerateVdevs();
  }

  private updateTopologyCategory(type: VdevType, update: Partial<PoolManagerTopologyCategory>): void {
    this.patchState((state) => {
      const topology = state.topology[type];
      const wasCategoryChanged = !Object.entries(update)
        .every(([key, value]) => isEqual(topology[key as keyof typeof topology], value));
      const categorySequence = wasCategoryChanged
        ? without(state.categorySequence, type).concat([type])
        : state.categorySequence;

      return {
        ...state,
        categorySequence,
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
          categorySequence: this.get().categorySequence,
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
      switchMap(([state, inventoryForStep]: [PoolManagerState, DetailsDisk[]]) => {
        const usedDisks = topologyCategoryToDisks(state.topology[type]);
        const inventory = differenceBy(inventoryForStep, usedDisks, (disk: DetailsDisk) => disk.devname);
        const isVdevsLimitedToOne = type === VdevType.Spare || type === VdevType.Cache || type === VdevType.Log;
        return this.matDialog.open(ManualDiskSelectionComponent, {
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
      tap((customVdevs: DetailsDisk[][]) => {
        if (!customVdevs.length) {
          this.resetStep(type);
        } else {
          this.setManualTopologyCategory(type, customVdevs);
        }
      }),
      untilDestroyed(this),
    ).subscribe();
  }
}
