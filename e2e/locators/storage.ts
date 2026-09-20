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
 *    not `raidz-2`. webui's own normalizer does use lodash and would differ.
 */
import { confirmDialogLocators } from './dialogs';
import { kebabTestSegment } from './test-id';

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
  /**
   * Any option of the disk-size select.
   *
   * A prefix match, because the option key encodes a size and media type that
   * vary per appliance — `option-size-and-type-data-20-gi-b-hdd` on one box,
   * something else on the next. (`gi-b`, not `gib`: `kebabTestSegment` splits
   * the letter/digit boundary in `GiB`. See `disk-size-selects.component.spec.ts`,
   * and note 2 in this file's header.)
   *
   * The prefix is what makes it safe to take the first match: sibling vdev
   * categories carry their own `-log-` and `-spare-` prefixes, so this can only
   * match *this* select's options and a CDK overlay from a previously closed
   * select cannot be picked up by mistake.
   */
  diskSizeOptions: '[data-test^="option-size-and-type-data-"]',

  width: '[data-test="select-width-data"]',
  /** Number of disks in the vdev. Keys are the numbers themselves. */
  widthOption: (disks: number) => `[data-test="option-width-data-${kebabTestSegment(disks)}"]`,

  vdevCount: '[data-test="select-vdevs-number-data"]',
  vdevCountOption: (count: number) => (
    `[data-test="option-vdevs-number-data-${kebabTestSegment(count)}"]`
  ),

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
   *
   * The name goes through the library's own normalizer rather than a local
   * `_` → `-` replacement. That shortcut happened to be right for `e2e_tank`
   * and wrong for anything else: `MyPool` emits `dataset-my-pool`, not
   * `dataset-MyPool`.
   */
  treeNode: (name: string) => `[data-test="dataset-${kebabTestSegment(name)}"]`,

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

/**
 * The delete-dataset dialog, which guards a destructive action with two gates:
 * the dataset's own name typed back, and a Confirm tick box.
 *
 * Both gates are the point. The dialog is reached from the details card's
 * "Delete", and until NAS-000000 pressing Enter in the name field submitted the
 * form past both of them — the form has a single text input and, since the
 * tn-dialog migration put the actions outside `<form>`, no submit button at all,
 * which is exactly the shape the HTML spec submits on Enter.
 */
/**
 * The Disconnect Pool dialog, reached from a pool card on the storage dashboard.
 *
 * The most destructive dialog in the app: picking "Delete Pool" and ticking
 * "Destroy data on this pool" runs `pool.export` with `destroy: true`, which
 * wipes every member disk. It gates on a Confirm tick and, once destroy is
 * chosen, the pool's name typed back — and its handler had no validity check of
 * any kind, so the Enter that submits this form reached `pool.export`
 * regardless. See `tests/pool-disconnect.e2e.ts`.
 */
export const poolDisconnectLocators = {
  /**
   * "Disconnect" on the pool card — `[testId]="['disconnect', pool()?.name]"`,
   * so the pool's name is part of the id and has to be normalized the same way.
   */
  open: (pool: string) => `[data-test="button-disconnect-${kebabTestSegment(pool)}"]`,

  /** `<tn-dialog-shell testId="export-disconnect">`. What to wait on. */
  title: '[data-test="dialog-title-export-disconnect"]',

  /**
   * The two option cards. Plain `<div>`s carrying `tnTestIdType="option"`, so
   * they are `option-…` rather than `button-…`. Picking "Delete Pool" is what
   * sets `destroy`, which in turn reveals the name field.
   */
  exportOption: '[data-test="option-export-pool"]',
  deleteOption: '[data-test="option-delete-pool"]',

  /** `<tn-checkbox testId="confirm">` — "Confirm Export Pool" / "Confirm Delete Pool". */
  confirm: '[data-test="checkbox-confirm"]',
  /**
   * `<tn-input testId="name-input">` — the name gate, rendered only while
   * "Delete Pool" is the chosen option. Note the doubled word: the control name
   * is `nameInput` and the declared `testId` is `name-input`, so the emitted id
   * is `input-name-input` rather than the `input-name` the form field suggests.
   */
  name: '[data-test="input-name-input"]',

  /**
   * The dialog's own "Disconnect". `testId="disconnect"` with no pool name, so
   * it does not collide with the card button that opened it.
   */
  submit: '[data-test="button-disconnect"]',
  cancel: '[data-test="button-cancel"]',
} as const;

export const deleteDatasetDialogLocators = {
  /**
   * "Delete" on the dataset details card — `testId: 'delete-dataset'` in
   * `dataset-details-card.component.ts`, prefixed `button-` by the card's
   * footer actions.
   */
  open: '[data-test="button-delete-dataset"]',

  /** `<tn-dialog-shell testId="delete-dataset">`. What to wait on. */
  title: '[data-test="dialog-title-delete-dataset"]',

  /** `<tn-input testId="confirm-dataset-name">` — the name gate. */
  name: '[data-test="input-confirm-dataset-name"]',
  /** `<tn-checkbox testId="confirm">` — the tick gate. */
  confirm: '[data-test="checkbox-confirm"]',

  /**
   * The dialog's own "Delete Dataset" / "Delete Zvol".
   *
   * `dialog-`-namespaced deliberately. It used to declare `testId="delete-dataset"`,
   * the *same* value the details card behind it emits, so with the dialog open
   * `[data-test="button-delete-dataset"]` matched two elements and every
   * locator for either had to guess. Renamed to follow the convention webui's
   * shared confirm dialog already uses for its actions (`button-dialog-confirm`,
   * `button-dialog-cancel`).
   */
  submit: '[data-test="button-dialog-delete-dataset"]',
  cancel: '[data-test="button-cancel"]',
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
   * the standard confirm dialog's cancel button despite the custom label —
   * hence the reference rather than a second copy of the id.
   */
  declineAclPrompt: confirmDialogLocators.cancel,
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
