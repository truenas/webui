/**
 * Replication settings, driven through the UI from System > Advanced Settings.
 */
import { expect, type Page } from '@playwright/test';
import { closeFirstTimeWarning } from './advanced-settings';
import { goToAdvancedSettings } from './navigation';
import { replicationLocators } from '../locators/replication';

/**
 * Opens the form from the card, starting from the sidebar.
 *
 * Waits first for the card to show the limit the test expects to start from,
 * then for the form to hold the same value. The card hands the form the record
 * it loaded, so once the readout is right the form is filled from it.
 *
 * `currentLimit` is the readout: the number, or `–` for no limit, which the
 * form shows as an empty field.
 */
export async function openReplicationForm(page: Page, currentLimit: string): Promise<void> {
  await goToAdvancedSettings(page);
  await expect(page.locator(replicationLocators.card.tasksLimit)).toHaveText(currentLimit);

  await page.locator(replicationLocators.card.configure).click();
  await closeFirstTimeWarning(page);
  await expect(page.locator(replicationLocators.form.tasksLimit))
    .toHaveValue(currentLimit === '–' ? '' : currentLimit);
}

/**
 * Saves the form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded. A refusal
 * leaves it open with the error attached.
 */
export async function saveReplicationForm(page: Page): Promise<void> {
  await page.locator(replicationLocators.form.save).click();
  await expect(page.locator(replicationLocators.form.save)).toBeHidden();
}
