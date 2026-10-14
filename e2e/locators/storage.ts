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
  /**
   * "Edit" on the dataset details card — `testId: 'edit-dataset'` in
   * `dataset-details-card.component.ts`. A zvol gets `edit-zvol` instead.
   */
  editDataset: '[data-test="button-edit-dataset"]',

  /**
   * The new dataset's parent, shown only when adding. It is the dataset the form
   * will file the new one under, so it doubles as a readback that "Add Dataset"
   * acted on the node that was selected.
   */
  parentPath: '[data-test="text-parent-path"]',
  /**
   * `<tn-input formControlName="name">`. On edit it is disabled and holds the
   * dataset's full name, which makes it the signal that the record has loaded.
   */
  name: '[data-test="input-name"]',
  /** `<tn-select formControlName="share_type">`, id via control-name fallback. */
  shareType: '[data-test="select-share-type"]',
  /**
   * A preset by the label the select shows. Only `SMB` and `Multiprotocol` make
   * the form offer to create a share (`canCreateSmb`); `Generic` and `Apps` never do.
   */
  shareTypeOption: (label: string) => `[data-test="option-share-type-${kebabTestSegment(label)}"]`,

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

  /**
   * The Advanced/Basic toggle in the side panel's footer. The form pins
   * `testId: 'toggle-advanced'` rather than the shared default. Only rendered
   * when adding: an edit opens in advanced mode and has no toggle.
   */
  advancedToggle: '[data-test="button-toggle-advanced"]',

  /** Other Options, rendered only in advanced mode. Ids via control-name fallback. */
  comments: '[data-test="input-comments"]',
  sync: '[data-test="select-sync"]',
  /**
   * By the label the select shows: `Standard`, `Always`, `Disabled`. Under a
   * parent the list also opens with `Inherit (<parent's value>)`.
   */
  syncOption: (label: string) => `[data-test="option-sync-${kebabTestSegment(label)}"]`,
  atime: '[data-test="select-atime"]',
  /** `On` or `Off`, plus `Inherit (<parent's value>)` under a parent. */
  atimeOption: (label: string) => `[data-test="option-atime-${kebabTestSegment(label)}"]`,

  save: '[data-test="button-save"]',
} as const;

/**
 * The zvol form, opened from "Add Zvol" in the details panel's header or "Edit Zvol" on the
 * details card. It shares the side panel host, and so its Save, with the dataset form.
 *
 * Its ZFS properties are inline editables in a details table rather than form fields. Each one
 * shows its value until clicked, and only then renders the `tn-select`. The editable's own trigger
 * id is built from the value it is showing (`editable.component.ts`), so it changes with the value
 * and cannot be named in advance. The view inside the trigger has a static id, and clicking that
 * opens it the same way.
 */
export const zvolLocators = {
  /** `<tn-button [testId]="'add-zvol'">` in the details panel's header, for a filesystem only. */
  add: '[data-test="button-add-zvol"]',
  /** "Edit Zvol" on the details card — `testId: 'edit-zvol'` in `dataset-details-card.component.ts`. */
  edit: '[data-test="button-edit-zvol"]',

  /** `<tn-input formControlName="name">`. On edit it is disabled and holds the zvol's full name. */
  name: '[data-test="input-name"]',
  /** `<tn-input formControlName="volsize">`, a size input that reads `64 MiB` and the like. */
  volsize: '[data-test="input-volsize"]',
  /** `<tn-checkbox formControlName="sparse">`. Only rendered when adding. */
  sparse: '[data-test="checkbox-sparse"]',

  /**
   * The Sync editable's view, `tnTestIdType="text"` with `'sync'`. It is empty until the form
   * has loaded its parent and worked out what is inherited.
   */
  syncValue: '[data-test="text-sync"]',
  /** The select the Sync editable renders once opened. Id via control-name fallback. */
  sync: '[data-test="select-sync"]',
  /** By the label the select shows: `Standard`, `Always`, `Disabled`, plus `Inherit (<value>)`. */
  syncOption: (label: string) => `[data-test="option-sync-${kebabTestSegment(label)}"]`,

  save: '[data-test="button-save"]',
} as const;

/**
 * Readouts on the details card for whichever dataset the tree has selected.
 * Each is `tnTestIdType="text"` with a static base, so there is one per page.
 */
export const datasetDetailsLocators = {
  /** The selected dataset's full name, `pool/child`. */
  path: '[data-test="text-dataset-details-path"]',
  /** Rendered only when the dataset has a comment of its own. */
  comments: '[data-test="text-dataset-details-comments"]',
  /** The raw ZFS value, `ALWAYS` rather than the form's `Always`. */
  sync: '[data-test="text-dataset-details-sync"]',
} as const;

/**
 * The Disconnect Pool dialog, reached from a pool card on the storage dashboard.
 *
 * The most destructive dialog in the app: choosing the "Delete Pool" card runs
 * `pool.export` with `destroy: true`, which wipes every member disk. There is
 * no separate "destroy" tick — `selectOption()` sets `destroy` from which card
 * was picked, and picking Delete is what reveals the name field. It gates on a
 * "Confirm Delete Pool" tick and that name typed back, and its handler had no
 * validity check of any kind, so the Enter that submits this form reached
 * `pool.export` regardless. See `tests/pool-disconnect.e2e.ts`.
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
   * The "Delete Pool" option card. A plain `<div>` carrying
   * `tnTestIdType="option"`, so it is `option-…` rather than `button-…`.
   * Picking it is what sets `destroy`, which in turn reveals the name field.
   */
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

/**
 * The Import Pool side panel, opened from the storage dashboard's header.
 *
 * It opens on a spinner while `pool.import_find` runs, and only then renders the
 * form, so the pool select appearing is the signal that the search finished.
 */
export const poolImportLocators = {
  /** "Import Pool" in the dashboard header. `[testId]="'import-pool'"` on a tn-button. */
  open: '[data-test="button-import-pool"]',

  /** `<tn-select formControlName="guid">`, id via control-name fallback. */
  pool: '[data-test="select-guid"]',
  /**
   * The option for an exported pool, by its name.
   *
   * The select pins `optionTestIdByLabel`, and the label is `<name> | <guid>`, so
   * the library's normalizer emits `option-guid-<name>-<guid>`. The guid is
   * middleware's and changes with every pool built, so this is a prefix match on
   * the name. A pool whose name starts with the same words would match too, so
   * the flow asserts there is exactly one before picking it.
   */
  poolOption: (pool: string) => `[data-test^="option-guid-${kebabTestSegment(pool)}-"]`,

  /** The form's own submit. `[testId]="'import'"`, not the header's `import-pool`. */
  submit: '[data-test="button-import"]',
} as const;

/** A pool's card on the storage dashboard. */
export const poolCardLocators = {
  /** The card's heading. `tnTestIdType="text"` with `[pool()?.name, 'pool-name']`. */
  name: (pool: string) => `[data-test="text-${kebabTestSegment(pool)}-pool-name"]`,
} as const;

/**
 * The delete-dataset dialog, which guards a destructive action with two gates:
 * the dataset's own name typed back, and a Confirm tick box.
 *
 * Both gates are the point. The dialog is reached from the details card's
 * "Delete", and pressing Enter in the name field used to submit the form past
 * both of them — the form has a single text input and, since the tn-dialog
 * migration put the actions outside `<form>`, no submit button at all, which is
 * exactly the shape the HTML spec submits on Enter.
 */
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
} as const;

