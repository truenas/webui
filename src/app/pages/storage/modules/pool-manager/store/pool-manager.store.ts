import { Injectable, inject } from '@angular/core';
import { ValidationErrors } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { tapResponse } from '@ngrx/operators';
import { differenceBy, isEqual, without } from 'lodash-es';
import {
  combineLatest,
  forkJoin, Observable, of, Subject,
} from 'rxjs';
import {
  filter, map, switchMap, take, tap,
} from 'rxjs/operators';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, VDevType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk, DiskDetailsResponse } from 'app/interfaces/disk.interface';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { ManualDiskSelectionComponent, ManualDiskSelectionParams } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/manual-disk-selection.component';
import {
  DispersalStrategy,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/2-enclosure-wizard-step/enclosure-wizard-step.component';
import { EncryptionType } from 'app/pages/storage/modules/pool-manager/enums/encryption-type.enum';
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
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export interface PoolManagerTopologyCategory {
  layout: CreateVdevLayout | null;
  width: number | null;
  diskSize: number | null;
  diskType: DiskType | null;
  vdevsNumber: number | null;
  treatDiskSizeAsMinimum: boolean;
  vdevs: DetailsDisk[][];
  hasCustomDiskSelection: boolean;

  // Only used for data step when dRAID is selected.
  draidDataDisks: number | null;
  draidSpareDisks: number | null;
}

export type PoolManagerTopology = Record<VDevType, PoolManagerTopologyCategory>;

interface PoolManagerDiskSettings {
  allowNonUniqueSerialDisks: boolean;
  allowExportedPools: string[];
}

export interface PoolManagerEnclosureSettings {
  limitToSingleEnclosure: string | null;
  maximizeEnclosureDispersal: boolean;
  dispersalStrategy: DispersalStrategy | null;
}

export interface PoolManagerState {
  isLoading: boolean;
  enclosures: Enclosure[];
  name: string;
  nameErrors: ValidationErrors | null;
  encryption: string | null;
  encryptionType: EncryptionType;
  sedPassword: string | null;
  hasSedCapableDisks: boolean;
  diskSettings: PoolManagerDiskSettings;
  enclosureSettings: PoolManagerEnclosureSettings;
  topology: PoolManagerTopology;
  categorySequence: VDevType[];
}

type TopologyCategoryUpdate = Partial<Omit<PoolManagerTopologyCategory, 'vdevs' | 'hasCustomDiskSelection'>>;

const initialTopology = Object.values(VDevType).reduce((topology, value) => {
  return {
    ...topology,
    [value]: {
      layout: null,
      width: null,
      diskSize: null,
      diskType: null,
      vdevsNumber: null,
      treatDiskSizeAsMinimum: false,
      vdevs: [] as DetailsDisk[][],
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
  encryptionType: EncryptionType.None,
  sedPassword: null,
  hasSedCapableDisks: false,

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
    VDevType.Data,
    VDevType.Log,
    VDevType.Spare,
    VDevType.Cache,
    VDevType.Special,
    VDevType.Dedup,
  ],
};

@UntilDestroy()
@Injectable()
export class PoolManagerStore extends ComponentStore<PoolManagerState> {
  private diskStore = inject(DiskStore);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private generateVdevs = inject(GenerateVdevsService);
  private matDialog = inject(MatDialog);

  readonly startOver$ = new Subject<void>();
  readonly resetStep$ = new Subject<VDevType>();
  readonly isLoading$ = this.select((state) => state.isLoading);
  readonly name$ = this.select((state) => state.name);
  readonly nameErrors$ = this.select((state) => state.nameErrors);
  readonly encryption$ = this.select((state) => state.encryption);
  readonly encryptionType$ = this.select((state) => state.encryptionType);
  readonly sedPassword$ = this.select((state) => state.sedPassword);
  readonly hasSedCapableDisks$ = this.select((state) => state.hasSedCapableDisks);
  readonly enclosures$ = this.select((state) => state.enclosures);
  readonly topology$ = this.select((state) => state.topology);
  readonly diskSettings$ = this.select((state) => state.diskSettings);
  readonly enclosureSettings$ = this.select((state) => state.enclosureSettings);
  readonly totalUsableCapacity$ = this.select(
    this.topology$,
    (topology) => categoryCapacity(topology[VDevType.Data]),
  );

  readonly allowedDisks$ = this.select(
    this.diskStore.selectableDisks$,
    this.diskSettings$,
    this.enclosureSettings$,
    this.encryptionType$,
    (unusedDisks, diskOptions, enclosureOptions, encryptionType) => filterAllowedDisks(unusedDisks, {
      ...diskOptions,
      ...enclosureOptions,
      requireSedCapable: encryptionType === EncryptionType.Sed,
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
    const dataCategory = topology[VDevType.Data];
    return Boolean(dataCategory.layout
      && [CreateVdevLayout.Draid1, CreateVdevLayout.Draid2, CreateVdevLayout.Draid3].includes(dataCategory.layout));
  }

  getLayoutsForVdevType(vdevType: VDevType): Observable<CreateVdevLayout[]> {
    switch (vdevType) {
      case VDevType.Cache:
        return of([CreateVdevLayout.Stripe]);
      case VDevType.Dedup:
        return this.select((state) => [state.topology[VDevType.Data].layout]);
      case VDevType.Log:
        return of([CreateVdevLayout.Mirror, CreateVdevLayout.Stripe]);
      case VDevType.Spare:
        return of([CreateVdevLayout.Stripe]);
      case VDevType.Special:
        return this.select((state) => [state.topology[VDevType.Data].layout]);
      default:
        return of(Object.values(CreateVdevLayout));
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
  getInventoryForStep(type: VDevType): Observable<DetailsDisk[]> {
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

  constructor() {
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

  resetStep(vdevType: VDevType): void {
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
      this.api.call('enclosure2.query'),
      this.diskStore.loadDisks(),
    ]).pipe(
      switchMap(([enclosures, diskDetails]) => {
        // After disks are loaded, get the SED capability status reactively
        return this.diskStore.hasSedCapableDisks$.pipe(
          take(1),
          tap((hasSedCapableDisks) => {
            this.patchState({
              isLoading: false,
              enclosures,
              hasSedCapableDisks,
            });
          }),
          // Return the original tuple type to maintain method signature
          map(() => [enclosures, diskDetails] as [Enclosure[], DiskDetailsResponse]),
        );
      }),
      tapResponse({
        next: () => {
          // State already set in switchMap
        },
        error: (error: unknown) => {
          this.patchState({ isLoading: false });
          this.errorHandler.showErrorModal(error);
        },
      }),
    );
  }

  readonly resetTopologyCategory = this.updater((state, category: VDevType) => {
    const newCategory = { ...initialTopology[category] };
    if (category === VDevType.Spare || category === VDevType.Cache) {
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

  readonly setEncryptionOptions = this.updater((state, options: {
    encryptionType: EncryptionType;
    encryption: string | null;
    sedPassword: string | null;
  }) => {
    return {
      ...state,
      ...options,
    };
  });

  readonly setHasSedCapableDisks = this.updater((state, hasSedCapableDisks: boolean) => {
    return {
      ...state,
      hasSedCapableDisks,
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
    type: VDevType,
    updates: Pick<TopologyCategoryUpdate, 'diskSize' | 'treatDiskSizeAsMinimum' | 'diskType'>,
  ): void {
    this.updateTopologyCategory(type, updates);
    this.regenerateVdevs();
  }

  setTopologyCategoryLayout(
    type: VDevType,
    newLayout: CreateVdevLayout,
  ): void {
    const isNewLayoutDraid = isDraidLayout(newLayout);
    const isOldLayoutDraid = isDraidLayout(this.get().topology[type].layout);
    if (isNewLayoutDraid !== isOldLayoutDraid) {
      this.resetTopologyCategory(type);
    }

    this.updateTopologyCategory(type, { layout: newLayout });

    if (isDraidLayout(newLayout)) {
      this.resetTopologyCategory(VDevType.Spare);
    }
  }

  setAutomaticTopologyCategory(type: VDevType, updates: TopologyCategoryUpdate): void {
    this.updateTopologyCategory(type, updates);

    this.regenerateVdevs();
  }

  setManualTopologyCategory(type: VDevType, vdevs: DetailsDisk[][]): void {
    this.updateTopologyCategory(type, {
      vdevs,
      hasCustomDiskSelection: true,
    });

    this.regenerateVdevs();
  }

  private updateTopologyCategory(type: VDevType, update: Partial<PoolManagerTopologyCategory>): void {
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
          this.resetStep(type as VDevType);
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
          this.updateTopologyCategory(type as VDevType, { vdevs });
        });
      });
  }

  openManualSelectionDialog(type: VDevType): void {
    this.state$.pipe(
      take(1),
      switchMap((state: PoolManagerState) => combineLatest([
        of(state),
        this.getInventoryForStep(type).pipe(take(1)),
      ])),
      switchMap(([state, inventoryForStep]: [PoolManagerState, DetailsDisk[]]) => {
        const usedDisks = topologyCategoryToDisks(state.topology[type]);
        const inventory = differenceBy(inventoryForStep, usedDisks, (disk: DetailsDisk) => disk.devname);
        const isVdevsLimitedToOne = type === VDevType.Spare || type === VDevType.Cache || type === VDevType.Log;
        return this.matDialog.open(ManualDiskSelectionComponent, {
          data: {
            inventory,
            layout: state.topology[type].layout,
            enclosures: state.enclosures,
            vdevs: state.topology[type].vdevs,
            vdevsLimit: isVdevsLimitedToOne ? 1 : null,
            isSedEncryption: state.encryptionType === EncryptionType.Sed,
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
