/**
 * The Localization card on System > General Settings, and its form.
 *
 * The card shows the appliance's timezone and console keyboard map. Its readouts
 * are tagged `tnTestIdType="text"`, so their ids are static, and each holds the
 * value alone, without its label.
 *
 * The form is built by `ix-form-renderer` from `localization.form-config.ts`, so
 * every field's id is its control name — see `locators/tunable.ts`. Timezone is a
 * `combobox`, which the renderer draws as a library `tn-autocomplete`: the input
 * is `autocomplete-timezone` and its rows are `option-timezone-<label>`, the same
 * shape as the user pickers in `locators/api-keys.ts`.
 *
 * Language and date format are not on this card. They moved to the Preferences
 * form, where they are the signed-in account's rather than the appliance's — see
 * `locators/preferences.ts`.
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
