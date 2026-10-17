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
import { kebabTestSegment, legacyKebabTestSegment } from './test-id';

/**
 * A kind of vdev, as the wizard keys its per-step controls: `select-width-log`,
 * `text-review-spare`. The values of webui's `VDevType`.
 */
export type VdevCategory = 'data' | 'log' | 'spare' | 'cache' | 'special' | 'dedup';

/**
 * The wizard step's own name in its Next and Save And Go To Review ids. The same
 * as the category except for special vdevs, whose step is "Metadata".
 */
const stepIds: Record<VdevCategory, string> = {
  data: 'data',
  log: 'log',
  spare: 'spare',
  cache: 'cache',
  special: 'metadata',
  dedup: 'dedup',
};

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
  /**
   * The Name `<tn-form-field testId="name">` around {@link name}. The field's
   * error has no id of its own, so its text is read off this.
   */
  nameField: '[data-test="form-field-name"]',
  next: '[data-test="button-next-general"]',
  /** A vdev step's Next, which moves on to the following step. */
  nextStep: (type: VdevCategory) => `[data-test="button-next-${stepIds[type]}"]`,

  /**
   * A vdev step's layout. `[testId]="['layout']"` on a tn-select, with no
   * category in it: `tn-stepper` renders only the active step, so there is
   * only ever one.
   *
   * The Spare and Cache steps do not render it: a spare or a cache device is
   * always a single disk.
   */
  layout: '[data-test="select-layout"]',
  /**
   * A layout option, by the label the select shows: `Mirror`, `RAIDZ1`.
   *
   * `raidz-1`, not `raidz1`. This select passes
   * `[optionTestIdKey]="optionTestIdByKebabLabel"`, which is
   * `(option) => kebabCase(option.label)` using **lodash**. lodash splits
   * letters from digits, so the label `RAIDZ1` becomes `raidz-1` before the
   * library's own `kebabTestSegment` ever sees it — and that normalizer would
   * have produced `raidz1`.
   *
   * Two normalizers are in play across this codebase and they disagree on
   * exactly this case. Derive option ids from the extractor a control actually
   * declares, not from the library default.
   */
  layoutOption: (label: string) => `[data-test="option-layout-${legacyKebabTestSegment(label)}"]`,

  /** `[testId]="['size-and-type', type()]"` where type is the vdev category. */
  diskSize: (type: VdevCategory) => `[data-test="select-size-and-type-${type}"]`,
  /**
   * Any option of a category's disk-size select.
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
  diskSizeOptions: (type: VdevCategory) => `[data-test^="option-size-and-type-${type}-"]`,

  width: (type: VdevCategory) => `[data-test="select-width-${type}"]`,
  /** Number of disks in the vdev. Keys are the numbers themselves. */
  widthOption: (type: VdevCategory, disks: number) => (
    `[data-test="option-width-${type}-${kebabTestSegment(disks)}"]`
  ),

  /**
   * dRAID's Data Devices, the data disks in each redundancy group. Rendered in place of
   * {@link width} once a dRAID layout is chosen (`draid-selection.component.html`), as are the
   * two below. Keys are the numbers themselves.
   */
  draidDataDevices: (type: VdevCategory) => `[data-test="select-data-devices-per-group-${type}"]`,
  draidDataDevicesOption: (type: VdevCategory, disks: number) => (
    `[data-test="option-data-devices-per-group-${type}-${kebabTestSegment(disks)}"]`
  ),
  /** dRAID's Distributed Hot Spares, per vdev. Offers `0`. */
  draidSpares: (type: VdevCategory) => `[data-test="select-spares-${type}"]`,
  draidSparesOption: (type: VdevCategory, spares: number) => (
    `[data-test="option-spares-${type}-${kebabTestSegment(spares)}"]`
  ),
  /** dRAID's Children, the disks in each vdev: its groups' data and parity disks plus its spares. */
  draidChildren: (type: VdevCategory) => `[data-test="select-children-${type}"]`,
  draidChildrenOption: (type: VdevCategory, disks: number) => (
    `[data-test="option-children-${type}-${kebabTestSegment(disks)}"]`
  ),

  /**
   * "Manual Disk Selection" under Advanced Options, and "Edit Manual Disk Selection" once a
   * manual layout has been saved: both are `[testId]="['manual', type()]"`, and only one is
   * rendered at a time. Disabled until a layout is chosen. Opens {@link manualDiskSelectionLocators}.
   */
  manualSelection: (type: VdevCategory) => `[data-test="button-manual-${type}"]`,
  /**
   * What the step shows in place of Automated Disk Selection once a manual layout has been saved.
   * `[type(), 'manual-disk-selection-message']`.
   */
  manualSelectionMessage: (type: VdevCategory) => `[data-test="text-${type}-manual-disk-selection-message"]`,
  /**
   * A disk count in the Unassigned Disks card, one per type and size (`inventory.component.html`).
   * The card says "Loading disks..." until the wizard has its disks, so a count means it has them.
   */
  inventoryCount: '[data-test^="text-inventory-"][data-test$="-count"]',

  /** Not rendered on the Log, Spare and Cache steps, which build exactly one vdev. */
  vdevCount: (type: VdevCategory) => `[data-test="select-vdevs-number-${type}"]`,
  vdevCountOption: (type: VdevCategory, count: number) => (
    `[data-test="option-vdevs-number-${type}-${kebabTestSegment(count)}"]`
  ),

  /**
   * One category in the Configuration Preview beside the wizard, e.g.
   * `1 × MIRROR | 2 × 10 GiB (HDD)`. `[tnTestId]="['config-preview', category.key]"`.
   * The preview is hidden on the Review step.
   */
  configPreview: (type: VdevCategory) => `[data-test="text-config-preview-${type}"]`,

  saveAndReview: (type: VdevCategory) => (
    `[data-test="button-save-and-go-to-review-${stepIds[type]}"]`
  ),

  /** The Data step's top warning, shown under the layout while one applies. */
  dataStepWarning: '[data-test="text-data-step-warning"]',
  /** The Log step's, in the same place. */
  logStepWarning: '[data-test="text-log-step-warning"]',
  /** The Special step's. `metadata`, its step's own name, not the `special` category. */
  metadataStepWarning: '[data-test="text-metadata-step-warning"]',
  /** The Dedup step's. */
  dedupStepWarning: '[data-test="text-dedup-step-warning"]',

  /**
   * Any entry of the Review step's Warnings list, `['review-warning', $index]`.
   * A prefix match: the index is the entry's place in a list sorted by
   * severity, so it moves whenever another warning comes or goes.
   */
  reviewWarnings: '[data-test^="text-review-warning-"]',

  /** Review step — General Info's Pool Name. */
  reviewPoolName: '[data-test="text-review-pool-name"]',
  /**
   * One row of the Review step's Topology Summary, in the same words as the
   * preview. Rendered only for a category that has vdevs.
   */
  reviewCategory: (type: VdevCategory) => `[data-test="text-review-${type}"]`,
  reviewEstUsableRawCapacity: '[data-test="text-review-est-usable-raw-capacity"]',

  /** Rendered only while the topology has at least one vdev. */
  inspectVdevs: '[data-test="button-inspect-vdevs"]',
  /** "Create Pool", or "Update Pool" when the wizard was opened from Add VDEV. */
  createPool: '[data-test="button-create-pool"]',
} as const;

/**
 * The pool wizard's Manual Disk Selection dialog: unused disks on the left, the step's vdevs on
 * the right, and disks dragged between them (`ngx-drag-drop`).
 *
 * A vdev's ids carry its layout and its 1-based position in the list, `['vdev-error', layout(),
 * position()]`. The layout is the `CreateVdevLayout` value, `MIRROR`, which the library writes as
 * `mirror`. A disk's ids carry its name, `sdb`.
 *
 * Several of these are on plain `<div>`s or on `ix-disk-icon` with no `tnTestIdType`, so they are
 * written with no type prefix.
 */
export const manualDiskSelectionLocators = {
  /** `<tn-dialog-shell testId="manual-disk-selection">`. What to wait on. */
  title: '[data-test="dialog-title-manual-disk-selection"]',

  /** "Add", which appends an empty vdev. Hidden once a step limited to one vdev has it. */
  add: '[data-test="button-add"]',
  /** Disabled while any vdev has fewer disks than its layout needs. */
  save: '[data-test="button-save-selection"]',
  /** Closes the dialog and leaves the step as it was. */
  cancel: '[data-test="button-cancel"]',

  /** The unused-disk list, which is also where a disk is dropped to take it out of a vdev. */
  unusedDisksDropzone: '[data-test="unused-disks-dropzone"]',
  /** A disk's row in the unused list. `tn-nested-tree-node` writes its id with no prefix. */
  unusedDisk: (disk: string) => `[data-test="unused-disk-${kebabTestSegment(disk)}"]`,
  /** What is dragged out of that row. */
  unusedDiskDrag: (disk: string) => `[data-test="drag-unused-disk-${kebabTestSegment(disk)}"]`,

  /** A vdev's card, and where a disk is dropped to add it. */
  vdevDropzone: (layout: string, position: number) => (
    `[data-test="vdev-dropzone-${kebabTestSegment(layout)}-${position}"]`
  ),
  /** "At least 2 disk(s) are required for Mirror vdevs". Rendered only while the vdev is short. */
  vdevError: (layout: string, position: number) => (
    `[data-test="text-vdev-error-${kebabTestSegment(layout)}-${position}"]`
  ),
  /** "<size> Est. Usable Raw Capacity". Rendered only once the vdev has enough disks. */
  vdevCapacityEstimate: (layout: string, position: number) => (
    `[data-test="text-vdev-capacity-estimate-${kebabTestSegment(layout)}-${position}"]`
  ),
  /** A disk inside a vdev, and what is dragged to take it out. */
  vdevDisk: (disk: string) => `[data-test="drag-vdev-disk-${kebabTestSegment(disk)}"]`,
  deleteVdev: (layout: string, position: number) => (
    `[data-test="button-delete-vdev-${kebabTestSegment(layout)}-${position}"]`
  ),
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
  /**
   * The "Export Pool" option card, the same kind of `<div>` as Delete. The
   * dialog opens with it already chosen. Clicking it still clears `destroy`
   * and the confirm tick, so a journey clicks it before ticking anything.
   */
  exportOption: '[data-test="option-export-pool"]',

  /**
   * `<tn-checkbox testId="cascade">` — "Delete saved configurations from
   * TrueNAS?" under Export. The form starts it **ticked**, so keeping the
   * configuration means unticking it.
   */
  cascade: '[data-test="checkbox-cascade"]',
  /** `<tn-checkbox testId="confirm">` — "Confirm Export Pool" / "Confirm Delete Pool". */
  confirm: '[data-test="checkbox-confirm"]',

  /**
   * One item in the list of what depends on the pool, from `pool.attachments`:
   * `['attachment', service.type, item]`. `type` is the delegate's title
   * (`SMB Share`) and an item is the share's name.
   */
  attachment: (type: string, item: string): string => (
    `[data-test="text-attachment-${kebabTestSegment(type)}-${kebabTestSegment(item)}"]`
  ),
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
  /**
   * The VDEVs card's Data VDEVs line, e.g. `1 x MIRROR | 2 wide | 10 GiB`.
   * `[poolState().name, 'data-vdevs']`.
   */
  dataVdevs: (pool: string) => `[data-test="text-${kebabTestSegment(pool)}-data-vdevs"]`,
  /**
   * The VDEVs card's line for another kind of vdev, e.g. `1 x MIRROR | 2 wide | 10 GiB`
   * for a log, `1 x 10 GiB` for a cache or a spare. `[poolState().name, row.key, 'vdevs']`,
   * rendered only while the pool has that kind.
   */
  vdevs: (pool: string, type: Exclude<VdevCategory, 'data'>) => (
    `[data-test="text-${kebabTestSegment(pool)}-${type}-vdevs"]`
  ),
} as const;

/**
 * Scrubbing, on the Storage Health card inside a pool's card.
 *
 * Every id carries the pool's name, because the dashboard shows one such card
 * per pool and the worker-scoped `pool` fixture may well be on it too.
 */
export const poolScrubLocators = {
  /**
   * "Scrub Now" — `[testId]="['scrub', pool().name]"` on a tn-button. Rendered
   * only while no scan is running.
   */
  start: (pool: string) => `[data-test="button-scrub-${kebabTestSegment(pool)}"]`,

  /**
   * "Last Scan", e.g. "Finished Scrub on <date>". Rendered only once the pool
   * has a scan with an end time, so it is absent on a pool never scrubbed.
   */
  lastScan: (pool: string) => `[data-test="text-${kebabTestSegment(pool)}-last-scan"]`,
  /** "Last Scan Errors", the count the last scan found. */
  lastScanErrors: (pool: string) => `[data-test="text-${kebabTestSegment(pool)}-last-scan-errors"]`,
} as const;

/**
 * What the Storage Health card says about a pool's state, keyed by pool like
 * `poolScrubLocators`.
 */
export const poolHealthLocators = {
  /** "Online, no errors.", "Degraded, no errors.": the pool's status and its error count. */
  status: (pool: string) => `[data-test="text-${kebabTestSegment(pool)}-storage-health-status"]`,
  /**
   * The icon beside that line, `[pool().name, 'storage-health', iconType()]`. The
   * icon type is part of the id, so each state is its own locator: `SAFE` for a
   * healthy pool, `WARN` for a degraded one. Only the one in the card's body is
   * tagged; the heading repeats it.
   */
  icon: (pool: string, type: 'safe' | 'warn') => (
    `[data-test="icon-${kebabTestSegment(pool)}-storage-health-${type}"]`
  ),
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

