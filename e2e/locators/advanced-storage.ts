/**
 * The Storage card on System > Advanced Settings, and its form.
 *
 * The card has no rows: each setting is a readout tagged `tnTestIdType="text"`,
 * so its id is static. Each holds a single value, without its label.
 *
 * The form's controls carry no `testId`, so each id falls back to its
 * `formControlName`, kebab-cased. A `tn-form-field` has no such fallback:
 * it emits `form-field-<id>` only from a `testId` of its own.
 */
import { kebabTestSegment } from './test-id';

export const advancedStorageLocators = {
  card: {
    /** System Dataset Pool: the pool's name. */
    systemDatasetPool: '[data-test="text-system-dataset-pool"]',
    /**
     * Resilvering At Higher Priority: `Never`, or `Between <begin> and <end>`
     * followed by `every day of the week`, `on weekends`, `on weekdays` or `on <days>`.
     */
    priorityResilver: '[data-test="text-resilvering-at-higher-priority"]',
    /** `<tn-button [testId]="['storage', 'configure']">` in the card footer. */
    configure: '[data-test="button-storage-configure"]',
  },

  form: {
    /** Fed by `systemdataset.pool_choices`, labelled by pool name, the boot pool included. */
    systemDatasetPool: '[data-test="select-system-dataset-pool"]',
    systemDatasetPoolOption: (pool: string): string => (
      `[data-test="option-system-dataset-pool-${kebabTestSegment(pool)}"]`
    ),
    /**
     * "Run Resilvering At Higher Priority At Certain Times". The three fields
     * below render only while it is ticked.
     */
    enabled: '[data-test="checkbox-enabled"]',
    /** "Days of the Week", a multiple select. Required. */
    weekday: '[data-test="select-weekday"]',
    /** By the day's English name: `Monday` … `Sunday`. */
    weekdayOption: (day: string): string => `[data-test="option-weekday-${kebabTestSegment(day)}"]`,
    /**
     * `<tn-form-field testId="weekday">` around {@link weekday}: its label and,
     * once refused, the reason.
     */
    weekdayField: '[data-test="form-field-weekday"]',
    /** "From". Its options are labelled `HH:MM:00` and carry the value `HH:MM`. */
    begin: '[data-test="select-begin"]',
    beginOption: (label: string): string => `[data-test="option-begin-${kebabTestSegment(label)}"]`,
    /** "To", the same options as {@link begin}. */
    end: '[data-test="select-end"]',
    endOption: (label: string): string => `[data-test="option-end-${kebabTestSegment(label)}"]`,
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
    /** The side panel's dismiss control. It asks first only when the form has unsaved edits. */
    closePanel: '[data-test="button-close-side-panel"]',
  },
} as const;
