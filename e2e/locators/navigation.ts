/**
 * Main sidebar and submenu locators. `navigation.component.html` sets `tnTestIdType="link"` and
 * `[tnTestId]="getItemName(item)"`, which appends `-menu` and underscores spaces, so `'Storage'` normalizes to
 * `link-storage-menu`. Submenu entries use the raw name (`link-users`, not `link-users-menu`).
 */
import { kebabTestSegment } from './test-id';

/**
 * Global search, the topbar's "Search UI" box. It's only a trigger: clicking opens an overlay with a second
 * `input-global-search` and hides the first, so the id matches twice while open and the visible one is typed
 * into. A result is a `text` id `['search-result', hierarchy.join('-')]`, the breadcrumb it shows.
 */
export const globalSearchLocators = {
  input: '[data-test="input-global-search"]',
  result: (hierarchy: readonly string[]): string => (
    `[data-test="text-search-result-${kebabTestSegment(hierarchy.join('-'))}"]`
  ),
} as const;

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
  /** `KMIP` under Credentials, raw item name again. Hidden only when the KMIP entitlement is denied. */
  kmip: '[data-test="link-kmip"]',
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
  /**
   * `Shell` under System, raw item name again. Gated on the `web_shell` privilege: without it the
   * entry still renders, inside the role-missing wrapper.
   */
  shell: '[data-test="link-shell"]',
  /** `Audit` under System, raw item name again. */
  audit: '[data-test="link-audit"]',
} as const;
