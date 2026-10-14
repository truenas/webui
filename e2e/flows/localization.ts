/**
 * The Localization card's form, driven through the UI from System > General Settings.
 */
import { expect, type Page } from '@playwright/test';
import { goToGeneralSettings } from './navigation';
import { localizationLocators } from '../locators/localization';

/** `system.general.update` reconfigures the appliance's clock, so it is not instant. */
const saveTimeoutMs = 60_000;

/**
 * Opens the form from the card, starting from the sidebar.
 *
 * Waits first for the card to show the timezone the test expects to start from,
 * then for the form's Timezone field to show that timezone's label. The card
 * hands the form the record it loaded, so once both agree the panel is editing
 * that record rather than an empty form.
 */
export async function openLocalizationForm(page: Page, timezone: string, timezoneLabel: string): Promise<void> {
  await goToGeneralSettings(page);
  await expect(page.locator(localizationLocators.card.timezone)).toHaveText(timezone);

  await page.locator(localizationLocators.card.settings).click();
  await expect(page.locator(localizationLocators.form.timezone)).toHaveValue(timezoneLabel);
}

/**
 * Picks a timezone by the label its option shows.
 *
 * The field is an autocomplete over several hundred timezones, so the row is not
 * in the DOM until the typed text has narrowed the list to it, and clicking the
 * row is what commits the value, not the text.
 */
export async function chooseTimezone(page: Page, label: string): Promise<void> {
  await page.locator(localizationLocators.form.timezone).fill(label);
  await page.locator(localizationLocators.form.timezoneOption(label)).click();
}

/**
 * Saves the form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded. A refusal
 * leaves it open with the error attached.
 */
export async function saveLocalizationForm(page: Page): Promise<void> {
  await page.locator(localizationLocators.form.save).click();
  await expect(page.locator(localizationLocators.form.save)).toBeHidden({ timeout: saveTimeoutMs });
}
