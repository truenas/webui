/**
 * Groups page, group form, delete dialog and the members picker.
 *
 * The group form is built by `ix-form-renderer` from a declarative config
 * (`group.form-config.ts`) rather than a hand-written template, so every field's
 * id is its *control name* — the renderer binds `[testId]="field.name"` for all
 * field types. That is why the ids below read like API parameters
 * (`sudo_commands_nopasswd_all`) rather than like labels.
 *
 * See `signin.ts` for a note on the type-prefixing that produces these values.
 */
import { kebabTestSegment, legacyKebabTestSegment } from './test-id';

export const groupsLocators = {
  /** `<tn-button [testId]="'add-group'">` in the page header. */
  addGroup: '[data-test="button-add-group"]',

  /** `<tn-slide-toggle [testId]="'show-built-in-groups'">`; off by default. */
  showBuiltIns: '[data-test="toggle-show-built-in-groups"]',

  /**
   * A group's row in the list.
   *
   * The same normalizer split the users list has: `memoizedRowTag` pre-kebabs
   * the whole tag with lodash, so `e2e_form_group` lands as
   * `group-e-2-e-form-group`, while the buttons inside the row (below) go
   * through the library's normalizer and get `e2e-form-group`. One group, two
   * spellings, and they agree on any name without a letter-digit boundary —
   * which is exactly what makes picking the wrong one easy to miss.
   */
  row: (group: string): string => `[data-test="row-group-${legacyKebabTestSegment(group)}"]`,

  /**
   * The actions in a row's detail panel, revealed by clicking the row.
   *
   * `<tn-button [testId]="[group().group, 'members']">` and friends, so these
   * take the *library's* normalizer — see {@link row}.
   *
   * Delete is rendered disabled whenever the group holds members, privileges,
   * or is not local; `group-details-row.component.ts` decides that, and
   * `groups-members.e2e.ts` covers the members half of it.
   */
  rowAction: {
    members: (group: string): string => `[data-test="button-${kebabTestSegment(group)}-members"]`,
    edit: (group: string): string => `[data-test="button-${kebabTestSegment(group)}-edit"]`,
    delete: (group: string): string => `[data-test="button-${kebabTestSegment(group)}-delete"]`,
  },

  /** The confirmation raised by Delete. `<tn-dialog-shell testId="delete-group">`. */
  deleteDialog: {
    title: '[data-test="dialog-title-delete-group"]',
    confirm: '[data-test="button-delete"]',
  },

  form: {
    /** Pre-filled from `group.get_next_gid`, and disabled once the group exists. */
    gid: '[data-test="input-gid"]',
    name: '[data-test="input-name"]',
    /** A `tn-chip-input`, whose id sits on the text field inside it. */
    privileges: '[data-test="chip-input-privileges"]',
    /**
     * Options are scoped by the chip input's base and labelled by privilege
     * name, so `Read-Only Administrator` normalizes to this.
     */
    privilegeReadOnly: '[data-test="option-privileges-read-only-administrator"]',
    sudoCommands: '[data-test="chip-input-sudo-commands"]',
    /** Disables {@link sudoCommands} rather than hiding it — `enabledWhen`, not `visibleWhen`. */
    sudoCommandsAll: '[data-test="checkbox-sudo-commands-all"]',
    sudoCommandsNoPasswd: '[data-test="chip-input-sudo-commands-nopasswd"]',
    sudoCommandsNoPasswdAll: '[data-test="checkbox-sudo-commands-nopasswd-all"]',
    smb: '[data-test="checkbox-smb"]',
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },

  /**
   * The members picker at `/credentials/groups/:pk/members`.
   *
   * A dual listbox: users sit on the `available` side, members on the
   * `selected` side, and the arrow buttons move whatever is selected between
   * them. Which side a user is on is the entire state of the screen, so the
   * per-item ids below are how a test reads it.
   */
  members: {
    available: (username: string): string => `[data-test="list-item-available-${kebabTestSegment(username)}"]`,
    selected: (username: string): string => `[data-test="list-item-selected-${kebabTestSegment(username)}"]`,
    moveRight: '[data-test="button-move-selected-right"]',
    moveLeft: '[data-test="button-move-selected-left"]',
    /** Filters the available side; the move-all buttons act on what it leaves. */
    searchAvailable: '[data-test="input-search-available"]',
    hideBuiltInUsers: '[data-test="checkbox-hide-builtin-users"]',
    save: '[data-test="button-save"]',
    cancel: '[data-test="button-cancel"]',
  },
} as const;
