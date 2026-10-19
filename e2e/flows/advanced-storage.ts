/**
 * The system dataset's pool and the priority resilvering window, driven through
 * the Storage card on System > Advanced Settings.
 */
import { expect, type Page } from '@playwright/test';
import { closeFirstTimeWarning } from './advanced-settings';
import { goToAdvancedSettings } from './navigation';
import { selectOption } from './storage';
import { systemDatasetMoveTimeoutMs } from '../fixtures/system-dataset';
import { advancedStorageLocators } from '../locators/advanced-storage';
import { confirmDialogLocators } from '../locators/dialogs';

/**
 * Opens the form from the card, starting from the sidebar.
 *
 * Waits first for the card to read the pool the test expects to start from,
 * then for the form's select to show that same pool. The form is filled from
 * `systemdataset.config` and `pool.resilver.config` after it opens, so a choice
 * made before then could be overwritten by the load.
 */
export async function openStorageSettingsForm(page: Page, currentPool: string): Promise<void> {
  const { card, form } = advancedStorageLocators;
  await goToAdvancedSettings(page);
  await expect(page.locator(card.systemDatasetPool)).toHaveText(currentPool);

  await page.locator(card.configure).click();
  await closeFirstTimeWarning(page);
  await expect(page.locator(form.systemDatasetPool)).toContainText(currentPool);
}

/** Picks a pool, by name, in the open form's System Dataset Pool select. */
export async function chooseSystemDatasetPool(page: Page, pool: string): Promise<void> {
  const { form } = advancedStorageLocators;
  await selectOption(page, form.systemDatasetPool, form.systemDatasetPoolOption(pool));
}

/**
 * Clicks each of these days, by name, in the open form's Days of the Week
 * select. A click toggles a day, so this both picks and drops.
 *
 * The select is multiple, so its panel stays open between clicks. Escape closes
 * it, and would close the side panel too if the select had not taken the key,
 * so Save is asserted still there afterwards.
 */
export async function toggleResilverWeekdays(page: Page, days: [string, ...string[]]): Promise<void> {
  const { form } = advancedStorageLocators;
  await page.locator(form.weekday).click();

  for (const day of days) {
    await page.locator(form.weekdayOption(day)).click();
  }

  await page.keyboard.press('Escape');
  await expect(page.locator(form.weekdayOption(days[0]))).toBeHidden();
  await expect(page.locator(form.save)).toBeVisible();
}

/** Picks From and To in the open form, by the labels the selects show: `HH:MM:00`. */
export async function chooseResilverWindow(page: Page, begin: string, end: string): Promise<void> {
  const { form } = advancedStorageLocators;
  await selectOption(page, form.begin, form.beginOption(begin));
  await selectOption(page, form.end, form.endOption(end));
}

/**
 * Saves the form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded. A refusal
 * leaves it open with the error attached. When the pool changed, the panel waits
 * for the `systemdataset.update` job, so the ceiling is a move's.
 */
export async function saveStorageSettingsForm(page: Page): Promise<void> {
  const { form } = advancedStorageLocators;
  await page.locator(form.save).click();
  await expect(page.locator(form.save)).toBeHidden({ timeout: systemDatasetMoveTimeoutMs });
}

/**
 * Closes the edited form without saving. The form is dirty, so the
 * unsaved-changes question is asserted rather than looked for.
 */
export async function discardStorageSettingsForm(page: Page): Promise<void> {
  const { form } = advancedStorageLocators;
  await page.locator(form.closePanel).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();
  await expect(page.locator(form.save)).toBeHidden();
}
