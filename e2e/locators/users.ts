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
  },

  /**
   * "View API Keys" on the selected user's Access card — `tnTestIdType="link"`
   * with `[tnTestId]="['view-api-keys', user.username]"`. Rendered only for a
   * user who already holds a key; one with none is offered "Add API Key" instead.
   */
  viewApiKeys: (username: string): string => `[data-test="link-view-api-keys-${kebabTestSegment(username)}"]`,

  /**
   * "Add API Key" on the Access card — the link offered in place of
   * {@link viewApiKeys} to a user who holds no key yet and has a role to hold one with.
   */
  addApiKey: (username: string): string => `[data-test="link-add-api-key-${kebabTestSegment(username)}"]`,

  /** The Access card's SSH line: which SSH logins the user has, or "No SSH Access". */
  sshAccess: (username: string): string => `[data-test="text-ssh-access-${kebabTestSegment(username)}"]`,

  /** "Download Public Key" on the Access card, rendered only while the user has an `sshpubkey`. */
  downloadPublicKey: (username: string): string => `[data-test="link-download-keys-${kebabTestSegment(username)}"]`,

  /**
   * Lock and Unlock in the Access card's footer. The card renders one or the
   * other, from `locked`, so which one is on screen is itself the card's reading
   * of the account.
   */
  lockUser: (username: string): string => `[data-test="button-lock-user-${kebabTestSegment(username)}"]`,
  unlockUser: (username: string): string => `[data-test="button-unlock-user-${kebabTestSegment(username)}"]`,

  /** In the Password card's footer. Offered for a non-builtin user other than the one signed in. */
  generateOneTimePassword: (username: string): string =>
    `[data-test="button-generate-one-time-password-${kebabTestSegment(username)}"]`,

  /**
   * `<tn-dialog-shell testId="one-time-password-created">`, raised once the
   * password exists. The password is in a read-only multiline `tn-input`, which
   * renders a `<textarea>` — so `testId="one-time-password"` emits
   * `textarea-one-time-password`, the same shape as the API key dialog.
   */
  oneTimePasswordDialog: {
    title: '[data-test="dialog-title-one-time-password-created"]',
    password: '[data-test="textarea-one-time-password"]',
    close: '[data-test="button-close"]',
  },

  /**
   * `<tn-dialog-shell testId="password-change-required">`, which the admin
   * layout's guard raises over a session whose account must set a new password
   * before it may go further. Its Log Out is the only way past it without one.
   */
  passwordChangeRequiredDialog: {
    title: '[data-test="dialog-title-password-change-required"]',
    logOut: '[data-test="button-required-change-password-log-out"]',
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
  },
} as const;
