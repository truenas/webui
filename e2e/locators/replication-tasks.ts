/**
 * The Replication Tasks card on Data Protection, its full list, the wizard its
 * Add opens, the form its Edit opens, and the dialog its Restore opens.
 *
 * Every id on a row is built from the card's own `uniqueRowTag`,
 * `convertStringToId('replication-task-' + name)`, which lowercases the tag and
 * turns its punctuation into hyphens before the library's normalizer sees it. As
 * on the rsync task card, lowercasing first and then running
 * {@link kebabTestSegment} is the same id. The tag carries the task's name and
 * nothing else, and middleware holds names unique.
 *
 * The wizard is two steps in one side panel, with no panel footer: each step
 * owns its buttons. Its controls declare their `testId`s, and its two
 * `ix-explorer`s render a `tn-file-picker` whose inner `<input>` takes the
 * control name.
 *
 * Edit opens a different component, `ix-replication-form`: one long form in five
 * sections, with Save in the side panel's footer. Its controls declare their
 * `testId`s too.
 */
import { taskListDetailAction } from './data-protection';
import { kebabTestSegment, legacyKebabTestSegment } from './test-id';

function rowTag(name: string): string {
  return kebabTestSegment(`replication-task-${name}`.toLowerCase());
}

/**
 * The full list's row tag. The list starts from the same `replication-task-` +
 * name as the card, but passes it through `toUniqueRowTag`, which runs lodash
 * over the whole tag and splits letters from digits. So `e2e-…` on the card is
 * `e-2-e-…` here.
 */
function listRowTag(name: string): string {
  return legacyKebabTestSegment(`replication-task-${name}`.toLowerCase());
}

/** What both "from" selects call this appliance, and anywhere else. */
const thisSystemLabel = 'On this System';
const differentSystemLabel = 'On a Different System';

/**
 * How a task picks its snapshots, by naming schema or by regular expression, in
 * the form and in the wizard alike. The ids keep the legacy
 * `radio-button-<group>-<label>` shape; the labels differ between the two.
 */
function schemaOrRegexRadio(label: string): string {
  return `[data-test="radio-button-schema-or-regex-${kebabTestSegment(label)}"]`;
}

export const replicationTaskLocators = {
  card: {
    /** The card title, `tnTestIdType="link"` with `['replication-task', 'open-in-new']`. Opens the full list. */
    open: '[data-test="link-replication-task-open-in-new"]',
    /** `<tn-empty>`, rendered in place of the table once the card has loaded and found no task. */
    empty: '[data-test="text-replication-task-empty"]',
    /** `<tn-button [testId]="addTestId">` in the card footer, `replication-task-add`. */
    add: '[data-test="button-replication-task-add"]',

    row: (name: string): string => `[data-test="row-${rowTag(name)}"]`,

    /** The Name cell. Its base is the column title, so `text-name`. */
    name: (name: string): string => `[data-test="text-name-${rowTag(name)}-row-text"]`,

    /**
     * The row's action menu trigger. The row has up to five actions (Edit, Run
     * job, Restore, Download encryption keys, Delete) and the card does not ask
     * for `mode="inline"`, so they sit in a kebab menu.
     */
    rowMenu: (name: string): string => `[data-test="button-${rowTag(name)}-more-action"]`,

    /** Run job, inside that menu — the trigger's own id with the icon appended, library and all. */
    rowMenuRun: (name: string): string => (
      `[data-test="button-${rowTag(name)}-more-action-mdi-play-circle-row-action"]`
    ),

    /** Edit, inside that menu. Same shape as {@link rowMenuRun}. */
    rowMenuEdit: (name: string): string => (
      `[data-test="button-${rowTag(name)}-more-action-mdi-pencil-row-action"]`
    ),

    /** Delete, inside that menu. Same shape as {@link rowMenuRun}. */
    rowMenuDelete: (name: string): string => (
      `[data-test="button-${rowTag(name)}-more-action-mdi-delete-row-action"]`
    ),

    /** Restore, inside that menu. Same shape as {@link rowMenuRun}. Opens {@link replicationTaskLocators.restore}. */
    rowMenuRestore: (name: string): string => (
      `[data-test="button-${rowTag(name)}-more-action-mdi-restore-row-action"]`
    ),

    /**
     * Download encryption keys, inside that menu. Same shape as {@link rowMenuRun}.
     * Hidden unless the task's source holds a stored key, which a passphrase never is.
     */
    rowMenuDownloadKeys: (name: string): string => (
      `[data-test="button-${rowTag(name)}-more-action-mdi-download-row-action"]`
    ),

    /**
     * The row's Enabled switch. `ix-table-toggle-cell` composes `[title, row tag,
     * 'row-toggle']` and `tn-slide-toggle` puts its `toggle-` type in front. It
     * writes on click — there is no Save.
     */
    enabledToggle: (name: string): string => `[data-test="toggle-enabled-${rowTag(name)}-row-toggle"]`,
  },

  list: {
    /**
     * The full list page's Add, `['replication-task', 'add']` — the same id as
     * the card's, which is gone by then with the route.
     */
    add: '[data-test="button-replication-task-add"]',

    row: (name: string): string => `[data-test="row-${listRowTag(name)}"]`,

    /** Every row on the list, whichever task it is: a prefix of {@link row}. */
    anyRow: '[data-test^="row-replication-task-"]',

    /** The Name cell. Clicking it opens the row's detail panel, like clicking anywhere else in the row. */
    name: (name: string): string => `[data-test="text-name-${listRowTag(name)}-row-text"]`,

    /**
     * The row's Enabled switch, the same `ix-table-toggle-cell` as the card's.
     * It writes on click, and there is no Save.
     */
    enabledToggle: (name: string): string => `[data-test="toggle-enabled-${listRowTag(name)}-row-toggle"]`,

    /**
     * Run Now, in the row's detail panel, keyed by the task's id rather than its
     * name. Hidden while the task's job is running.
     */
    runNow: (taskId: number): string => taskListDetailAction([taskId], 'run_now'),
    /** Edit, in the row's detail panel. Opens the same form as the card's Edit. */
    edit: (taskId: number): string => taskListDetailAction([taskId], 'edit'),
    /** Delete, in the row's detail panel. */
    delete: (taskId: number): string => taskListDetailAction([taskId], 'delete'),
  },

  form: {
    /** General section. */
    name: '[data-test="input-name"]',
    retries: '[data-test="input-retries"]',
    enabled: '[data-test="checkbox-enabled"]',
    /** Destination section. Its options are labelled with the mode itself: SET, REQUIRE, IGNORE. */
    readonly: '[data-test="select-readonly"]',
    readonlyOption: (label: string): string => `[data-test="option-readonly-${kebabTestSegment(label)}"]`,
    /** Destination section. Custom is offered only while the Source section picks snapshots by naming schema. */
    retentionPolicy: '[data-test="select-retention-policy"]',
    retentionPolicyOption: (label: string): string => (
      `[data-test="option-retention-policy-${kebabTestSegment(label)}"]`
    ),
    /** Destination section. Ticking it shows the key fields below; Inherit Encryption would hide them. */
    encryption: '[data-test="checkbox-encryption"]',
    encryptionKeyFormat: '[data-test="select-encryption-key-format"]',
    encryptionKeyFormatOption: (label: string): string => (
      `[data-test="option-encryption-key-format-${kebabTestSegment(label)}"]`
    ),
    /** Shown for a HEX key. Ticked, the form makes the key itself; unticked, {@link encryptionKeyHex} takes it. */
    encryptionKeyGenerate: '[data-test="checkbox-encryption-key-generate"]',
    encryptionKeyHex: '[data-test="input-encryption-key-hex"]',
    /** Source section. Labelled `Matching naming schema` and `Matching regular expression`. */
    schemaOrRegex: schemaOrRegexRadio,
    /**
     * Source section, on a push task picking by naming schema. A `tn-chip-input`:
     * the typable field is `chip-input-<testId>`, and Enter commits the text as a chip.
     */
    alsoIncludeNamingSchema: '[data-test="chip-input-also-include-naming-schema"]',
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },

  wizard: {
    /** Step one, What and Where. */
    sourceFrom: '[data-test="select-source-datasets-from"]',
    sourceFromThisSystem: `[data-test="option-source-datasets-from-${kebabTestSegment(thisSystemLabel)}"]`,
    /**
     * A pull. Picking it sets the target's location to this system and locks it,
     * and shows {@link replicationTaskLocators.wizard.sshConnection} for the source. `ix-ssh-credentials-select`
     * hard-codes its `testId`, and only one of the two is rendered at a time.
     */
    sourceFromDifferentSystem: `[data-test="option-source-datasets-from-${kebabTestSegment(differentSystemLabel)}"]`,
    /** Multiple: a typed value is split on commas. Shown once a source location is picked. */
    sourceDatasets: '[data-test="input-source-datasets"]',
    /**
     * The base of the source explorer's popup ids — see `locators/explorer.ts`.
     * On a different system it lists `replication.list_datasets` over the
     * connection, in dataset names: the pools at the root, then a level at a time.
     */
    sourceDatasetsExplorer: 'source-datasets',
    /**
     * Shown for a source on a different system: `Naming Schema` or `Snapshot Name
     * Regular Expression`. Naming Schema is picked when it appears.
     */
    schemaOrRegex: schemaOrRegexRadio,
    /**
     * The regular expression. Required whenever it is shown, which a source on a
     * different system leaves it until the radio is moved — see
     * `chooseRemoteReplicationSource`.
     */
    nameRegex: '[data-test="input-name-regex"]',
    targetFrom: '[data-test="select-target-dataset-from"]',
    targetFromThisSystem: `[data-test="option-target-dataset-from-${kebabTestSegment(thisSystemLabel)}"]`,
    targetFromDifferentSystem: `[data-test="option-target-dataset-from-${kebabTestSegment(differentSystemLabel)}"]`,
    /**
     * `ix-ssh-credentials-select`, shown once the source or the target is on a
     * different system. Its options are the connections' names.
     */
    sshConnection: '[data-test="select-ssh-credentials"]',
    sshConnectionOption: (name: string): string => `[data-test="option-ssh-credentials-${kebabTestSegment(name)}"]`,
    /** Shown once a target location is picked. */
    targetDataset: '[data-test="input-target-dataset"]',
    /** Filled in from the source and target as they change, so set it after both. */
    name: '[data-test="input-name"]',
    next: '[data-test="button-next"]',

    /**
     * Step two, When. The radio ids keep the legacy `radio-button-<group>-<label>`
     * shape — the template says why — and `source-section.component.spec.ts`
     * pins that shape for the same component family.
     */
    runOnce: `[data-test="radio-button-schedule-method-${kebabTestSegment('Run Once')}"]`,
    save: '[data-test="button-save"]',
  },

  restore: {
    /** `<tn-dialog-shell testId="replication-restore">`. What to wait on before acting on it. */
    title: '[data-test="dialog-title-replication-restore"]',
    name: '[data-test="input-name"]',
    /** Where the restored data goes. An `ix-explorer` in dataset names, so a typed value is stored verbatim. */
    destination: '[data-test="input-target-dataset"]',
    /** Disabled until the name and the destination are both filled. */
    restore: '[data-test="button-restore"]',
  },
} as const;
