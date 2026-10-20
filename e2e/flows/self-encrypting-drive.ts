/**
 * The Self-Encrypting Drive card's form, driven through the UI from
 * System > Advanced Settings.
 */
import { expect, type Page } from '@playwright/test';
import { closeFirstTimeWarning } from './advanced-settings';
import { selfEncryptingDriveLocators } from '../locators/self-encrypting-drive';
import { slowCallTimeoutMs } from '../support/timeouts';

/**
 * Opens the form from the card, as the first form on Advanced Settings.
 *
 * The form fills both fields from `system.advanced.sed_global_password` after it
 * opens, and keeps Save disabled until that answers. Save turning enabled is the
 * wait: typing before then would be overwritten by the load. Both fields are
 * valid empty, so every test starts from an enabled Save.
 */
export async function openSedForm(page: Page): Promise<void> {
  await page.locator(selfEncryptingDriveLocators.card.configure).click();
  await closeFirstTimeWarning(page);
  await expect(page.locator(selfEncryptingDriveLocators.form.save)).toBeEnabled();
}

/**
 * Saves the form and waits for the panel to close, the app's own signal that
 * the save succeeded. A refusal leaves it open with the error attached.
 */
export async function saveSedForm(page: Page): Promise<void> {
  await page.locator(selfEncryptingDriveLocators.form.save).click();
  await expect(page.locator(selfEncryptingDriveLocators.form.save)).toBeHidden({ timeout: slowCallTimeoutMs });
}
