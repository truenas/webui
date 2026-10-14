/**
 * Console settings, driven through the UI from System > Advanced Settings.
 */
import { expect, type Page } from '@playwright/test';
import { closeFirstTimeWarning } from './advanced-settings';
import { goToAdvancedSettings } from './navigation';
import { selectOption } from './storage';
import { consoleLocators } from '../locators/console';

/** Saving regenerates the boot loader's and the consoles' configuration. */
const saveTimeoutMs = 60_000;

/**
 * Opens the form from the card, starting from the sidebar.
 *
 * Waits first for the card to show the banner the test expects to start from,
 * then for the form to hold that same banner. The form is filled from what the
 * card last loaded, so a box ticked before then could be overwritten by it.
 */
export async function openConsoleForm(page: Page, currentMotd: string): Promise<void> {
  await goToAdvancedSettings(page);
  await expect(page.locator(consoleLocators.card.motd)).toHaveText(currentMotd);

  await page.locator(consoleLocators.card.configure).click();
  await closeFirstTimeWarning(page);
  await expect(page.locator(consoleLocators.form.motd)).toHaveValue(currentMotd);
}

/** Picks a serial speed in the open form. The serial console has to be on, or the select is disabled. */
export async function chooseSerialSpeed(page: Page, speed: string): Promise<void> {
  await selectOption(page, consoleLocators.form.serialSpeed, consoleLocators.form.serialSpeedOption(speed));
}

/**
 * Saves the form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded. A refusal
 * leaves it open with the error attached.
 */
export async function saveConsoleForm(page: Page): Promise<void> {
  await page.locator(consoleLocators.form.save).click();
  await expect(page.locator(consoleLocators.form.save)).toBeHidden({ timeout: saveTimeoutMs });
}
