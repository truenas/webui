/**
 * Manage Configuration on System > Advanced Settings, driven through the UI.
 */
import { expect, type Download, type Page } from '@playwright/test';
import { goToAdvancedSettings } from './navigation';
import { manageConfigurationLocators, saveConfigDialogLocators } from '../locators/manage-configuration';

/**
 * A `config.save` job started through `core.download`, then the fetch of the
 * file it wrote. The database is vacuumed into a copy first, so this is longer
 * than the key downloads in `flows/storage.ts`.
 */
const configDownloadTimeoutMs = 120_000;

/** Goes to Advanced Settings and opens Manage Configuration > Download File. */
export async function openSaveConfigDialog(page: Page): Promise<void> {
  await goToAdvancedSettings(page);
  await page.locator(manageConfigurationLocators.menu).click();
  await page.locator(manageConfigurationLocators.download).click();
  await expect(page.locator(saveConfigDialogLocators.title)).toBeVisible();
}

/**
 * Clicks Save and returns the file the browser receives. The dialog closes
 * once the download has been handed over.
 */
export async function saveConfig(page: Page): Promise<Download> {
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: configDownloadTimeoutMs }),
    page.locator(saveConfigDialogLocators.save).click(),
  ]);
  await expect(page.locator(saveConfigDialogLocators.title)).toBeHidden();

  return download;
}
