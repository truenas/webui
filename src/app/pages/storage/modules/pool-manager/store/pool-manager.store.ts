import {
  computed, DestroyRef, Injectable, Signal, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ValidationErrors } from '@angular/forms';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { TnDialog } from '@truenas/ui-components';
import { differenceBy, isEqual, without } from 'lodash-es';
import {
  forkJoin, Observable, pipe, Subject,
} from 'rxjs';
import {
  filter, map, switchMap, tap,
} from 'rxjs/operators';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, VDevType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Enclosure, toEnclosure } from 'app/interfaces/enclosure.interface';
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
  // True while `diskSize`/`diskType` hold the sole option the wizard filled in by itself,
  // rather than one the user picked.
  isDiskSizeAutoSelected: boolean;
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
  encryptionType: EncryptionType;
  sedPassword: string | null;
  hasSedCapableDisks: boolean;
  diskSettings: PoolManagerDiskSettings;
  enclosureSettings: PoolManagerEnclosureSettings;
  topology: PoolManagerTopology;
  categorySequence: VDevType[];
  // Community Edition only: bypasses topology policy checks. Never set on Enterprise.
  forceTopology: boolean;
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
      isDiskSizeAutoSelected: false,
      vdevsNumber: null,
      treatDiskSizeAsMinimum: false,
      vdevs: [] as DetailsDisk[][],
      hasCustomDiskSelection: false,

      draidDataDisks: null,
      draidSpareDisks: null,
    } as PoolManagerTopologyCategory,
  };
}, {} as PoolManagerTopology);

export const initialState: PoolManagerState = {
  isLoading: false,
  enclosures: [],
  name: '',
  nameErrors: null,
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

  forceTopology: false,
};

@Injectable()
export class PoolManagerStore {
  private diskStore = inject(DiskStore);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private generateVdevs = inject(GenerateVdevsService);
  private tnDialog = inject(TnDialog);
  private destroyRef = inject(DestroyRef);

  private readonly state = signalState(initialState);

  readonly startOver$ = new Subject<void>();
  readonly resetStep$ = new Subject<VDevType>();
  readonly isLoading = this.state.isLoading;
  readonly name = this.state.name;
  readonly nameErrors = this.state.nameErrors;
  readonly encryptionType = this.state.encryptionType;
  readonly sedPassword = this.state.sedPassword;
  readonly hasSedCapableDisks = this.state.hasSedCapableDisks;
  readonly enclosures = this.state.enclosures;
  readonly topology = this.state.topology;
  readonly diskSettings = this.state.diskSettings;
  readonly enclosureSettings = this.state.enclosureSettings;
  readonly forceTopology = this.state.forceTopology;
  readonly categorySequence = this.state.categorySequence;
  readonly totalUsableCapacity = computed(() => categoryCapacity(this.state.topology()[VDevType.Data]));

  readonly allowedDisks = computed(() => filterAllowedDisks(this.diskStore.selectableDisks(), {
    ...this.state.diskSettings(),
    ...this.state.enclosureSettings(),
    requireSedCapable: this.state.encryptionType() === EncryptionType.Sed,
  }));

  readonly hasMultipleEnclosuresAfterFirstStep = computed(() => {
    const disksAfterFirstStep = filterAllowedDisks(this.diskStore.selectableDisks(), {
      ...this.state.diskSettings(),
      limitToSingleEnclosure: null,
    });
    const uniqueEnclosures = new Set<string>();
    disksAfterFirstStep.forEach((disk) => {
      if (disk.enclosure) {
        uniqueEnclosures.add(disk.enclosure.id);
      }
    });
    return uniqueEnclosures.size > 1;
  });

  readonly inventory = computed(() => {
    const usedDisks = topologyToDisks(this.state.topology());
    return differenceBy(this.allowedDisks(), usedDisks, (disk) => disk.devname);
  });

  getInventoryForStep(type: VDevType): Signal<DetailsDisk[]> {
    return computed(() => this.inventoryForStep(type));
  }

  resetStoreToInitialState(): void {
    patchState(this.state, initialState);
  }

  startOver(): void {
    this.startOver$.next();
    this.initialize();
  }

  resetStep(vdevType: VDevType): void {
    this.resetTopologyCategory(vdevType);
    this.resetStep$.next(vdevType);
  }

  readonly initialize = rxMethod<void>(pipe(
    tap(() => patchState(this.state, { ...initialState, isLoading: true })),
    switchMap(() => this.loadStateInitialData()),
  ));

  private loadStateInitialData(): Observable<unknown> {
    return forkJoin([
      this.api.query('enclosure2.query').pipe(map((enclosures) => enclosures.map(toEnclosure))),
      this.diskStore.loadDisks(),
    ]).pipe(
      // Not `finalize`: a restart unsubscribes the previous load after the new one has set `isLoading`.
      tapResponse({
        next: ([enclosures]) => {
          patchState(this.state, {
            isLoading: false,
            enclosures,
            hasSedCapableDisks: this.diskStore.hasSedCapableDisks(),
          });
        },
        error: (error: unknown) => {
          patchState(this.state, { isLoading: false });
          this.errorHandler.showErrorModal(error);
        },
      }),
    );
  }

  resetTopologyCategory(category: VDevType): void {
    const newCategory = { ...initialTopology[category] };
    if (category === VDevType.Spare || category === VDevType.Cache) {
      newCategory.layout = CreateVdevLayout.Stripe;
    }
    patchState(this.state, (state) => ({
      topology: {
        ...state.topology,
        [category]: newCategory,
      },
    }));
  }

  resetTopology(): void {
    patchState(this.state, { topology: initialTopology });
  }

  setGeneralOptions(options: Pick<PoolManagerState, 'nameErrors' | 'name'>): void {
    patchState(this.state, options);
  }

  setEncryptionOptions(options: {
    encryptionType: EncryptionType;
    sedPassword: string | null;
  }): void {
    patchState(this.state, options);
    this.resetTopologyIfNotEnoughDisks();
  }

  setHasSedCapableDisks(hasSedCapableDisks: boolean): void {
    patchState(this.state, { hasSedCapableDisks });
  }

  setDiskWarningOptions(diskOptions: PoolManagerDiskSettings): void {
    patchState(this.state, {
      diskSettings: diskOptions,
    });

    this.resetTopologyIfNotEnoughDisks();
  }

  setForceTopology(forceTopology: boolean): void {
    patchState(this.state, { forceTopology });
  }

  setEnclosureOptions(enclosureOptions: PoolManagerEnclosureSettings): void {
    patchState(this.state, {
      enclosureSettings: enclosureOptions,
    });

    this.resetTopologyIfNotEnoughDisks();
  }

  setTopologyCategoryDiskSizes(
    type: VDevType,
    updates: Pick<
      TopologyCategoryUpdate,
      'diskSize' | 'treatDiskSizeAsMinimum' | 'diskType' | 'isDiskSizeAutoSelected'
    >,
  ): void {
    this.updateTopologyCategory(type, updates);
    this.regenerateVdevs();
  }

  setTopologyCategoryLayout(
    type: VDevType,
    newLayout: CreateVdevLayout,
  ): void {
    const isNewLayoutDraid = isDraidLayout(newLayout);
    const isOldLayoutDraid = isDraidLayout(this.state.topology()[type].layout);
    if (isNewLayoutDraid !== isOldLayoutDraid) {
      this.resetTopologyCategory(type);
    }

    this.updateTopologyCategory(type, { layout: newLayout });
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

  private inventoryForStep(type: VDevType): DetailsDisk[] {
    const topology = this.state.topology();
    const disksUsedInOtherCategories = Object.values(topology).flatMap((category) => {
      if (category === topology[type]) {
        return [];
      }
      return topologyCategoryToDisks(category);
    });
    return differenceBy(this.allowedDisks(), disksUsedInOtherCategories, (disk) => disk.devname);
  }

  private updateTopologyCategory(type: VDevType, update: Partial<PoolManagerTopologyCategory>): void {
    patchState(this.state, (state) => {
      const topology = state.topology[type];
      const wasCategoryChanged = !Object.entries(update)
        .every(([key, value]) => isEqual(topology[key as keyof typeof topology], value));
      const categorySequence = wasCategoryChanged
        ? without(state.categorySequence, type).concat([type])
        : state.categorySequence;

      return {
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
    const allowedDisks = this.allowedDisks();
    Object.entries(this.state.topology()).forEach(([type, category]) => {
      const usedDisks = topologyCategoryToDisks(category);
      if (usedDisks.some((disk) => !allowedDisks.includes(disk))) {
        this.resetStep(type as VDevType);
      }
    });
  }

  /**
   * Regenerates the vdevs for all categories.
   * Regeneration of all categories is needed because user may use maximizeEnclosureDispersal option.
   * In this case the vdevs of one category may affect the vdevs of another category.
   */
  private regenerateVdevs(): void {
    const newVdevs = this.generateVdevs.generateVdevs({
      allowedDisks: this.allowedDisks(),
      topology: this.state.topology(),
      maximizeDispersal: this.state.enclosureSettings().maximizeEnclosureDispersal,
      categorySequence: this.state.categorySequence(),
    });
    Object.entries(newVdevs).forEach(([type, vdevs]) => {
      this.updateTopologyCategory(type as VDevType, { vdevs });
    });
  }

  openManualSelectionDialog(type: VDevType): void {
    const category = this.state.topology()[type];
    const usedDisks = topologyCategoryToDisks(category);
    const inventory = differenceBy(this.inventoryForStep(type), usedDisks, (disk: DetailsDisk) => disk.devname);
    const isVdevsLimitedToOne = type === VDevType.Spare || type === VDevType.Cache || type === VDevType.Log;

    this.tnDialog.open(ManualDiskSelectionComponent, {
      data: {
        inventory,
        layout: category.layout,
        enclosures: this.state.enclosures(),
        vdevs: category.vdevs,
        vdevsLimit: isVdevsLimitedToOne ? 1 : null,
        isSedEncryption: this.state.encryptionType() === EncryptionType.Sed,
      } as ManualDiskSelectionParams,
      panelClass: 'manual-selection-dialog',
    }).closed.pipe(
      filter(Boolean),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((customVdevs: DetailsDisk[][]) => {
      if (!customVdevs.length) {
        this.resetStep(type);
      } else {
        this.setManualTopologyCategory(type, customVdevs);
      }
    });
  }
}
