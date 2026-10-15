/**
 * The Rsync Tasks card on Data Protection, its full list, and its form.
 *
 * Every id on a row is built from the card's own `uniqueRowTag`,
 * `convertStringToId('card-rsync-task-' + path + '-' + remotehost)`, which
 * lowercases the tag and turns its punctuation into hyphens before the
 * library's normalizer sees it. As on the snapshot task card, lowercasing first
 * and then running {@link kebabTestSegment} is the same id.
 *
 * The tag carries the path and the remote host and nothing else, so editing
 * either renames every id on the row, and two tasks on one path to one host
 * share every id. The specs give each task a dataset of its own and never edit
 * the host.
 *
 * A task saved from the form in SSH mode through a keychain connection has no
 * host at all: the form sends `remotehost: null`, middleware keeps it, and the
 * card's string concatenation writes it as `null`. So the card's locators take
 * `null` for such a row, and its tag ends in `-null`.
 *
 * The form's controls declare their `testId`s, its user is the same
 * `ix-user-combobox` the cron form uses, and its schedule is the shared
 * `ix-scheduler`.
 */
import { kebabTestSegment, legacyKebabTestSegment } from './test-id';

/** The Rsync Mode option for SSH. Labelled as written, untranslated. */
export const rsyncSshModeLabel = 'SSH';

/** The "Connect using:" option that signs in through a saved SSH connection. */
export const rsyncKeychainConnectLabel = 'SSH connection from the keychain';

function rowTag(path: string, remoteHost: string | null): string {
  return kebabTestSegment(`card-rsync-task-${path}-${String(remoteHost)}`.toLowerCase());
}

/**
 * The full list's row tag, `toUniqueRowTag('rsync-task-' + path + '-' + remotehost)`.
 *
 * Not the card's. It has no `card-` prefix, and `toUniqueRowTag` runs the whole
 * tag through lodash, which splits letters from digits, so a path under `e2e_…`
 * comes out as `e-2-e-…` here where the card writes `e2e-…`.
 */
function listRowTag(path: string, remoteHost: string): string {
  return legacyKebabTestSegment(`rsync-task-${path}-${remoteHost}`.toLowerCase());
}

export const rsyncTaskLocators = {
  card: {
    /** The card title, `tnTestIdType="link"` with `['rsync-task', 'open-in-new']`. Opens the full list. */
    open: '[data-test="link-rsync-task-open-in-new"]',
    /** `<tn-empty>`, rendered in place of the table once the card has loaded and found no task. */
    empty: '[data-test="text-rsync-task-empty"]',
    /** `<tn-button [testId]="addTestId">` in the card footer, `rsync-task-add`. */
    add: '[data-test="button-rsync-task-add"]',

    row: (path: string, remoteHost: string | null): string => `[data-test="row-${rowTag(path, remoteHost)}"]`,

    /** The Path cell. Its base is the column title, so `text-path`. */
    path: (path: string, remoteHost: string | null): string => (
      `[data-test="text-path-${rowTag(path, remoteHost)}-row-text"]`
    ),

    /**
     * The State cell: `ix-task-state-cell` renders a `<button>` with the cell's
     * `testId`, and shows a finished job's state through `jobStateDisplay`,
     * which reads SUCCESS as "Completed".
     */
    state: (path: string, remoteHost: string | null): string => (
      `[data-test="button-state-${rowTag(path, remoteHost)}-row-state"]`
    ),

    /**
     * The row's action menu trigger. The row has three actions (Edit, Run job,
     * Delete) and the card does not ask for `mode="inline"`, so they sit in a
     * kebab menu.
     */
    rowMenu: (path: string, remoteHost: string | null): string => (
      `[data-test="button-${rowTag(path, remoteHost)}-more-action"]`
    ),

    /** Edit, inside that menu — the trigger's own id with the icon appended, library and all. */
    rowMenuEdit: (path: string, remoteHost: string | null): string => (
      `[data-test="button-${rowTag(path, remoteHost)}-more-action-mdi-pencil-row-action"]`
    ),

    /** Run job, inside that menu. Hidden while a run is in progress. Same shape as {@link rowMenuEdit}. */
    rowMenuRun: (path: string, remoteHost: string | null): string => (
      `[data-test="button-${rowTag(path, remoteHost)}-more-action-mdi-play-circle-row-action"]`
    ),

    /** Delete, inside that menu. Same shape as {@link rowMenuEdit}. */
    rowMenuDelete: (path: string, remoteHost: string | null): string => (
      `[data-test="button-${rowTag(path, remoteHost)}-more-action-mdi-delete-row-action"]`
    ),

    /**
     * The row's Enabled switch. `ix-table-toggle-cell` composes `[title, row tag,
     * 'row-toggle']` and `tn-slide-toggle` puts its `toggle-` type in front. It
     * writes on click — there is no Save.
     */
    enabledToggle: (path: string, remoteHost: string | null): string => (
      `[data-test="toggle-enabled-${rowTag(path, remoteHost)}-row-toggle"]`
    ),
  },

  list: {
    /** The full list page's Add, in its page header. */
    add: '[data-test="button-add-task"]',

    row: (path: string, remoteHost: string): string => `[data-test="row-${listRowTag(path, remoteHost)}"]`,

    /** Every row on the list, whichever task it is: a prefix of {@link row}. */
    anyRow: '[data-test^="row-rsync-task-"]',

    /** The Path cell. Its base is the column title, so `text-path`. */
    path: (path: string, remoteHost: string): string => (
      `[data-test="text-path-${listRowTag(path, remoteHost)}-row-text"]`
    ),

    /**
     * The Status cell. The same `ix-task-state-cell` as the card's State, but
     * the list titles the column Status, so its base is `status`.
     */
    status: (path: string, remoteHost: string): string => (
      `[data-test="button-status-${listRowTag(path, remoteHost)}-row-state"]`
    ),

    /**
     * The row's action menu trigger. The list has the card's three actions (Run
     * job, Edit, Delete) and does not ask for `mode="inline"` either, so they
     * sit in a kebab menu here too.
     */
    rowMenu: (path: string, remoteHost: string): string => (
      `[data-test="button-${listRowTag(path, remoteHost)}-more-action"]`
    ),

    /** Run job, inside that menu: the trigger's own id with the icon appended. */
    rowMenuRun: (path: string, remoteHost: string): string => (
      `[data-test="button-${listRowTag(path, remoteHost)}-more-action-mdi-play-circle-row-action"]`
    ),

    /** Edit, inside that menu. Same shape as {@link rowMenuRun}. */
    rowMenuEdit: (path: string, remoteHost: string): string => (
      `[data-test="button-${listRowTag(path, remoteHost)}-more-action-mdi-pencil-row-action"]`
    ),

    /** Delete, inside that menu. Same shape as {@link rowMenuRun}. */
    rowMenuDelete: (path: string, remoteHost: string): string => (
      `[data-test="button-${listRowTag(path, remoteHost)}-more-action-mdi-delete-row-action"]`
    ),
  },

  form: {
    /**
     * `ix-explorer` renders a `tn-file-picker`, whose inner `<input>` takes the
     * control name. Typable, so the path goes in directly rather than being
     * navigated as a tree.
     */
    path: '[data-test="input-path"]',
    /**
     * `ix-user-combobox`, a library `tn-autocomplete`: the input is
     * `autocomplete-<control>` and its rows `option-<control>-<username>`.
     */
    user: '[data-test="autocomplete-user"]',
    userOption: (username: string): string => `[data-test="option-user-${kebabTestSegment(username)}"]`,
    direction: '[data-test="select-direction"]',
    /** Labelled Push and Pull, so `option-direction-push`. */
    directionOption: (label: string): string => `[data-test="option-direction-${kebabTestSegment(label)}"]`,
    description: '[data-test="input-desc"]',
    /** Remote Host and Remote Module Name render only in Module mode, the form's default. */
    remoteHost: '[data-test="input-remotehost"]',
    remoteModule: '[data-test="input-remotemodule"]',
    /** Rsync Mode, Module by default. Its options are labelled Module and {@link rsyncSshModeLabel}. */
    mode: '[data-test="select-mode"]',
    modeOption: (label: string): string => `[data-test="option-mode-${kebabTestSegment(label)}"]`,
    /**
     * "Connect using:", rendered only in SSH mode. It starts on a private key in
     * the user's home directory; {@link rsyncKeychainConnectLabel} is the other.
     */
    sshConnectMode: '[data-test="select-sshconnectmode"]',
    sshConnectModeOption: (label: string): string => (
      `[data-test="option-sshconnectmode-${kebabTestSegment(label)}"]`
    ),
    /**
     * `ix-ssh-credentials-select`, rendered once the keychain is picked. Its
     * options are the connections' names, as in the replication wizard.
     */
    sshConnection: '[data-test="select-ssh-credentials"]',
    sshConnectionOption: (name: string): string => `[data-test="option-ssh-credentials-${kebabTestSegment(name)}"]`,
    /** Remote Path, rendered only in SSH mode. Starts as `/mnt`. */
    remotePath: '[data-test="input-remotepath"]',
    /** `ix-scheduler` renders a `tn-select` with `[testId]="[controlName, 'presets']"`. */
    schedule: '[data-test="select-schedule-presets"]',
    scheduleOption: (label: string): string => (
      `[data-test="option-schedule-presets-${kebabTestSegment(label)}"]`
    ),
    /** Ticked by default. */
    recursive: '[data-test="checkbox-recursive"]',
    /** Unticked by default. */
    archive: '[data-test="checkbox-archive"]',
    /** Ticked by default. */
    enabled: '[data-test="checkbox-enabled"]',
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },
} as const;
