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

  /**
   * Edit, beside {@link deleteUser} in the details pane.
   *
   * `[testId]="['edit-user', user().full_name]"`, so it is keyed on the *full
   * name*, not the username — `E2E e2e_roles_user` for an account made by
   * `ensureUserPresent`. Rendered for every user, the signed-in one included,
   * which makes it the anchor for Delete's absence on your own account.
   */
  editUser: (fullName: string): string => `[data-test="button-edit-user-${kebabTestSegment(fullName)}"]`,

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

  /**
   * The Profile card's readouts, each `tnTestIdType="text"` scoped by username:
   * `['profile-full-name', user().username]` and so on. Full Name and Email are
   * rendered only while the user has one.
   */
  profileFullName: (username: string): string => (
    `[data-test="text-profile-full-name-${kebabTestSegment(username)}"]`
  ),
  profileEmail: (username: string): string => `[data-test="text-profile-email-${kebabTestSegment(username)}"]`,
  profileHomeDirectory: (username: string): string => (
    `[data-test="text-profile-home-directory-${kebabTestSegment(username)}"]`
  ),

  /** The Access card's shell line: "Shell Access: <path>", or "No Shell Access". */
  shellAccess: (username: string): string => `[data-test="text-shell-access-${kebabTestSegment(username)}"]`,

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
  generateOneTimePassword: (username: string): string => (
    `[data-test="button-generate-one-time-password-${kebabTestSegment(username)}"]`
  ),

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
    /**
     * Full Name is an inline editable in Additional Details: the view,
     * `tnTestIdType="text"` with `'full-name'`, shows the value until clicked, and
     * only then is the `tn-input` there to fill.
     */
    fullNameValue: '[data-test="text-full-name"]',
    fullName: '[data-test="input-full-name"]',
    /**
     * Email, the same inline-editable shape. The readout is an empty `<div>` while
     * the user has no email, so a test clicking it seeds one first.
     */
    emailValue: '[data-test="text-email"]',
    email: '[data-test="input-email"]',
    /**
     * The Groups editable's readout. It shows the primary group, and clicking it
     * opens the primary group picker and {@link groups} together.
     */
    primaryGroupValue: '[data-test="text-primary-group"]',
    /** Auxiliary Groups, `<tn-chip-input [testId]="'groups'">`, offering existing groups only. */
    groups: '[data-test="chip-input-groups"]',
    /** A suggestion under {@link groups}. Keyed by its label, which is the group name. */
    groupsOption: (group: string): string => `[data-test="option-groups-${kebabTestSegment(group)}"]`,
    /** The Home Directory editable's readout. */
    homeValue: '[data-test="text-home-directory"]',
    /** `<tn-checkbox formControlName="home_create" [testId]="'home-create'">`. */
    homeCreate: '[data-test="checkbox-home-create"]',
    /** `ix-explorer formControlName="home"`: its `tn-file-picker`'s typable input takes the control name. */
    home: '[data-test="input-home"]',
    /**
     * Shown under the path once it is not `/var/empty`. While editing, the form
     * ticks it from the mode it reads off the existing home, so a home seeded at
     * anything but `700` leaves it unticked once that read has landed.
     */
    defaultPermissions: '[data-test="checkbox-default-permissions"]',
    /** The home path's validation message: the alert of the wrapping `tn-form-field`, which has no id of its own. */
    homeErrors: '[data-test="form-field-home"] [role="alert"]',
    /** The Shell editable's readout. The row is rendered only while Shell Access is ticked. */
    shellValue: '[data-test="text-shell"]',
    /** `<tn-select [testId]="'shell'">`. */
    shell: '[data-test="select-shell"]',
    /** Keyed by label, which `user.shell_choices` gives as the binary's name: `bash`, `zsh`. */
    shellOption: (label: string): string => `[data-test="option-shell-${kebabTestSegment(label)}"]`,
    /** `<tn-checkbox formControlName="smb" testId="smb-access">` in Allow Access. */
    smbAccess: '[data-test="checkbox-smb-access"]',
    /**
     * Raised under {@link smbAccess} when an edit turns SMB on without a new
     * password. It is a form-group error, so it holds Save disabled as well.
     */
    smbAccessError: '[data-test="text-smb-access-error"]',
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
