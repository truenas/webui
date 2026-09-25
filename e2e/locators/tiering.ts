/**
 * ZFS tiering locators: the Tiering side panel on the storage dashboard, the
 * tier row on the dataset details card, and the two dialogs it opens.
 *
 * All of these render only when tiering is on and the dataset sits on a pool
 * with a special vdev — except the Tiering button, which needs neither.
 */
export const tierConfigLocators = {
  /** "Tiering" in the storage dashboard's header — `[testId]="'tiering'"`. */
  open: '[data-test="button-tiering"]',

  /** Form controls, ids via the control-name fallback. */
  enabled: '[data-test="checkbox-enabled"]',
  maxConcurrentJobs: '[data-test="input-max-concurrent-jobs"]',
  maxUsedPercentage: '[data-test="input-max-used-percentage"]',
  metadataReservePct: '[data-test="input-special-class-metadata-reserve-pct"]',

  /** The side panel's Save, `[testId]="'save'"` in form-side-panel-container. */
  save: '[data-test="button-save"]',
} as const;

export const datasetTierLocators = {
  /**
   * The tier label in `ix-tier-status`, `[tnTestId]="[uniqueRowTag(), 'tier']"`.
   *
   * The details card passes no row tag, and falsy segments are dropped, so this
   * is plain `text-tier`. The share lists pass one, so theirs are not.
   */
  tier: '[data-test="text-tier"]',
  /**
   * The migration badge beside it — present only while the dataset has a
   * rewrite job. An icon for most states and text for Queued; both carry the
   * status in `aria-label` as "Migration: {status}".
   */
  migrationStatus: '[data-test="button-migration-status"]',

  /** "Change" on the details card. A plain `<button>` tagged `tnTestIdType="button"`. */
  change: '[data-test="button-change-tier"]',
} as const;

export const changeTierDialogLocators = {
  /** `<tn-dialog-shell testId="change-tier">`. What to wait on. */
  title: '[data-test="dialog-title-change-tier"]',

  datasetName: '[data-test="text-dataset-name"]',
  currentTier: '[data-test="text-current-tier"]',
  newTier: '[data-test="text-new-tier"]',

  /** `<tn-checkbox testId="move-existing-data">` — ticked when the dialog opens. */
  moveExistingData: '[data-test="checkbox-move-existing-data"]',

  apply: '[data-test="button-apply"]',
} as const;

export const migrationStatusDialogLocators = {
  /** `<tn-dialog-shell testId="data-migration-status">`. */
  title: '[data-test="dialog-title-data-migration-status"]',

  status: '[data-test="text-status"]',
  datasetName: '[data-test="text-dataset-name"]',
  targetTier: '[data-test="text-target-tier"]',

  /**
   * The shell's own close button. Not the footer's `button-close`, which is a
   * generic id any dialog behind this one could also be carrying.
   */
  close: '[data-test="button-close-data-migration-status"]',
} as const;
