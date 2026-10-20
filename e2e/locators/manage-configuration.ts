/**
 * Manage Configuration in the System > Advanced Settings page header, and the
 * Save Configuration dialog its Download File item opens.
 */
export const manageConfigurationLocators = {
  /** `<tn-button [testId]="'manage-configuration-menu'">`, which opens the menu. */
  menu: '[data-test="button-manage-configuration-menu"]',
  /** `<tn-menu-item [testId]="'download-configuration'">`, "Download File". */
  download: '[data-test="button-download-configuration"]',
} as const;

export const saveConfigDialogLocators = {
  /** `<tn-dialog-shell testId="save-config">`. What to wait on. */
  title: '[data-test="dialog-title-save-config"]',
  /** Export Password Secret Seed, ticked by default. */
  exportSeed: '[data-test="checkbox-export-seed"]',
  save: '[data-test="actions-save-config"] [data-test="button-save"]',
} as const;
