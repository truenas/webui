import { computed, Injectable, inject } from '@angular/core';
import { ValidationErrors } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { uniqBy } from 'lodash-es';
import { CreateVdevLayout, VDevType, vdevTypeLabels } from 'app/enums/v-dev-type.enum';
import { helptextPoolCreation } from 'app/helptext/storage/volumes/pool-creation/pool-creation';
import { Pool } from 'app/interfaces/pool.interface';
import {
  AddVdevsStore,
} from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
import {
  getNonUniqueSerialDisksWarning,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/pool-warnings/get-non-unique-serial-disks';
import {
  DispersalStrategy,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/2-enclosure-wizard-step/enclosure-wizard-step.component';
import { PoolCreationSeverity } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-severity';
import { PoolCreationWizardStep } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-wizard-step.enum';
import { PoolCreationError } from 'app/pages/storage/modules/pool-manager/interfaces/pool-creation-error';
import {
  PoolManagerStore,
  PoolManagerTopology,
  PoolManagerEnclosureSettings,
  PoolManagerTopologyCategory,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { hasExportedPool, hasNonUniqueSerial } from 'app/pages/storage/modules/pool-manager/utils/disk.utils';
import {
  existingVdevLayout, isDraidLayout, layoutParity, resolveTopologyLayout,
} from 'app/pages/storage/modules/pool-manager/utils/topology.utils';
import { AppState } from 'app/store';
import { selectHasEnclosureSupport } from 'app/store/system-info/system-info.selectors';

const incompleteCategoryRules: { vdevType: VDevType; step: PoolCreationWizardStep }[] = [
  { vdevType: VDevType.Log, step: PoolCreationWizardStep.Log },
  { vdevType: VDevType.Spare, step: PoolCreationWizardStep.Spare },
  { vdevType: VDevType.Cache, step: PoolCreationWizardStep.Cache },
  { vdevType: VDevType.Special, step: PoolCreationWizardStep.Metadata },
  { vdevType: VDevType.Dedup, step: PoolCreationWizardStep.Dedup },
];

type AllocClassVdev = VDevType.Special | VDevType.Dedup;
const allocClassVdevs: readonly AllocClassVdev[] = [VDevType.Special, VDevType.Dedup];

interface AllocClassRule {
  step: PoolCreationWizardStep;
  redundancyMismatchText: string;
  mixedLayoutText: string;
}

const allocClassRules: Record<AllocClassVdev, AllocClassRule> = {
  [VDevType.Special]: {
    step: PoolCreationWizardStep.Metadata,
    redundancyMismatchText: helptextPoolCreation.specialRedundancyMismatchWarning,
    mixedLayoutText: helptextPoolCreation.specialMixedLayoutWarning,
  },
  [VDevType.Dedup]: {
    step: PoolCreationWizardStep.Dedup,
    redundancyMismatchText: helptextPoolCreation.dedupRedundancyMismatchWarning,
    mixedLayoutText: helptextPoolCreation.dedupMixedLayoutWarning,
  },
};

/**
 * Layout parity (drive failures the layout can survive) for the given width,
 * or null when parity cannot yet be determined. Currently only Mirror without
 * a chosen width yields null — Stripe, RAIDZN and dRAIDN are layout-determined
 * and parity for them is independent of width. Sharing this between the data
 * resolver and the per-category check keeps both deferring on identical
 * conditions.
 */
function parityFromLayoutWidth(
  layout: CreateVdevLayout,
  width: number | null | undefined,
): number | null {
  if (layout === CreateVdevLayout.Mirror && width == null) {
    return null;
  }
  return layoutParity(layout, width ?? 0);
}

/**
 * Parity for a topology category, or null if neither a layout nor a width resolves. The disk count in
 * `vdevs` wins over `width`, which manual selection can leave stale; with several vdevs the smallest
 * gives the worst-case parity, the conservative choice for a warning.
 */
function parityFromCategory(category: PoolManagerTopologyCategory): number | null {
  if (!category.layout) {
    return null;
  }
  let effectiveWidth: number | null = null;
  // A committed vdev should always carry at least one disk; filter empty
  // vdev arrays to avoid a phantom width=0 being passed to layoutParity.
  const nonEmptyVdevs = category.vdevs.filter((vdev) => vdev.length > 0);
  if (nonEmptyVdevs.length) {
    effectiveWidth = Math.min(...nonEmptyVdevs.map((vdev) => vdev.length));
  } else if (category.width != null) {
    effectiveWidth = category.width;
  }
  return parityFromLayoutWidth(category.layout, effectiveWidth);
}

@Injectable()
export class PoolManagerValidationService {
  protected store = inject(PoolManagerStore);
  protected systemStore$ = inject<Store<AppState>>(Store);
  protected translate = inject(TranslateService);
  private addVdevsStore = inject(AddVdevsStore);

  exportedPoolsWarning = this.translate.instant(helptextPoolCreation.exportedSelectedDisksWarning);

  private hasEnclosureSupport = this.systemStore$.selectSignal(selectHasEnclosureSupport);

  readonly poolCreationErrors = computed(() => {
    const existingPool = this.addVdevsStore.pool();
    const topology = this.store.topology();
    const errors: PoolCreationError[] = [];

    errors.push(...this.parseNameErrors(this.store.nameErrors()));
    errors.push(...this.parseEnclosureErrors(
      this.store.enclosureSettings(),
      this.store.hasMultipleEnclosuresAfterFirstStep(),
      this.hasEnclosureSupport(),
    ));
    errors.push(...this.validateMinVdevsLimit(existingPool, topology));
    if (!existingPool) {
      errors.push(...this.validateNewPoolVdevs(topology));
    } else {
      errors.push(...this.validateAddVdevs(topology));
    }
    errors.push(...this.validateRedundancyMismatch(topology, existingPool));
    errors.push(...this.validateMixedAllocClassLayout(topology, existingPool));
    errors.push(...this.validateIncompleteCategories(topology));

    return uniqBy(errors, 'text')
      .sort((a, b) => {
        const warningSeverity = PoolCreationSeverity.Warning;
        if (a.severity === warningSeverity) {
          return -1;
        }
        return b.severity === warningSeverity ? 1 : 0;
      });
  });

  readonly topLevelWarningsForEachStep = computed(() => {
    return this.firstErrorTextForEachStep((errors, step) => this.filterWarningsTypeByStep(errors, step));
  });

  readonly topLevelErrorsForEachStep = computed(() => {
    return this.firstErrorTextForEachStep((errors, step) => this.filterErrorsTypeByStep(errors, step));
  });

  private parseNameErrors(nameErrors: ValidationErrors | null): PoolCreationError[] {
    const errors: PoolCreationError[] = [];

    if (nameErrors?.required) {
      errors.push({
        text: this.translate.instant('Name not added'),
        severity: PoolCreationSeverity.Error,
        step: PoolCreationWizardStep.General,
      });
    }

    if (nameErrors?.invalidPoolName) {
      errors.push({
        text: this.translate.instant('Invalid pool name'),
        severity: PoolCreationSeverity.Error,
        step: PoolCreationWizardStep.General,
      });
    }
    return errors;
  }

  private validateNewPoolVdevs(topology: PoolManagerTopology): PoolCreationError[] {
    const errors: PoolCreationError[] = [];
    const nonEmptyTopologyCategories = this.filterNonEmptyCategories(topology);

    nonEmptyTopologyCategories.forEach(([topologyCategoryType, topologyCategory]) => {
      if (topologyCategoryType === VDevType.Data && isDraidLayout(topologyCategory.layout)) {
        errors.push(...this.validateDraid(topologyCategory));
      }
      errors.push(...this.validateStripeVdevsWarning(topologyCategory, topologyCategoryType));
      errors.push(...this.validateDuplicateSerialDiskVdevs(topologyCategory));
      errors.push(...this.validateExportedPoolDiskVdevs(topologyCategory));
    });
    return errors;
  }

  private parseEnclosureErrors(
    enclosure: PoolManagerEnclosureSettings,
    hasMultipleEnclosures: boolean,
    hasEnclosureSupport: boolean,
  ): PoolCreationError[] {
    const errors: PoolCreationError[] = [];
    if (
      enclosure.limitToSingleEnclosure === null
      && enclosure.dispersalStrategy === DispersalStrategy.LimitToSingle
      && (hasMultipleEnclosures && hasEnclosureSupport)
    ) {
      errors.push({
        text: this.translate.instant('An enclosure must be selected when \'Limit Pool to a Single Enclosure\' is enabled.'),
        severity: PoolCreationSeverity.Error,
        step: PoolCreationWizardStep.EnclosureOptions,
      });
    }
    return errors;
  }

  private validateMinVdevsLimit(
    existingPool: Pool | null,
    topology: PoolManagerTopology,
  ): PoolCreationError[] {
    const errors: PoolCreationError[] = [];
    if (existingPool) {
      const hasAtleastOneVdev = Object.values(VDevType).some((vdevType) => topology[vdevType]?.vdevs.length > 0);
      if (!hasAtleastOneVdev) {
        errors.push({
          text: this.translate.instant('At least 1 vdev is required to make an update to the pool.'),
          severity: PoolCreationSeverity.Error,
          step: PoolCreationWizardStep.Review,
        });
      }
    } else if (topology[VDevType.Data].vdevs.length === 0) {
      errors.push({
        text: this.translate.instant('At least 1 data VDEV is required.'),
        severity: PoolCreationSeverity.Error,
        step: PoolCreationWizardStep.Data,
      });
    }
    return errors;
  }

  private validateDuplicateSerialDiskVdevs(topologyCategory: PoolManagerTopologyCategory): PoolCreationError[] {
    const errors: PoolCreationError[] = [];
    const nonUniqueSerialDisks = topologyCategory.vdevs.flat().filter(hasNonUniqueSerial);

    if (nonUniqueSerialDisks?.length) {
      errors.push({
        text: getNonUniqueSerialDisksWarning(nonUniqueSerialDisks, this.translate),
        severity: PoolCreationSeverity.Warning,
        step: PoolCreationWizardStep.Review,
      });
    }
    return errors;
  }

  private validateStripeVdevsWarning(
    topologyCategory: PoolManagerTopologyCategory,
    topologyCategoryType: VDevType,
  ): PoolCreationError[] {
    const errors: PoolCreationError[] = [];
    const hasVdevs = topologyCategory.vdevs.length >= 1;
    const hasStripeLayout = topologyCategory.layout === CreateVdevLayout.Stripe;
    if (hasVdevs && hasStripeLayout) {
      if (topologyCategoryType === VDevType.Log) {
        errors.push({
          text: this.translate.instant(
            'A stripe log VDEV may result in data loss if it fails combined with a power outage.',
          ),
          severity: PoolCreationSeverity.Warning,
          step: PoolCreationWizardStep.Log,
        });
      }
      if ([VDevType.Dedup, VDevType.Special, VDevType.Data].includes(topologyCategoryType)) {
        const vdevType = topologyCategoryType === VDevType.Special ? 'metadata' : topologyCategoryType;
        errors.push({
          text: this.translate.instant('A stripe {vdevType} VDEV is highly discouraged and will result in data loss if it fails', { vdevType }),
          severity: PoolCreationSeverity.ErrorWarning,
          step: vdevType as PoolCreationWizardStep,
        });
      }
    }
    return errors;
  }

  private validateExportedPoolDiskVdevs(topologyCategory: PoolManagerTopologyCategory): PoolCreationError[] {
    const errors: PoolCreationError[] = [];
    const disksWithExportedPools = topologyCategory.vdevs.flat().filter(hasExportedPool);

    if (disksWithExportedPools?.length) {
      errors.push({
        text: this.exportedPoolsWarning,
        severity: PoolCreationSeverity.Warning,
        step: PoolCreationWizardStep.Review,
      });
    }
    return errors;
  }

  private firstErrorTextForEachStep(
    filterByStep: (errors: PoolCreationError[], step: PoolCreationWizardStep) => PoolCreationError[],
  ): Partial<Record<PoolCreationWizardStep, string | null>> {
    const errors = this.poolCreationErrors();
    const result: Partial<Record<PoolCreationWizardStep, string | null>> = {};

    Object.values(PoolCreationWizardStep).forEach((step: PoolCreationWizardStep) => {
      result[step] = filterByStep(errors, step)?.[0]?.text || null;
    });

    return result;
  }

  private filterWarningsTypeByStep(errors: PoolCreationError[], step: PoolCreationWizardStep): PoolCreationError[] {
    return errors.filter((error) => error.severity !== PoolCreationSeverity.Error && error.step === step);
  }

  private filterErrorsTypeByStep(errors: PoolCreationError[], step: PoolCreationWizardStep): PoolCreationError[] {
    return errors.filter((error) => error.severity === PoolCreationSeverity.Error && error.step === step);
  }

  private filterNonEmptyCategories(topology: PoolManagerTopology): [VDevType, PoolManagerTopologyCategory][] {
    return Object.keys(topology).reduce((acc, type) => {
      const category = topology[type as VDevType];
      if (category.vdevs.length > 0) {
        acc.push([type as VDevType, category]);
      }
      return acc;
    }, [] as [VDevType, PoolManagerTopologyCategory][]);
  }

  private validateDraid(topologyCategory: PoolManagerTopologyCategory): PoolCreationError[] {
    const errors: PoolCreationError[] = [];
    const powerOfTwo = Math.log2(Number(topologyCategory.draidDataDisks));
    if (powerOfTwo < 1 || !Number.isInteger(powerOfTwo)) {
      errors.push({
        text: this.translate.instant('Recommended number of data disks for optimal space allocation should be a power of 2 (2, 4, 8, 16...).'),
        severity: PoolCreationSeverity.Warning,
        step: PoolCreationWizardStep.Data,
      });
    }

    if (Number(topologyCategory.width) < 10) {
      errors.push({
        text: this.translate.instant('For dRAID\'s benefits to outweigh those of RaidZ, we recommend at least 10 disks per dRAID vdev.'),
        severity: PoolCreationSeverity.Warning,
        step: PoolCreationWizardStep.Data,
      });
    }

    if (!topologyCategory.draidSpareDisks) {
      errors.push({
        text: this.translate.instant('At least one distributed spare is recommended for dRAID. Distributed spares cannot be added after the pool is created.'),
        severity: PoolCreationSeverity.Warning,
        step: PoolCreationWizardStep.Data,
      });
    }

    return errors;
  }

  private validateAddVdevs(topology: PoolManagerTopology): PoolCreationError[] {
    const errors: PoolCreationError[] = [];
    const nonEmptyTopologyCategories = this.filterNonEmptyCategories(topology);

    nonEmptyTopologyCategories.forEach(([topologyCategoryType, topologyCategory]) => {
      errors.push(...this.validateAddVdevRedundancy(topologyCategory, topologyCategoryType));
    });

    return errors;
  }

  /**
   * Flags an optional category with a picked disk size but no vdevs, e.g. after the data-parity lock
   * cleared its vdevs, or after the user cleared it when adding vdevs. Otherwise Review would silently
   * omit the category with no error on the step.
   */
  private validateIncompleteCategories(topology: PoolManagerTopology): PoolCreationError[] {
    const messageTemplate = T('{vdevType} VDEV configuration is incomplete. Complete the layout, width and number of VDEVs.');

    const errors: PoolCreationError[] = [];
    incompleteCategoryRules.forEach(({ vdevType, step }) => {
      const category = topology[vdevType];
      if (!category) {
        return;
      }
      const hasNoVdevs = !category.vdevs?.length;
      if (hasNoVdevs && this.isCategoryPartiallyConfigured(category)) {
        const vdevTypeLabel = this.translate.instant(vdevTypeLabels.get(vdevType) ?? vdevType);
        errors.push({
          text: this.translate.instant(messageTemplate, { vdevType: vdevTypeLabel }),
          severity: PoolCreationSeverity.Error,
          step,
        });
      }
    });
    return errors;
  }

  /**
   * Whether the user touched any of the category's configurable fields. `layout` doesn't count, since it
   * can be set programmatically (a sole allowed layout, or Stripe preloaded for Spare/Cache), nor does an
   * auto-selected disk size. `!= null` lets partial test fixtures read as untouched; production state
   * never leaves these undefined.
   */
  private isCategoryPartiallyConfigured(category: PoolManagerTopologyCategory): boolean {
    const hasPickedDiskSize = !category.isDiskSizeAutoSelected
      && (category.diskSize != null || category.diskType != null);

    return hasPickedDiskSize
      || category.width != null
      || category.vdevsNumber != null
      || category.draidDataDisks != null
      || category.draidSpareDisks != null
      || category.treatDiskSizeAsMinimum === true;
  }

  private validateAddVdevRedundancy(
    topologyCategory: PoolManagerTopologyCategory,
    topologyCategoryType: VDevType,
  ): PoolCreationError[] {
    const errors: PoolCreationError[] = [];
    const hasVdevs = topologyCategory.vdevs.length >= 1;
    const hasStripeLayout = topologyCategory.layout === CreateVdevLayout.Stripe;

    if (hasVdevs && hasStripeLayout) {
      if (topologyCategoryType === VDevType.Special) {
        errors.push({
          text: this.translate.instant(helptextPoolCreation.addVdevStripeSpecialWarning),
          severity: PoolCreationSeverity.ErrorWarning,
          step: PoolCreationWizardStep.Metadata,
        });
      } else if (topologyCategoryType === VDevType.Dedup) {
        errors.push({
          text: this.translate.instant(helptextPoolCreation.addVdevStripeDedupWarning),
          severity: PoolCreationSeverity.ErrorWarning,
          step: PoolCreationWizardStep.Dedup,
        });
      }
    }

    return errors;
  }

  /**
   * NAS-140839 / ER-72 — special and dedup vdevs may now be created with any
   * non-stripe redundancy regardless of the data vdev's parity. When the
   * special/dedup parity is lower than data parity, surface a non-blocking
   * warning so the user is aware that losing the metadata vdev would still
   * destroy the pool.
   */
  private validateRedundancyMismatch(
    topology: PoolManagerTopology,
    existingPool: Pool | null,
  ): PoolCreationError[] {
    const errors: PoolCreationError[] = [];
    const dataParity = this.resolveDataParity(topology, existingPool);
    // dataParity === 0 means data is Stripe; nothing can be lower than 0, so
    // skipping the loop is equivalent to running it but makes the intent
    // explicit (and avoids implying Stripe data ever produces a mismatch).
    if (dataParity === null || dataParity <= 0) {
      return errors;
    }

    allocClassVdevs.forEach((vdevType) => {
      const category = topology[vdevType];
      if (!category?.vdevs.length || !category.layout) {
        return;
      }
      // Stripe is handled by validateStripeVdevsWarning / validateAddVdevRedundancy
      // with its own dedicated message; don't double-warn here.
      if (category.layout === CreateVdevLayout.Stripe) {
        return;
      }
      const categoryParity = parityFromCategory(category);
      if (categoryParity === null) {
        return;
      }
      if (categoryParity < dataParity) {
        const rule = allocClassRules[vdevType];
        errors.push({
          text: this.translate.instant(rule.redundancyMismatchText),
          severity: PoolCreationSeverity.Warning,
          step: rule.step,
        });
      }
    });

    return errors;
  }

  /**
   * NAS-140839 / ER-72 — adding a special/dedup vdev whose layout differs from
   * the existing pool's special/dedup layout is allowed but warned about. The
   * topology category carries a single layout, so mixing can only arise in the
   * add-vdev flow against an already-populated pool category.
   */
  private validateMixedAllocClassLayout(
    topology: PoolManagerTopology,
    existingPool: Pool | null,
  ): PoolCreationError[] {
    const errors: PoolCreationError[] = [];
    if (!existingPool) {
      return errors;
    }

    allocClassVdevs.forEach((vdevType) => {
      const category = topology[vdevType];
      if (!category?.vdevs.length || !category.layout) {
        return;
      }
      // Asymmetric skip: only suppress when the *new* category is Stripe —
      // that case already gets validateAddVdevRedundancy's dedicated SPOF
      // message and we don't want to double-warn. If the existing pool's
      // class is Stripe and the new vdev is non-stripe, mixing within an
      // existing Stripe class is itself a real concern, so we still warn.
      if (category.layout === CreateVdevLayout.Stripe) {
        return;
      }
      const existingLayout = existingVdevLayout(existingPool.topology?.[vdevType]);
      if (existingLayout !== null && existingLayout !== category.layout) {
        const rule = allocClassRules[vdevType];
        errors.push({
          text: this.translate.instant(rule.mixedLayoutText),
          severity: PoolCreationSeverity.Warning,
          step: rule.step,
        });
      }
    });

    return errors;
  }

  private resolveDataParity(topology: PoolManagerTopology, existingPool: Pool | null): number | null {
    const existingDataVdevs = existingPool?.topology?.[VDevType.Data];
    if (existingDataVdevs?.length) {
      const layout = resolveTopologyLayout(existingDataVdevs);
      if (layout === null) {
        return null;
      }
      // Existing vdevs always carry children; the fallback of 2 (parity 1) only covers malformed payloads,
      // since `validateRedundancyMismatch` skips `dataParity <= 0` and 1 would hide every Mirror warning.
      // Not via parityFromCategory: existing vdevs keep their disk count in `children`, not `vdevs[][]`.
      const width = existingDataVdevs[0].children?.length ?? 2;
      return layoutParity(layout, width);
    }

    // Existing pool with an empty data array (or no existing pool) falls
    // through to the wizard category. In add-vdev mode the wizard's data
    // category is unset, so we return null and the mismatch warning is
    // suppressed until parity can actually be resolved.
    const dataCategory = topology[VDevType.Data];
    if (!dataCategory) {
      return null;
    }
    return parityFromCategory(dataCategory);
  }
}
