/**
 * Pool creation wizard, dataset form and SMB share form locators.
 *
 * Two derivations worth knowing when reading these (see `locators/signin.ts`
 * for the type-prefixing rule they build on):
 *
 * 1. A form control with no explicit `testId` falls back to its bound control
 *    name (`controlTestId`). So `<tn-input formControlName="name">` emits
 *    `data-test="input-name"` with nothing declared in the template.
 * 2. Select options are `option-<base>-<key>`, kebab-cased by the library's own
 *    `kebabTestSegment` — which is NOT lodash. `RAIDZ2` normalizes to `raidz2`,
 *    not `raidz-2`. webui's legacy `[ixTest]` does use lodash and would differ.
 */

export const poolWizardLocators = {
  /**
   * "Create Pool" on the storage dashboard — the way into the wizard.
   *
   * A `tn-button` that pins `tnTestIdType="link"` rather than taking the
   * default `button`, because it navigates.
   */
  createPoolEntry: '[data-test="link-create-pool"]',

  /** Step 1 — `<tn-input formControlName="name">`, id via control-name fallback. */
  name: '[data-test="input-name"]',
  next: '[data-test="button-next-general"]',

  /** Step 3 — data vdev layout. `[testId]="['layout']"` on a tn-select. */
  layout: '[data-test="select-layout"]',
  /**
   * `raidz-2`, not `raidz2`.
   *
   * This select passes `[optionTestIdKey]="optionTestIdByKebabLabel"`, which is
   * `(option) => kebabCase(option.label)` using **lodash**. lodash splits
   * letters from digits, so the label `RAIDZ2` becomes `raidz-2` before the
   * library's own `kebabTestSegment` ever sees it — and that normalizer would
   * have produced `raidz2`.
   *
   * Two normalizers are in play across this codebase and they disagree on
   * exactly this case. Derive option ids from the extractor a control actually
   * declares, not from the library default.
   */
  layoutRaidz2: '[data-test="option-layout-raidz-2"]',

  /** `[testId]="['size-and-type', type()]"` where type is the vdev category. */
  diskSize: '[data-test="select-size-and-type-data"]',
  width: '[data-test="select-width-data"]',
  vdevCount: '[data-test="select-vdevs-number-data"]',

  saveAndReview: '[data-test="button-save-and-go-to-review-data"]',
  createPool: '[data-test="button-create-pool"]',
} as const;

export const datasetLocators = {
  /**
   * A pool or dataset in the tree.
   *
   * `<tn-tree-node [testId]="['dataset', dataset.name]">`, applied via
   * `hostDirectives` with no `tnTestIdType`, so the value is written verbatim
   * with no element-type prefix — unlike most controls here.
   */
  treeNode: (name: string) => `[data-test="dataset-${name.replace(/_/g, '-')}"]`,

  addDataset: '[data-test="button-add-dataset"]',
  name: '[data-test="input-name"]',
  /** `<tn-select formControlName="share_type">`, id via control-name fallback. */
  shareType: '[data-test="select-share-type"]',
  /** `DatasetPreset.Smb` is `'SMB'`, which normalizes to `smb`. */
  shareTypeSmb: '[data-test="option-share-type-smb"]',

  /**
   * "Create SMB Share", which the SMB preset turns **on** by default.
   *
   * Left checked, choosing the SMB preset creates the share as a side effect of
   * creating the dataset — collapsing two steps of this journey into one and
   * raising the start-service prompt a step early.
   */
  createSmbShare: '[data-test="checkbox-create-smb"]',
  /** Only rendered while "Create SMB Share" is checked — so it doubles as a
   * readback for whether the toggle went the way we intended. */
  smbName: '[data-test="input-smb-name"]',

  save: '[data-test="button-save"]',
} as const;

export const smbLocators = {
  /**
   * "Add" in the Windows (SMB) Shares card on the Shares dashboard —
   * `testId="smb-share-add"` in `smb-card.component.html`.
   *
   * Not `add-smb-share`, which belongs to the standalone SMB *list* page at
   * `/sharing/smb`. Arriving via the sidebar lands on the dashboard, so the
   * card's button is the one a user actually clicks.
   */
  addShare: '[data-test="button-smb-share-add"]',
  /**
   * `ix-explorer` renders a `tn-file-picker`, whose inner `<input>` takes the
   * control name. It is typable — `allowManualInput` defaults to true — so the
   * path can be entered directly rather than navigated as a tree.
   */
  path: '[data-test="input-path"]',
  name: '[data-test="input-name"]',
  save: '[data-test="button-save"]',
  /**
   * "No" on the "Configure ACL" prompt that follows share creation.
   *
   * `dialogService.confirm({ cancelText: 'No', hideCheckbox: true })`, so it is
   * the standard confirm dialog's cancel button despite the custom label.
   */
  declineAclPrompt: '[data-test="button-dialog-cancel"]',
  /**
   * "Start" on the "Start SMB Service" dialog
   * (`start-service-dialog.component.html`, `testId="enable-service"`).
   *
   * Its sibling "No" is `button-do-not-start`. The dialog also carries a toggle
   * for starting the service automatically on boot, which we leave alone —
   * starting it now is what makes the share actually serve.
   */
  startService: '[data-test="button-enable-service"]',
} as const;
