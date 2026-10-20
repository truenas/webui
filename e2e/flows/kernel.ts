/**
 * The Kernel card's form, driven through the UI from System > Advanced Settings.
 */
import { expect, type Page } from '@playwright/test';
import { closeFirstTimeWarning } from './advanced-settings';
import { debugKernelSaveTimeoutMs } from '../fixtures/kernel';
import { kernelLocators } from '../locators/kernel';

/**
 * Opens the form from the card, on Advanced Settings already.
 *
 * `firstFormOnPage` says whether to expect the first-time warning — see
 * `closeFirstTimeWarning`, which must not be called for a later form.
 */
export async function openKernelForm(page: Page, firstFormOnPage: boolean): Promise<void> {
  await page.locator(kernelLocators.card.configure).click();
  if (firstFormOnPage) {
    await closeFirstTimeWarning(page);
  }
  await expect(page.locator(kernelLocators.form.debugKernel)).toBeVisible();
}

/**
 * Saves the form and waits for the panel to close, the app's own signal that
 * the save succeeded.
 */
export async function saveKernelForm(page: Page): Promise<void> {
  await page.locator(kernelLocators.form.save).click();
  await expect(page.locator(kernelLocators.form.save)).toBeHidden({ timeout: debugKernelSaveTimeoutMs });
}
