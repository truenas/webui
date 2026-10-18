/**
 * Catalog apps: finding one on Discover, installing it through the wizard, and deleting an
 * installed one from its Application Info card.
 */
import { expect, type Page } from '@playwright/test';
import { appInstallTimeoutMs, catalogSyncTimeoutMs } from '../fixtures/apps';
import { appCatalogLocators, appDeleteDialogLocators, installedAppLocators } from '../locators/apps';
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
  await page.locator(appCatalogLocators.search).fill(app);
  await page.locator(appCatalogLocators.appCard(train, app)).click();
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
 * name, removing its images too. The dialog closes before the `app.delete` job runs; the caller
 * waits on the row.
 */
export async function deleteInstalledApp(page: Page, name: string): Promise<void> {
  const app = installedAppLocators(name);

  await page.locator(app.name).click();
  await page.locator(app.delete).click();

  await expect(page.locator(appDeleteDialogLocators.title)).toBeVisible();
  await page.locator(appDeleteDialogLocators.confirmName).fill(name);
  await page.locator(appDeleteDialogLocators.removeImages).click();
  await page.locator(appDeleteDialogLocators.delete).click();
}
