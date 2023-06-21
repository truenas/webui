import { Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import {
  combineLatest, forkJoin, Observable, of,
} from 'rxjs';
import {
  map, switchMap, take, tap,
} from 'rxjs/operators';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { getNonUniqueSerialDisksWarning } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/pool-warnings/get-non-unique-serial-disks';
import { PoolCreationSeverity } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-severity';
import { PoolCreationWizardRequiredStep, PoolCreationWizardStep } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-wizard-step.enum';
import { PoolCreationError } from 'app/pages/storage/modules/pool-manager/interfaces/pool-creation-error';
import { PoolManagerWizardRequiredFormPartState } from 'app/pages/storage/modules/pool-manager/interfaces/pool-manager-wizard-form-state.interface';
import { filterAllowedDisks, hasExportedPool, hasNonUniqueSerial } from 'app/pages/storage/modules/pool-manager/utils/disk.utils';
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

  wizardRequiredStepsValidity: PoolManagerWizardRequiredFormPartState;
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
}, {} as PoolManagerState['topology']);

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
  },

  topology: initialTopology,

  wizardRequiredStepsValidity: {
    [PoolCreationWizardStep.General]: { valid: null, required: true },
    [PoolCreationWizardStep.EnclosureOptions]: { valid: null, required: false },
    [PoolCreationWizardStep.Data]: { valid: null, required: true },
  },
};

@Injectable()
export class PoolManagerStore extends ComponentStore<PoolManagerState> {
  readonly isLoading$ = this.select((state) => state.isLoading);
  readonly name$ = this.select((state) => state.name);
  readonly encryption$ = this.select((state) => state.encryption);
  readonly wizardRequiredStepsValidity$ = this.select((state) => state.wizardRequiredStepsValidity);
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

  disknumErrorMessage = helptext.manager_disknumErrorMessage;
  disknumErrorConfirmMessage = helptext.manager_disknumErrorConfirmMessage;
  disknumExtendConfirmMessage = helptext.manager_disknumExtendConfirmMessage;
  vdevtypeErrorMessage = helptext.manager_vdevtypeErrorMessage;
  exportedPoolsWarning = helptext.manager_exportedDisksWarning;

  readonly poolCreationErrors$ = combineLatest([
    this.wizardRequiredStepsValidity$,
    this.topology$,
  ])
    .pipe(
      map(([requiredSteps, topology]) => {
        const errors: PoolCreationError[] = [];

        Object.keys(requiredSteps).forEach((key: PoolCreationWizardStep) => {
          const control = requiredSteps[key as PoolCreationWizardRequiredStep];
          if (control.valid !== null && !control.valid && control.required) {
            if (key === PoolCreationWizardStep.General) {
              errors.push({ text: 'Name not added', severity: PoolCreationSeverity.Error, step: key });
            }
            if (key === PoolCreationWizardStep.EnclosureOptions) {
              errors.push({
                text: 'No Enclosure selected for a Limit Pool To A Single Enclosure.',
                severity: PoolCreationSeverity.Error,
                step: key,
              });
            }
            if (key === PoolCreationWizardStep.Data) {
              errors.push({ text: 'At least 1 data vdev is required.', severity: PoolCreationSeverity.Error, step: key });
            }
          }
        });

        const nonEmptyTopologyCategories = this.filterNonEmptyCategories(topology);

        nonEmptyTopologyCategories.forEach(([typologyCategoryType, typologyCategory], i) => {
          let dataVdevDisknum = 0;
          let dataVdevType: string;
          let firstDataVdevType: CreateVdevLayout;
          let firstDataVdevDisknum = 0;

          if (typologyCategoryType === VdevType.Data) {
            if (i === 0) {
              firstDataVdevType = typologyCategory.layout;
              dataVdevType = typologyCategory.layout;

              if (typologyCategory.vdevs.length > 0) {
                firstDataVdevDisknum = typologyCategory.vdevs.length;
              } else {
                firstDataVdevDisknum = 0;
              }
            }

            if (typologyCategory.vdevs.length > 0) {
              dataVdevDisknum = typologyCategory.vdevs.length;
              dataVdevType = typologyCategory.layout;
            } else {
              dataVdevDisknum = 0;
            }

            if (dataVdevDisknum > 0) {
              if (dataVdevDisknum !== firstDataVdevDisknum && firstDataVdevType !== CreateVdevLayout.Stripe) {
                errors.push({
                  text: `${this.translate.instant(this.disknumErrorMessage)} ${this.translate.instant('First vdev has {n} disks, new vdev has {m}', { n: firstDataVdevDisknum, m: dataVdevDisknum })}`,
                  severity: PoolCreationSeverity.Error,
                  step: PoolCreationWizardStep.Review,
                });
              }
              if (dataVdevType !== firstDataVdevType) {
                errors.push({
                  text: `${this.translate.instant(this.vdevtypeErrorMessage)} ${this.translate.instant('First vdev is a {vdevType}, new vdev is {newVdevType}', { vdevType: firstDataVdevType, newVdevType: dataVdevType })}`,
                  severity: PoolCreationSeverity.Error,
                  step: PoolCreationWizardStep.Review,
                });
              }
            }
          }

          if (
            [VdevType.Dedup, VdevType.Log, VdevType.Special, VdevType.Data].includes(typologyCategoryType)
            && typologyCategory.vdevs.length >= 1 && typologyCategory.layout === CreateVdevLayout.Stripe
          ) {
            if (typologyCategoryType === VdevType.Log) {
              errors.push({
                text: this.translate.instant('A stripe log vdev may result in data loss if it fails combined with a power outage.'),
                severity: PoolCreationSeverity.Error,
                step: PoolCreationWizardStep.Log,
              });
            } else {
              const vdevType = typologyCategoryType === 'special' ? 'metadata' : typologyCategoryType;

              errors.push({
                text: this.translate.instant('A stripe {vdevType} vdev is highly discouraged and will result in data loss if it fails', { vdevType }),
                severity: PoolCreationSeverity.Error,
                step: vdevType as PoolCreationWizardStep,
              });
            }
          }

          const nonUniqueSerialDisks = typologyCategory.vdevs.flat().filter(hasNonUniqueSerial);

          if (nonUniqueSerialDisks?.length) {
            errors.push({
              text: getNonUniqueSerialDisksWarning(nonUniqueSerialDisks, this.translate),
              severity: PoolCreationSeverity.Warning,
              step: PoolCreationWizardStep.Review,
            });
          }

          const disksWithExportedPools = typologyCategory.vdevs.flat().filter(hasExportedPool);

          if (disksWithExportedPools?.length) {
            errors.push({
              text: this.exportedPoolsWarning,
              severity: PoolCreationSeverity.Warning,
              step: PoolCreationWizardStep.Review,
            });
          }
        });

        return _.uniqBy(errors, 'text')
          .sort((a, b) => {
            const warningSeverity = PoolCreationSeverity.Warning;
            // eslint-disable-next-line no-nested-ternary
            return (a.severity === warningSeverity ? -1 : (b.severity === warningSeverity ? 1 : 0));
          });
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

  getLayoutsForVdevType(vdevLayout: VdevType): Observable<CreateVdevLayout[]> {
    switch (vdevLayout) {
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
    private translate: TranslateService,
  ) {
    super(initialState);
  }

  reset(): void {
    this.setState(initialState);
  }

  updateRequiredStepValidity(
    step: PoolCreationWizardStep,
    update: { valid?: boolean; required?: boolean },
  ): void {
    this.patchState((state) => {
      return {
        ...state,
        wizardRequiredStepsValidity: {
          ...state.wizardRequiredStepsValidity,
          [step]: {
            ...state.wizardRequiredStepsValidity[step],
            ...update,
          },
        },
      };
    });
  }

  readonly initialize = this.effect((trigger$) => {
    return trigger$.pipe(
      tap(() => this.setState({
        ...initialState,
        isLoading: true,
      })),
      switchMap(() => {
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
      }),
    );
  });

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

  private filterNonEmptyCategories(topology: PoolManagerTopology): [VdevType, PoolManagerTopologyCategory][] {
    return Object.keys(topology).reduce((acc, type) => {
      const category = topology[type as VdevType];
      if (category.vdevs.length > 0) {
        acc.push([type as VdevType, category]);
      }
      return acc;
    }, [] as [VdevType, PoolManagerTopologyCategory][]);
  }
}
