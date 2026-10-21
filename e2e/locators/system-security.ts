/**
 * The System Security card on System > Advanced Settings, and its form.
 *
 * The card's readouts are tagged `tnTestIdType="text"`, so their ids are static. The form's
 * controls carry no `testId`, so each id falls back to its `formControlName`, kebab-cased. The
 * four number fields' `tn-form-field`s carry a `testId` of their own, which is where a refused
 * value's message is read.
 */
import { kebabTestSegment } from './test-id';

export const systemSecurityLocators = {
  card: {
    /** `Yes` or `No`. */
    fips: '[data-test="text-security-enable-fips"]',
    /** `Yes` or `No`. */
    stig: '[data-test="text-security-enable-stig"]',
    /** `<n> days` (`1 day`), or `–` when unset. */
    minPasswordAge: '[data-test="text-security-min-password-age"]',
    /** `<n> days` (`1 day`), or `–` when unset. */
    maxPasswordAge: '[data-test="text-security-max-password-age"]',
    /** The rules' labels joined by commas, in the order middleware stores them, or `–`. */
    complexityRuleset: '[data-test="text-security-password-complexity-ruleset"]',
    /** `<n> characters`, or `–`. */
    minPasswordLength: '[data-test="text-security-min-password-length"]',
    /** `<n> entries`, or `–`. */
    passwordHistoryLength: '[data-test="text-security-password-history-length"]',
    /** `<tn-button [testId]="['system-security', 'settings']">` in the card footer: "Configure". */
    configure: '[data-test="button-system-security-settings"]',
  },

  form: {
    /**
     * The checkbox inside "Enable FIPS". `tn-slide-toggle` puts its id on the `<label>` around
     * it, so the checked state is read off the input. Read here, never clicked.
     */
    fipsCheckbox: '[data-test="toggle-enable-fips"] input[type="checkbox"]',
    /** "Enable TrueNAS STIG compatibility mode". Ticking it starts the requirements probe. */
    stig: '[data-test="toggle-enable-gpos-stig"]',
    minPasswordAge: '[data-test="input-min-password-age"]',
    minPasswordAgeField: '[data-test="form-field-min-password-age"]',
    maxPasswordAge: '[data-test="input-max-password-age"]',
    maxPasswordAgeField: '[data-test="form-field-max-password-age"]',
    /** A multiple select. */
    complexityRuleset: '[data-test="select-password-complexity-ruleset"]',
    /** By the rule's label: `Upper`, `Lower`, `Number`, `Special`. */
    complexityRulesetOption: (label: string): string => (
      `[data-test="option-password-complexity-ruleset-${kebabTestSegment(label)}"]`
    ),
    minPasswordLength: '[data-test="input-min-password-length"]',
    minPasswordLengthField: '[data-test="form-field-min-password-length"]',
    passwordHistoryLength: '[data-test="input-password-history-length"]',
    passwordHistoryLengthField: '[data-test="form-field-password-history-length"]',
    /**
     * A missing STIG requirement's action link, by the requirement's id: `root-session`,
     * `global-2fa`, `ssh-2fa`, `apps-service`, `root-password`, `admin-password`,
     * `current-user-2fa`, `user-2fa`, `current-session-2fa`, or the optional `all-users-2fa`.
     * Never clicked: Log out signs the suite's admin out.
     */
    stigRequirement: (id: string): string => `[data-test="link-configure-${id}"]`,
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
    /** The side panel's dismiss control. It asks first only when the form has unsaved edits. */
    closePanel: '[data-test="button-close-side-panel"]',
  },

  /** The dialog the app raises when `system.reboot.info` lists a reason after a save. */
  rebootRequiredTitle: '[data-test="dialog-title-reboot-required"]',
} as const;
