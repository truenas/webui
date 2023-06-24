import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import {
  Observable, combineLatest, map,
} from 'rxjs';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { getNonUniqueSerialDisksWarning } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/pool-warnings/get-non-unique-serial-disks';
import { DispersalStrategy } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/2-enclosure-wizard-step/enclosure-wizard-step.component';
import { PoolCreationSeverity } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-severity';
import { PoolCreationWizardStep } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-wizard-step.enum';
import { PoolCreationError } from 'app/pages/storage/modules/pool-manager/interfaces/pool-creation-error';
import { PoolManagerStore, PoolManagerTopology, PoolManagerTopologyCategory } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { hasExportedPool, hasNonUniqueSerial } from 'app/pages/storage/modules/pool-manager/utils/disk.utils';
import { AppState } from 'app/store';
import { waitForSystemFeatures } from 'app/store/system-info/system-info.selectors';

@Injectable()
export class PoolManagerValidationService {
  constructor(
    protected store: PoolManagerStore,
    protected systemStore$: Store<AppState>,
    protected translate: TranslateService,
  ) {}

  exportedPoolsWarning = helptext.manager_exportedSelectedDisksWarning;

  readonly poolCreationErrors$ = combineLatest([
    this.store.select((state) => state.name),
    this.store.select((state) => state.topology),
    this.store.select((state) => state.enclosureSettings),
    this.store.topology$.pipe(map((topology) => topology[VdevType.Data].vdevs.length > 0)),
    combineLatest([
      this.store.hasMultipleEnclosuresAfterFirstStep$,
      this.systemStore$.pipe(waitForSystemFeatures, map((features) => features.enclosure)),
    ]),
  ])
    .pipe(
      map(([name, topology, enclosure, hasDataVdevs, [hasMultipleEnclosures, hasEnclosureSupport]]) => {
        const errors: PoolCreationError[] = [];

        if (!name) {
          errors.push({
            text: this.translate.instant('Name not added'),
            severity: PoolCreationSeverity.Error,
            step: PoolCreationWizardStep.General,
          });
        }

        if (
          enclosure.limitToSingleEnclosure === null
          && enclosure.dispersalStrategy === DispersalStrategy.LimitToSingle
          && (hasMultipleEnclosures && hasEnclosureSupport)
        ) {
          errors.push({
            text: this.translate.instant('No Enclosure selected for a Limit Pool To A Single Enclosure.'),
            severity: PoolCreationSeverity.Error,
            step: PoolCreationWizardStep.EnclosureOptions,
          });
        }

        if (!hasDataVdevs) {
          errors.push({
            text: this.translate.instant('At least 1 data vdev is required.'),
            severity: PoolCreationSeverity.Error,
            step: PoolCreationWizardStep.Data,
          });
        }

        const nonEmptyTopologyCategories = this.filterNonEmptyCategories(topology);

        nonEmptyTopologyCategories.forEach(([typologyCategoryType, typologyCategory]) => {
          if (
            [VdevType.Dedup, VdevType.Log, VdevType.Special, VdevType.Data].includes(typologyCategoryType)
            && typologyCategory.vdevs.length >= 1 && typologyCategory.layout === CreateVdevLayout.Stripe
          ) {
            if (typologyCategoryType === VdevType.Log) {
              errors.push({
                text: this.translate.instant('A stripe log vdev may result in data loss if it fails combined with a power outage.'),
                severity: PoolCreationSeverity.Warning,
                step: PoolCreationWizardStep.Log,
              });
            } else {
              const vdevType = typologyCategoryType === 'special' ? 'metadata' : typologyCategoryType;

              errors.push({
                text: this.translate.instant('A stripe {vdevType} vdev is highly discouraged and will result in data loss if it fails', { vdevType }),
                severity: PoolCreationSeverity.ErrorWarning,
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

  getPoolCreationErrors(): Observable<PoolCreationError[]> {
    return this.poolCreationErrors$;
  }

  getTopLevelWarningsForEachStep(): Observable<Partial<{ [key in PoolCreationWizardStep]: string | null }>> {
    return this.poolCreationErrors$.pipe(
      map((errors) => {
        const result: Partial<{ [key in PoolCreationWizardStep]: string | null }> = {};

        Object.values(PoolCreationWizardStep).forEach((step: PoolCreationWizardStep) => {
          result[step] = this.filterWarningsTypeByStep(errors, step)?.[0]?.text || null;
        });

        return result;
      }),
    );
  }

  getTopLevelErrorsForEachStep(): Observable<Partial<{ [key in PoolCreationWizardStep]: string | null }>> {
    return this.poolCreationErrors$.pipe(
      map((errors) => {
        const result: Partial<{ [key in PoolCreationWizardStep]: string | null }> = {};

        Object.values(PoolCreationWizardStep).forEach((step: PoolCreationWizardStep) => {
          result[step] = this.filterErrorsTypeByStep(errors, step)?.[0]?.text || null;
        });

        return result;
      }),
    );
  }

  private filterWarningsTypeByStep(errors: PoolCreationError[], step: PoolCreationWizardStep): PoolCreationError[] {
    return errors.filter((error) => error.severity !== PoolCreationSeverity.Error && error.step === step);
  }

  private filterErrorsTypeByStep(errors: PoolCreationError[], step: PoolCreationWizardStep): PoolCreationError[] {
    return errors.filter((error) => error.severity === PoolCreationSeverity.Error && error.step === step);
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
