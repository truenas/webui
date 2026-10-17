/**
 * Apps > Installed (`/apps/installed`): the Apps service status, the Configuration menu and the
 * Choose Pool dialog it opens.
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
} as const;

/** `SelectPoolDialog`, `<tn-dialog-shell testId="select-pool-dialog">`. */
export const selectAppsPoolDialogLocators = {
  /** What to wait on before acting on it. */
  title: '[data-test="dialog-title-select-pool-dialog"]',
  pool: '[data-test="select-pool"]',
  poolOption: (pool: string): string => `[data-test="option-pool-${kebabTestSegment(pool)}"]`,
  choose: '[data-test="button-choose"]',
} as const;
