/**
 * System > Update.
 */
import { kebabTestSegment } from './test-id';

export const updateLocators = {
  /** Manual Update's Install. The page renders it whatever the update check returned. */
  installManualUpdate: '[data-test="button-install-manual-update"]',
  /** The version the update server offers. Rendered only when it offers one. */
  updateVersion: '[data-test="text-update-version"]',
  /** "System is up to date!". Rendered only when the check succeeded and offered nothing. */
  upToDate: '[data-test="text-system-up-to-date"]',

  /**
   * The Update Profile card (`ix-update-profile-card`). The page renders it only once
   * `update.profile_choices`, `update.status` and `update.config` have all answered.
   */
  profile: {
    /** `<tn-select testId="update-profile">`. Lists the available profiles only, labelled by `name`. */
    select: '[data-test="select-update-profile"]',
    /** One of {@link select}'s options. The library keys an option by its label, the profile's `name`. */
    option: (name: string): string => `[data-test="option-update-profile-${kebabTestSegment(name)}"]`,
    /** Every option {@link select} offers. A prefix, because the set is the appliance's. */
    options: '[data-test^="option-update-profile-"]',
    apply: '[data-test="button-apply-profile"]',
    /** "Current Profile:". Rendered only when the current profile is not one the select can offer. */
    current: '[data-test="text-current-profile"]',
    /** A profile's name in the list below the select, available or not. */
    name: (name: string): string => `[data-test="text-profile-${kebabTestSegment(name)}-name"]`,
  },
} as const;
