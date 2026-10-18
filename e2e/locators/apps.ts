/**
 * Apps > Installed (`/apps/installed`): the Apps service status, the Configuration menu and the
 * Choose Pool dialog and Settings panel it opens.
 */
import { kebabTestSegment } from './test-id';

export const appsLocators = {
  /**
   * The Apps service status beside the page title, from `docker-status.component.html`. Its text is
   * the `dockerStatusLabels` entry for `docker.status`: "Apps Service Running", "Apps Service Not
   * Configured", and so on.
   */
  dockerStatus: '[data-test="text-docker-status"]',

  /** The installed apps list's empty state, shown while no app is installed. */
  noInstalledApps: '[data-test="text-no-installed-apps"]',

  /** `<tn-button testId="apps-settings">`, the "Configuration" button that opens the menu below. */
  configMenu: '[data-test="button-apps-settings"]',

  /** `<tn-menu-item testId="choose-pool">`. Always in the menu for a user with `DOCKER_WRITE`. */
  choosePool: '[data-test="button-choose-pool"]',

  /** `<tn-menu-item testId="unset-pool">`. In the menu only while Apps has a pool. */
  unsetPool: '[data-test="button-unset-pool"]',

  /** `<tn-menu-item testId="update-preferred-trains">`, labelled "Settings". Opens the Apps Settings panel. */
  settings: '[data-test="button-update-preferred-trains"]',
} as const;

/**
 * The Apps Settings side panel, `apps-settings.component.html`.
 *
 * Both lists are form arrays whose controls keep their own names, so every address pool's base is
 * `input-base` and every mirror's URL is `input-url`. The row ids are what tell the rows apart, as
 * `row-environment-variable-<i>` does on the container form.
 */
export const appsSettingsLocators = {
  /**
   * One address pool, by its position. The base is an `ix-ip-input-with-netmask` with no `testId`,
   * so its address is `input-base` and its prefix `select-netmasks`. The prefix's options render in
   * an overlay outside the row, and only the open select has any.
   */
  addressPool: (index: number): { base: string; prefix: string; size: string } => {
    const row = `[data-test="row-address-pool-${index}"]`;
    return {
      base: `${row} [data-test="input-base"]`,
      prefix: `${row} [data-test="select-netmasks"]`,
      size: `${row} [data-test="input-size"]`,
    };
  },
  prefixOption: (bits: number): string => `[data-test="option-netmasks-${bits}"]`,

  /** "Add" under Registry Mirrors: `tn-form-list` names it `['add-item', label]`. */
  addRegistryMirror: '[data-test="button-add-item-registry-mirrors"]',
  /** One registry mirror, by its position. */
  registryMirror: (index: number): { url: string; insecure: string } => {
    const row = `[data-test="row-registry-mirror-${index}"]`;
    return {
      url: `${row} [data-test="input-url"]`,
      insecure: `${row} [data-test="checkbox-insecure"]`,
    };
  },

  enableImageUpdates: '[data-test="checkbox-enable-image-updates"]',

  /** The side panel's Save, `[testId]="'save'"` in form-side-panel-container. */
  save: '[data-test="button-save"]',
} as const;

/** `SelectPoolDialog`, `<tn-dialog-shell testId="select-pool-dialog">`. */
export const selectAppsPoolDialogLocators = {
  /** What to wait on before acting on it. */
  title: '[data-test="dialog-title-select-pool-dialog"]',
  pool: '[data-test="select-pool"]',
  poolOption: (pool: string): string => `[data-test="option-pool-${kebabTestSegment(pool)}"]`,
  choose: '[data-test="button-choose"]',
} as const;
