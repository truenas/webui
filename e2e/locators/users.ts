/**
 * Users page and user form locators.
 *
 * The user form opens in a side panel (`form-side-panel-container`), so its
 * save action belongs to the panel rather than to the form itself.
 *
 * See `signin.ts` for a note on the type-prefixing that produces these values.
 */
export const usersLocators = {
  /** `<tn-button testId="create-new-user">` in all-users-header */
  addUser: '[data-test="button-create-new-user"]',

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
