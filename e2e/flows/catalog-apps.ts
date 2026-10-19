/**
 * Catalog apps: finding one on Discover, installing it through the wizard, editing an installed one
 * in the same wizard, and updating, rolling back, deleting or converting one from its Application
 * Info card.
 */
import { expect, type Page } from '@playwright/test';
import { confirmDestructiveAction } from './storage';
import { appInstallTimeoutMs, catalogSyncTimeoutMs } from '../fixtures/apps';
import {
  appCatalogLocators,
  appDeleteDialogLocators,
  appInfoCardLocators,
  appRevisionLocators,
  appRollbackDialogLocators,
  appUpdateDialogLocators,
  catalogAppEditLocators,
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
  await page.locator(installedAppLocators(name).name).click();
  await page.locator(appInfoCardLocators.menu).click();
  await page.locator(appRevisionLocators(name).update).click();
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
  await page.locator(appRevisionLocators(name).rollback).click();
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

/** The wizard's route in edit mode. Leaving it is the wizard's own signal that the update succeeded. */
const editRoute = /\/edit$/;

/**
 * Selects the app's row and presses Edit on its Application Info card, landing on the install wizard
 * in edit mode. Waits for Application Name to hold the app's name, which the wizard fills only once
 * it has built the form from the installed version's schema.
 */
export async function openCatalogAppEdit(page: Page, name: string): Promise<void> {
  const app = installedAppLocators(name);

  await page.locator(app.name).click();
  await page.locator(app.edit).click();

  await expect(page).toHaveURL(editRoute);
  await expect(page.locator(appCatalogLocators.releaseName)).toHaveValue(name);
}

/**
 * Adds one row under Additional Environment Variables in the open wizard and fills it. The row's
 * fields are told apart from any other row's only by there being one, so that is checked first.
 */
export async function addEnvironmentVariable(page: Page, name: string, value: string): Promise<void> {
  await page.locator(catalogAppEditLocators.addEnvironmentVariable).click();

  const nameField = page.locator(catalogAppEditLocators.environmentName);
  await expect(nameField).toHaveCount(1);
  await nameField.fill(name);
  await page.locator(catalogAppEditLocators.environmentValue).fill(value);
}

/**
 * Presses Update in the wizard. It runs `app.update` behind a job dialog and leaves for the installed
 * app's page only once the job has succeeded; on a failure it stays, behind the error.
 */
export async function updateCatalogApp(page: Page): Promise<void> {
  await page.locator(catalogAppEditLocators.update).click();
  await expect(page).not.toHaveURL(editRoute, { timeout: appInstallTimeoutMs });
}

/**
 * Selects the app's row and runs Convert to custom app from its Application Info card's menu, through
 * the shared confirm, checking on the way that Convert waits for the tick box.
 *
 * Returns once the confirm has closed. The `app.convert_to_custom` job runs on behind a job dialog,
 * and what it did is the caller's to read.
 */
export async function convertToCustomApp(page: Page, name: string): Promise<void> {
  const app = installedAppLocators(name);

  await page.locator(app.name).click();
  await page.locator(appInfoCardLocators.menu).click();
  await page.locator(app.convert).click();

  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await expect(page.locator(confirmDialogLocators.confirm)).toBeDisabled();
  await confirmDestructiveAction(page);
  await expect(page.locator(confirmDialogLocators.title)).toBeHidden();
}
