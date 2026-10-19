/**
 * Catalog apps: finding one on Discover, installing it through the wizard, and updating, rolling back
 * and deleting an installed one from its Application Info card.
 */
import { expect, type Page } from '@playwright/test';
import { appInstallTimeoutMs, catalogSyncTimeoutMs } from '../fixtures/apps';
import {
  appCatalogLocators,
  appDeleteDialogLocators,
  appInfoCardLocators,
  appRollbackDialogLocators,
  appUpdateDialogLocators,
  installedAppLocators,
} from '../locators/apps';
import { confirmDialogLocators } from '../locators/dialogs';
import { jobDialogLocators } from '../locators/encryption';

/** Discover's Refresh Catalog, and waits for the `catalog.sync` job dialog it raises to close. */
export async function refreshCatalog(page: Page): Promise<void> {
  await page.locator(appCatalogLocators.refreshCatalog).click();
  await expect(page.locator(jobDialogLocators.title)).toBeVisible();
  await expect(page.locator(jobDialogLocators.title)).toBeHidden({ timeout: catalogSyncTimeoutMs });
}

/** Searches Discover for `app` and opens its card, landing on the app's page with Install on it. */
export async function openCatalogApp(page: Page, train: string, app: string): Promise<void> {
  const card = page.locator(appCatalogLocators.appCard(train, app));

  await page.locator(appCatalogLocators.search).fill(app);
  // Unfiltered, an app can sit in more than one section. The search applies after a debounce.
  await expect(card).toHaveCount(1);
  await card.click();
  await expect(page.locator(appCatalogLocators.install(app))).toBeVisible();
}

/**
 * Ticks and agrees to the third-party apps warning the first Install raises for a user who has not
 * agreed yet. `disableClose`, so it is waited for rather than probed.
 */
export async function agreeToAppsWarning(page: Page): Promise<void> {
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.checkbox).click();
  await page.locator(confirmDialogLocators.confirm).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeHidden();
}

/**
 * Names the release in the open install wizard, leaves every other field at the catalog's default
 * and presses Install. The wizard leaves for the installed app's page only once the `app.create`
 * job has succeeded.
 */
export async function installWithDefaults(page: Page, app: string, release: string): Promise<void> {
  const releaseName = page.locator(appCatalogLocators.releaseName);

  // Prefilled with the catalog app's name once the wizard has loaded the app's schema.
  await expect(releaseName).toHaveValue(app);
  await releaseName.fill(release);
  await page.locator(appCatalogLocators.save).click();

  await expect(page).toHaveURL(/\/apps\/installed\//, { timeout: appInstallTimeoutMs });
}

/**
 * Selects the app's row, presses Delete on its Application Info card and confirms with the app's
 * name. Remove Images is ticked by default and is left that way, so the images go too. The dialog
 * closes before the `app.delete` job runs; the caller waits on the row.
 */
export async function deleteInstalledApp(page: Page, name: string): Promise<void> {
  const app = installedAppLocators(name);

  await page.locator(app.name).click();
  await page.locator(app.delete).click();

  await expect(page.locator(appDeleteDialogLocators.title)).toBeVisible();
  await page.locator(appDeleteDialogLocators.confirmName).fill(name);
  await expect(page.locator(appDeleteDialogLocators.removeImages)).toBeChecked();
  await page.locator(appDeleteDialogLocators.delete).click();
}

/**
 * Selects the app's row and presses Update in its Application Info card's menu. Returns once the
 * Update dialog, which waits on `app.upgrade_summary`, is open.
 */
export async function openAppUpdateDialog(page: Page, name: string): Promise<void> {
  const card = appInfoCardLocators(name);

  await page.locator(installedAppLocators(name).name).click();
  await page.locator(card.menu).click();
  await page.locator(card.update).click();
  await expect(page.locator(appUpdateDialogLocators.title)).toBeVisible();
}

/**
 * Presses Update in the open Update dialog, leaving its version select at the latest revision. The
 * dialog closes at once and the `app.upgrade` job runs behind a job dialog; the caller waits on the
 * outcome.
 */
export async function confirmAppUpdate(page: Page): Promise<void> {
  await page.locator(appUpdateDialogLocators.update).click();
  await expect(page.locator(appUpdateDialogLocators.title)).toBeHidden();
}

/**
 * Selects the app's row and presses Roll Back on its Application Info card. Roll Back appears only
 * once the card's `app.rollback_versions` has answered, which Playwright's click waits for. Returns
 * once the dialog is open.
 */
export async function openAppRollbackDialog(page: Page, name: string): Promise<void> {
  await page.locator(installedAppLocators(name).name).click();
  await page.locator(appInfoCardLocators(name).rollback).click();
  await expect(page.locator(appRollbackDialogLocators.title)).toBeVisible();
}

/**
 * Presses Roll Back in the open dialog, as it stands. The dialog stays open until the `app.rollback`
 * job dialog in front of it closes, so this returns once the rollback has finished.
 */
export async function confirmAppRollback(page: Page): Promise<void> {
  await page.locator(appRollbackDialogLocators.rollBack).click();
  await expect(page.locator(appRollbackDialogLocators.title)).toBeHidden({ timeout: appInstallTimeoutMs });
}
