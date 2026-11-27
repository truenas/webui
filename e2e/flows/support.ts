/**
 * The Support card on System > General Settings, driven through the UI.
 */
import { expect, type Download, type Page } from '@playwright/test';
import { goToGeneralSettings } from './navigation';
import { confirmDialogLocators } from '../locators/dialogs';
import { jobDialogLocators } from '../locators/encryption';
import { generalSettingsLocators } from '../locators/general-settings';

/**
 * A `system.debug` job started through `core.download`, then the fetch of the archive it wrote.
 * The job gathers logs and command output from every subsystem and runs for a minute or more, so
 * this is a ceiling well above that rather than an expected duration. It sits inside the suite's
 * 20-minute per-test ceiling in `playwright.config.ts`, which leaves no need for a test-level one.
 */
const debugDownloadTimeoutMs = 10 * 60_000;

/** Goes to General Settings and presses the Support card's Save Debug, up to its confirmation. */
export async function openSaveDebugConfirmation(page: Page): Promise<void> {
  await goToGeneralSettings(page);
  await page.locator(generalSettingsLocators.support.saveDebug).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
}

/**
 * Confirms the open Save Debug dialog and returns the file the browser receives. The job dialog
 * closes before the download starts, so it is gone by the time this returns.
 */
export async function confirmSaveDebug(page: Page): Promise<Download> {
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: debugDownloadTimeoutMs }),
    page.locator(confirmDialogLocators.confirm).click(),
  ]);
  await expect(page.locator(jobDialogLocators.title)).toBeHidden();

  return download;
}
