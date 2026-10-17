/**
 * The Network Configuration card's Settings form, driven through the UI from System > Network.
 */
import { expect, type Page } from '@playwright/test';
import { goToNetwork } from './navigation';
import { confirmDialogLocators } from '../locators/dialogs';
import { networkConfigLocators } from '../locators/network';

/**
 * How long a save may take, and a refusal to come back. A save rewrites the hosts
 * and resolver files and restarts the discovery services.
 */
export const networkSaveTimeoutMs = 60_000;

/**
 * Opens the Settings form from the card, starting from the sidebar.
 *
 * `loadedHostname` is the hostname the appliance holds. The form fills itself
 * after it opens, so editing before that hostname appears could type into a
 * field the load then overwrites.
 */
export async function openNetworkSettings(page: Page, loadedHostname: string): Promise<void> {
  await goToNetwork(page);
  await page.locator(networkConfigLocators.card.settings).click();
  await expect(page.locator(networkConfigLocators.form.hostname)).toHaveValue(loadedHostname);
}

/**
 * Saves the open form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded. A refusal
 * leaves it open with the error attached.
 */
export async function saveNetworkSettings(page: Page): Promise<void> {
  await page.locator(networkConfigLocators.save).click();
  await expect(page.locator(networkConfigLocators.save)).toBeHidden({ timeout: networkSaveTimeoutMs });
}

/** Types each value into a chip field and commits it with Enter. */
export async function addChips(page: Page, field: string, values: string[]): Promise<void> {
  for (const value of values) {
    await page.locator(field).fill(value);
    await page.locator(field).press('Enter');
  }
}

/**
 * Closes the edited form without saving. The form is dirty, so the
 * unsaved-changes question is asserted rather than looked for.
 */
export async function discardNetworkSettings(page: Page): Promise<void> {
  await page.locator(networkConfigLocators.closePanel).click();
  const discard = page.locator(confirmDialogLocators.confirm);
  await expect(discard).toBeVisible();
  await discard.click();
  await expect(page.locator(networkConfigLocators.save)).toBeHidden();
}
