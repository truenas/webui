/**
 * Main sidebar and submenu locators.
 *
 * Ids come from `navigation.component.html`, which sets `tnTestIdType="link"`
 * and `[tnTestId]="getItemName(item)"`. `getItemName` appends `-menu` and
 * replaces spaces with underscores, so `'Storage'` becomes `Storage-menu` and
 * normalizes to `link-storage-menu`.
 *
 * Submenu entries use the raw item name instead (`[tnTestId]="subItem.name"`),
 * so they are `link-users` rather than `link-users-menu`.
 */
export const navLocators = {
  dashboard: '[data-test="link-dashboard-menu"]',
  storage: '[data-test="link-storage-menu"]',
  datasets: '[data-test="link-datasets-menu"]',
  shares: '[data-test="link-shares-menu"]',
  /** `Data Protection` — `getItemName` turns the space into an underscore, which normalizes to a hyphen. */
  dataProtection: '[data-test="link-data-protection-menu"]',
  /** `Containers`, a plain link, and hidden without the Containers entitlement. */
  containers: '[data-test="link-containers-menu"]',
  /** `Virtual Machines`, a plain link like Data Protection, and hidden without the VM entitlement. */
  virtualMachines: '[data-test="link-virtual-machines-menu"]',
  /** `Reporting`, a plain link to the CPU tab (`reportsdashboard/cpu`). */
  reporting: '[data-test="link-reporting-menu"]',
  /** `Apps`, a plain link to the installed apps (`apps/installed`), and hidden without the Apps entitlement. */
  apps: '[data-test="link-apps-menu"]',
  /** A slide-out, not a link — opens a submenu rather than navigating. */
  credentials: '[data-test="link-credentials-menu"]',
  users: '[data-test="link-users"]',
  groups: '[data-test="link-groups"]',
  privileges: '[data-test="link-privileges"]',
  /** `Directory Services` under Credentials, raw item name again. */
  directoryServices: '[data-test="link-directory-services"]',
  /** `S3 Access Keys` under Credentials; the submenu writes the raw item name. */
  s3AccessKeys: '[data-test="link-s3-access-keys"]',
  /** `Backup Credentials` under Credentials, raw item name again. */
  backupCredentials: '[data-test="link-backup-credentials"]',
  /** `Certificates` under Credentials, raw item name again. */
  certificates: '[data-test="link-certificates"]',
  /** A slide-out, like Credentials. */
  system: '[data-test="link-system-menu"]',
  /** `Update` under System, raw item name again. */
  update: '[data-test="link-update"]',
  /** `General Settings` under System, raw item name again. */
  generalSettings: '[data-test="link-general-settings"]',
  advancedSettings: '[data-test="link-advanced-settings"]',
  /** `Network` under System, raw item name again. */
  network: '[data-test="link-network"]',
  /** `Alert Settings` under System, raw item name again. */
  alertSettings: '[data-test="link-alert-settings"]',
  /** `Boot` under System, raw item name again. */
  boot: '[data-test="link-boot"]',
  /** `Services` under System, raw item name again. */
  services: '[data-test="link-services"]',
  /** `Audit` under System, raw item name again. */
  audit: '[data-test="link-audit"]',
} as const;
