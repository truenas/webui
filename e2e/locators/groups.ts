/**
 * Groups page, group form, delete dialog and the members picker. The form is `ix-form-renderer` from
 * `group.form-config.ts`, which binds `[testId]="field.name"`, so ids read like API params (`sudo_commands_all`).
 * Only what the specs select on: an entry here reads as a verified fact about the screen, so ids stay out until
 * a test needs one (as in `locators/users.ts`). See `signin.ts` on the type-prefixing behind these values.
 */
import { kebabTestSegment, legacyKebabTestSegment } from './test-id';

export const groupsLocators = {
  /** `<tn-button [testId]="'add-group'">` in the page header. */
  addGroup: '[data-test="button-add-group"]',

  /** The basic search box, `<tn-input [testId]="'search'">`. It narrows the loaded list as you type. */
  search: '[data-test="input-search"]',

  /**
   * `<tn-slide-toggle [testId]="'show-built-in-groups'">`, off by default.
   *
   * Not view state: it writes the `hideBuiltinGroups` *preference* on the
   * account, so it is still set on the next visit. `tests/preferences.e2e.ts`
   * covers that; the group specs rely on the default holding.
   */
  showBuiltIns: '[data-test="toggle-show-built-in-groups"]',

  /**
   * A group's row in the list. Like users, `memoizedRowTag` pre-kebabs with lodash (`group-e-2-e-form-group`)
   * while the row's buttons use the library normalizer (`e2e-form-group`). The two agree on any name without a
   * letter-digit boundary, which makes picking the wrong one easy to miss.
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
    /** Rendered only for a local group that is neither built-in nor immutable. */
    edit: (group: string): string => `[data-test="button-${kebabTestSegment(group)}-edit"]`,
    delete: (group: string): string => `[data-test="button-${kebabTestSegment(group)}-delete"]`,
  },

  /**
   * A row's cells: `ix-table-text-cell` tags each one `[title, row tag, kind]`,
   * and the row tag is the lodash-kebabbed one {@link row} uses.
   */
  cell: {
    /** `Yes` while the group holds any sudo command, the wildcard included. */
    sudo: (group: string): string => (
      `[data-test="text-allows-sudo-commands-group-${legacyKebabTestSegment(group)}-row-yesno"]`
    ),
    smb: (group: string): string => (
      `[data-test="text-samba-authentication-group-${legacyKebabTestSegment(group)}-row-yesno"]`
    ),
    /** The roles' labels, comma-separated, or `N/A` when there are none. */
    roles: (group: string): string => `[data-test="text-roles-group-${legacyKebabTestSegment(group)}-row-text"]`,
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
    sudoCommands: '[data-test="chip-input-sudo-commands"]',
    /**
     * One committed command. The library scopes a free-text chip's id by its
     * value under the field's id, so `ALL` would be `chip-sudo-commands-all`.
     */
    sudoCommandChip: (command: string): string => `[data-test="chip-sudo-commands-${kebabTestSegment(command)}"]`,
    /** Disables {@link sudoCommands} rather than hiding it — `enabledWhen`, not `visibleWhen`. */
    sudoCommandsAll: '[data-test="checkbox-sudo-commands-all"]',
    sudoCommandsNopasswdAll: '[data-test="checkbox-sudo-commands-nopasswd-all"]',
    smb: '[data-test="checkbox-smb"]',
    /** A `tn-chip-input` offering the `privilege.query` names, and nothing typed freely. */
    privileges: '[data-test="chip-input-privileges"]',
    /** A suggestion under {@link privileges}, keyed by its label, the privilege name. */
    privilegesOption: (privilege: string): string => `[data-test="option-privileges-${kebabTestSegment(privilege)}"]`,
    /**
     * A selected privilege. Keyed by label once the options have loaded, and by
     * the numeric id until then — so waiting for this is waiting for both.
     */
    privilegesChip: (privilege: string): string => `[data-test="chip-privileges-${kebabTestSegment(privilege)}"]`,
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },

  /**
   * The members picker at `/credentials/groups/:pk/members`, a dual listbox: users on the `available` side,
   * members on `selected`. Which side a user is on is the whole state, so the per-item ids are how a test reads
   * it. They're built from the displayed username, since the picker's own key is an appliance-allocated user id,
   * so they're unique exactly as far as usernames are. See `dual-listbox-side.component.html`.
   */
  members: {
    available: (username: string): string => `[data-test="list-item-available-${kebabTestSegment(username)}"]`,
    selected: (username: string): string => `[data-test="list-item-selected-${kebabTestSegment(username)}"]`,
    moveRight: '[data-test="button-move-selected-right"]',
    moveLeft: '[data-test="button-move-selected-left"]',
    save: '[data-test="button-save"]',
  },
} as const;
