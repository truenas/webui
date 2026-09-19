/**
 * Users page and user form locators.
 *
 * The user form opens in a side panel (`form-side-panel-container`), so its
 * save action belongs to the panel rather than to the form itself.
 *
 * See `signin.ts` for a note on the type-prefixing that produces these values.
 */
import { kebabTestSegment, legacyKebabTestSegment } from './test-id';

export const usersLocators = {
  /** `<tn-button testId="create-new-user">` in all-users-header */
  addUser: '[data-test="button-create-new-user"]',

  /**
   * A user's row in the list.
   *
   * `memoizedRowTag` runs lodash `kebabCase`, not the library's
   * `kebabTestSegment`, so this needs the legacy normalizer: `e2e_form_user`
   * becomes `e-2-e-form-user`, not `e2e-form-user`. The two agree on names
   * without a letter-digit boundary — `truenas_admin` is the same either way,
   * which is what makes picking the wrong one easy to miss.
   */
  row: (username: string): string => `[data-test="row-user-${legacyKebabTestSegment(username)}"]`,

  /**
   * Any user row, for waiting on the list rather than on a particular account.
   *
   * A prefix match because no single username is guaranteed: the list hides
   * built-in users behind a toggle that is off by default, so `root` is not
   * there, and the account the run signs in as differs between targets.
   */
  anyRow: '[data-test^="row-user-"]',

  /**
   * Delete, in the details pane for the selected user.
   *
   * `<tn-button [testId]="['delete', user().username]">`, so this one goes
   * through the *library's* normalizer — unlike {@link row} beside it, which
   * the table pre-kebabs with lodash. Same username, two spellings.
   */
  deleteUser: (username: string): string => `[data-test="button-delete-${kebabTestSegment(username)}"]`,

  /** The confirmation raised by that button. `<tn-dialog-shell testId="delete-user">`. */
  deleteDialog: {
    title: '[data-test="dialog-title-delete-user"]',
    /** Offered only when the user is the last member of its primary group. */
    deletePrimaryGroup: '[data-test="checkbox-delete-primary-group"]',
    /** Exact match, so it does not collide with the pane's `button-delete-<username>`. */
    confirm: '[data-test="button-delete"]',
    cancel: '[data-test="button-cancel"]',
  },

  form: {
    /** `<tn-input [testId]="'username'">` in user-form.component.html */
    username: '[data-test="input-username"]',
    /** `<tn-checkbox formControlName="truenas_access" testId="truenas-access">` */
    truenasAccess: '[data-test="checkbox-truenas-access"]',
    /**
     * `<tn-select [testId]="'role'">`. Revealed only once TrueNAS access is
     * checked — the control sits behind `showAccessRoleControl()`.
     */
    role: '[data-test="select-role"]',
    /**
     * Role options are scoped by the select's base and discriminated by the
     * option's `value`, so `Role.FullAdmin` (`FULL_ADMIN`) kebab-cases to this.
     */
    roleFullAdmin: '[data-test="option-role-full-admin"]',
    /** `<tn-input [testId]="'password'">` in auth-section */
    password: '[data-test="input-password"]',
    /** `<tn-input [testId]="'password-confirm'">` */
    passwordConfirm: '[data-test="input-password-confirm"]',
    /** `<tn-button [testId]="'save'">` on the side panel container */
    save: '[data-test="button-save"]',
    /** Closes the panel without saving. */
    close: '[data-test="button-close-side-panel"]',
  },
} as const;
