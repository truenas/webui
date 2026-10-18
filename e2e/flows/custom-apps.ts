/**
 * Custom apps from YAML: Discover's Install via YAML, and an installed custom app's Edit. Both open
 * the same side panel, whose Save runs `app.create` or `app.update` behind a job progress dialog and
 * closes the panel only once the job has succeeded.
 */
import { expect, type Page } from '@playwright/test';
import { appInstallTimeoutMs } from '../fixtures/apps';
import { appCatalogLocators, customAppLocators, installedAppLocators } from '../locators/apps';

/**
 * From Apps > Installed: Discover Apps, then Install via YAML under Custom App's menu. Names the app,
 * puts `compose` in the editor, saves, and returns once the app's page has been left for the list.
 */
export async function installCustomAppFromYaml(page: Page, name: string, compose: string): Promise<void> {
  await page.locator(appCatalogLocators.discoverApps).click();
  await page.locator(customAppLocators.menu).click();
  await page.locator(customAppLocators.installViaYaml).click();

  await page.locator(customAppLocators.releaseName).fill(name);
  await page.locator(customAppLocators.config).fill(compose);
  await page.locator(customAppLocators.save).click();

  await expect(page.locator(customAppLocators.save)).toBeHidden({ timeout: appInstallTimeoutMs });
  await expect(page).toHaveURL(/\/apps\/installed$/);
}

/**
 * Selects the app's row and presses Edit on its Application Info card. Waits for the editor to hold
 * the app's current config, which it reads after the panel opens and which contains `loaded`, then
 * replaces it with `compose` and saves.
 */
export async function editCustomAppYaml(page: Page, name: string, loaded: string, compose: string): Promise<void> {
  await page.locator(installedAppLocators(name).name).click();
  await page.locator(customAppLocators.edit(name)).click();

  const config = page.locator(customAppLocators.config);
  await expect(config).toContainText(loaded);
  await config.fill(compose);
  await page.locator(customAppLocators.save).click();

  await expect(page.locator(customAppLocators.save)).toBeHidden({ timeout: appInstallTimeoutMs });
}
