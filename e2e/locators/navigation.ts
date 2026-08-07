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
  /** A slide-out, not a link — opens a submenu rather than navigating. */
  credentials: '[data-test="link-credentials-menu"]',
  users: '[data-test="link-users"]',
} as const;
