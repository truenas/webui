/**
 * Getting around the app the way a user does — clicking the sidebar.
 *
 * Deliberately no `page.goto()` to feature pages. Typing a URL is not what an
 * administrator does, and jumping straight to a route skips whatever the
 * navigation itself would have exercised: that the menu entry exists, is
 * visible to this user's role, and points where it claims to. A journey that
 * deep-links past the menu cannot notice when the menu breaks.
 *
 * `page.goto()` remains correct for *entering* the app (the sign-in page), and
 * for the token setup project, neither of which a user reaches by clicking.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { navLocators } from '../locators/navigation';

/** Route each destination should land on, used to confirm arrival. */
const expectedRoute = {
  dashboard: /\/dashboard\/?$/,
  storage: /\/storage\/?$/,
  datasets: /\/datasets/,
  shares: /\/sharing/,
  dataProtection: /\/data-protection\/?$/,
  containers: /\/containers/,
  virtualMachines: /\/vm\/?$/,
  reporting: /\/reportsdashboard\/cpu\/?$/,
  apps: /\/apps\/installed/,
  users: /\/credentials\/users/,
  groups: /\/credentials\/groups\/?$/,
  privileges: /\/credentials\/privileges\/?$/,
  directoryServices: /\/credentials\/directory-services\/?$/,
  s3AccessKeys: /\/credentials\/s3-access-keys/,
  backupCredentials: /\/credentials\/backup-credentials\/?$/,
  certificates: /\/credentials\/certificates\/?$/,
  update: /\/system\/update\/?$/,
  generalSettings: /\/system\/general\/?$/,
  advancedSettings: /\/system\/advanced\/?$/,
  network: /\/system\/network\/?$/,
  alertSettings: /\/system\/alert-settings\/?$/,
  boot: /\/system\/boot\/?$/,
  services: /\/system\/services\/?$/,
  audit: /\/system\/audit/,
} as const;

/**
 * Resolves a nav locator to the entry the user can actually see.
 *
 * The sidebar renders some entries more than once — the Credentials submenu
 * appears both inline and in a slide-out overlay, both carrying the same
 * `data-test`. A bare selector is therefore ambiguous, and whichever copy is
 * currently hidden cannot be clicked anyway.
 *
 * (Duplicate ids across simultaneously-rendered elements are worth fixing
 * upstream; filtering by visibility is correct regardless, since it targets
 * what the user would click.)
 */
function visibleNavLink(page: Page, locator: string): Locator {
  return page.locator(locator).filter({ visible: true }).first();
}

async function clickAndArrive(page: Page, locator: string, route: RegExp): Promise<void> {
  await visibleNavLink(page, locator).click();
  await expect(page).toHaveURL(route);
}

/**
 * The Dashboard is where sign-in lands, so this click often stays put. It is still the entry a
 * user would press to come back, which is what makes it worth going through.
 */
export async function goToDashboard(page: Page): Promise<void> {
  await clickAndArrive(page, navLocators.dashboard, expectedRoute.dashboard);
}

export async function goToStorage(page: Page): Promise<void> {
  await clickAndArrive(page, navLocators.storage, expectedRoute.storage);
}

export async function goToDatasets(page: Page): Promise<void> {
  await clickAndArrive(page, navLocators.datasets, expectedRoute.datasets);
}

export async function goToShares(page: Page): Promise<void> {
  await clickAndArrive(page, navLocators.shares, expectedRoute.shares);
}

/**
 * Data Protection is a plain link, not a slide-out. Anchored to the end because
 * each card's full list lives under it (`/data-protection/snapshot`).
 */
export async function goToDataProtection(page: Page): Promise<void> {
  await clickAndArrive(page, navLocators.dataProtection, expectedRoute.dataProtection);
}

/**
 * Containers is a plain link too. Not anchored to the end, because a selected container's details
 * live under it (`/containers/view/:id`).
 */
export async function goToContainers(page: Page): Promise<void> {
  await clickAndArrive(page, navLocators.containers, expectedRoute.containers);
}

/**
 * Virtual Machines is a plain link too. Anchored to the end because each VM's devices live under it
 * (`/vm/:pk/devices`).
 */
export async function goToVirtualMachines(page: Page): Promise<void> {
  await clickAndArrive(page, navLocators.virtualMachines, expectedRoute.virtualMachines);
}

/** Reporting is a plain link that opens on the CPU tab, which is the tab this lands on. */
export async function goToReporting(page: Page): Promise<void> {
  await clickAndArrive(page, navLocators.reporting, expectedRoute.reporting);
}

/**
 * Apps is a plain link that opens on the installed apps. Not anchored to the end, because an app's
 * details live under it (`/apps/installed/<train>/<app>`).
 */
export async function goToApps(page: Page): Promise<void> {
  await clickAndArrive(page, navLocators.apps, expectedRoute.apps);
}

/** Credentials is a slide-out, so reaching Users takes two clicks. */
export async function goToUsers(page: Page): Promise<void> {
  await visibleNavLink(page, navLocators.credentials).click();
  await clickAndArrive(page, navLocators.users, expectedRoute.users);
}

/**
 * Groups sits beside Users under the same Credentials slide-out.
 *
 * The route is anchored to the end because the members picker lives under
 * `/credentials/groups/:pk/members` — without that, a test still sitting on the
 * members page would read as having arrived at the list.
 */
export async function goToGroups(page: Page): Promise<void> {
  await visibleNavLink(page, navLocators.credentials).click();
  await clickAndArrive(page, navLocators.groups, expectedRoute.groups);
}

/** Privileges sits beside Groups under the same Credentials slide-out. */
export async function goToPrivileges(page: Page): Promise<void> {
  await visibleNavLink(page, navLocators.credentials).click();
  await clickAndArrive(page, navLocators.privileges, expectedRoute.privileges);
}

/**
 * Directory Services sits beside Privileges under the same Credentials slide-out. The page holds the
 * Kerberos Realms and Keytab cards too, behind its Advanced Settings.
 */
export async function goToDirectoryServices(page: Page): Promise<void> {
  await visibleNavLink(page, navLocators.credentials).click();
  await clickAndArrive(page, navLocators.directoryServices, expectedRoute.directoryServices);
}

/**
 * S3 Access Keys lives under the same Credentials slide-out as Users.
 *
 * The S3 bucket list page carries a link with the same id (`link-s3-access-keys`,
 * a shortcut next to its Add button), but that page is never where this starts:
 * a user reaching Credentials from the dashboard sees only the sidebar copy, and
 * `visibleNavLink` takes the first visible one regardless.
 */
export async function goToS3AccessKeys(page: Page): Promise<void> {
  await visibleNavLink(page, navLocators.credentials).click();
  await clickAndArrive(page, navLocators.s3AccessKeys, expectedRoute.s3AccessKeys);
}

/** Backup Credentials — cloud credentials, SSH connections and SSH keypairs — is under Credentials too. */
export async function goToBackupCredentials(page: Page): Promise<void> {
  await visibleNavLink(page, navLocators.credentials).click();
  await clickAndArrive(page, navLocators.backupCredentials, expectedRoute.backupCredentials);
}

/** Certificates — certificates, CSRs and ACME DNS authenticators — is under Credentials too. */
export async function goToCertificates(page: Page): Promise<void> {
  await visibleNavLink(page, navLocators.credentials).click();
  await clickAndArrive(page, navLocators.certificates, expectedRoute.certificates);
}

/** Update is the first entry under the System slide-out. */
export async function goToUpdate(page: Page): Promise<void> {
  await visibleNavLink(page, navLocators.system).click();
  await clickAndArrive(page, navLocators.update, expectedRoute.update);
}

/** System is a slide-out too, so General Settings takes two clicks the same way. */
export async function goToGeneralSettings(page: Page): Promise<void> {
  await visibleNavLink(page, navLocators.system).click();
  await clickAndArrive(page, navLocators.generalSettings, expectedRoute.generalSettings);
}

/** Advanced Settings sits beside General Settings under the same System slide-out. */
export async function goToAdvancedSettings(page: Page): Promise<void> {
  await visibleNavLink(page, navLocators.system).click();
  await clickAndArrive(page, navLocators.advancedSettings, expectedRoute.advancedSettings);
}

/** Network sits beside Advanced Settings under the same System slide-out. */
export async function goToNetwork(page: Page): Promise<void> {
  await visibleNavLink(page, navLocators.system).click();
  await clickAndArrive(page, navLocators.network, expectedRoute.network);
}

/**
 * Alert Settings is under the same System slide-out. Anchored to the end because
 * the standalone Alert Services list lives under it (`/system/alert-settings/services`).
 */
export async function goToAlertSettings(page: Page): Promise<void> {
  await visibleNavLink(page, navLocators.system).click();
  await clickAndArrive(page, navLocators.alertSettings, expectedRoute.alertSettings);
}

/**
 * Boot — the boot environment list — is under the same System slide-out. Anchored
 * to the end because Boot Pool Status lives under it (`/system/boot/status`).
 */
export async function goToBootEnvironments(page: Page): Promise<void> {
  await visibleNavLink(page, navLocators.system).click();
  await clickAndArrive(page, navLocators.boot, expectedRoute.boot);
}

/** Services is under the same System slide-out. */
export async function goToServices(page: Page): Promise<void> {
  await visibleNavLink(page, navLocators.system).click();
  await clickAndArrive(page, navLocators.services, expectedRoute.services);
}

/**
 * Audit is under the same System slide-out. Not anchored to the end, because the page can write its
 * service, sorting and paging into the URL (`/system/audit/<options>`).
 */
export async function goToAudit(page: Page): Promise<void> {
  await visibleNavLink(page, navLocators.system).click();
  await clickAndArrive(page, navLocators.audit, expectedRoute.audit);
}
