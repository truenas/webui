/**
 * The Localization card on System > General Settings (timezone and console keymap, static `text` readouts holding
 * the value alone), and its form. The form is `ix-form-renderer` from `localization.form-config.ts`, so ids are
 * control names (see `locators/tunable.ts`). Timezone is a `tn-autocomplete`: `autocomplete-timezone` with
 * `option-timezone-<label>` rows, as in `locators/api-keys.ts`. Language and date format are per-account now,
 * in `locators/preferences.ts`.
 */
import { kebabTestSegment } from './test-id';

export const localizationLocators = {
  card: {
    /** The timezone's name, e.g. `America/Los_Angeles`. */
    timezone: '[data-test="text-timezone"]',
    /** `<tn-button [testId]="'localization-settings'">` in the card footer. Its label is translated. */
    settings: '[data-test="button-localization-settings"]',
  },

  form: {
    /** Shows the label of the timezone it holds. */
    timezone: '[data-test="autocomplete-timezone"]',
    timezoneOption: (label: string): string => `[data-test="option-timezone-${kebabTestSegment(label)}"]`,
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },
} as const;
