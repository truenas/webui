/**
 * The Replication Tasks card on Data Protection, the wizard its Add opens, and
 * the form its Edit opens.
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
import { kebabTestSegment } from './test-id';

function rowTag(name: string): string {
  return kebabTestSegment(`replication-task-${name}`.toLowerCase());
}

/** What both "from" selects call this appliance, and anywhere else. */
const thisSystemLabel = 'On this System';
const differentSystemLabel = 'On a Different System';

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
  },

  form: {
    /** General section. */
    name: '[data-test="input-name"]',
    retries: '[data-test="input-retries"]',
    enabled: '[data-test="checkbox-enabled"]',
    /** Destination section. Its options are labelled with the mode itself: SET, REQUIRE, IGNORE. */
    readonly: '[data-test="select-readonly"]',
    readonlyOption: (label: string): string => `[data-test="option-readonly-${kebabTestSegment(label)}"]`,
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },

  wizard: {
    /** Step one, What and Where. */
    sourceFrom: '[data-test="select-source-datasets-from"]',
    sourceFromThisSystem: `[data-test="option-source-datasets-from-${kebabTestSegment(thisSystemLabel)}"]`,
    /** Multiple: a typed value is split on commas. Shown once a source location is picked. */
    sourceDatasets: '[data-test="input-source-datasets"]',
    targetFrom: '[data-test="select-target-dataset-from"]',
    targetFromThisSystem: `[data-test="option-target-dataset-from-${kebabTestSegment(thisSystemLabel)}"]`,
    targetFromDifferentSystem: `[data-test="option-target-dataset-from-${kebabTestSegment(differentSystemLabel)}"]`,
    /**
     * `ix-ssh-credentials-select`, shown once the target is on a different
     * system. Its options are the connections' names.
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
} as const;
