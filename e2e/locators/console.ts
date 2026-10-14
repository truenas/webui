/**
 * The Console card on System > Advanced Settings, and its form.
 *
 * The card has no rows: each setting is a readout tagged `tnTestIdType="text"`,
 * so its id is static. Each holds a single value, without its label.
 *
 * The form is built by `ix-form-renderer` from `console.form-config.ts`, so every
 * field's id is its control name — see `locators/tunable.ts`. MOTD Banner is a
 * `textarea` field, which emits `textarea-motd` rather than `input-motd`.
 */
export const consoleLocators = {
  card: {
    /** Show Text Console without Password Prompt: `Enabled` or `Disabled`. */
    consoleMenu: '[data-test="text-console-menu"]',
    /** `Enabled` or `Disabled`. */
    serialConsole: '[data-test="text-console-serial-console"]',
    /** The port, shown whether or not the serial console is on. */
    serialPort: '[data-test="text-console-serial-port"]',
    /** `<n> bps`. Shown whether or not the serial console is on. */
    serialSpeed: '[data-test="text-console-serial-speed"]',
    /** The banner, or `–` when it is empty. */
    motd: '[data-test="text-console-motd-banner"]',
    /** `<tn-button [testId]="['console', 'configure']">` in the card footer. */
    configure: '[data-test="button-console-configure"]',
  },

  form: {
    consoleMenu: '[data-test="checkbox-consolemenu"]',
    serialConsole: '[data-test="checkbox-serialconsole"]',
    /** Disabled while the serial console is off. */
    serialSpeed: '[data-test="select-serialspeed"]',
    /** Options are a fixed list whose labels are the speeds themselves. */
    serialSpeedOption: (speed: string): string => `[data-test="option-serialspeed-${speed}"]`,
    motd: '[data-test="textarea-motd"]',
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },
} as const;
