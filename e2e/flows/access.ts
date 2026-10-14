/**
 * The Access card's session timeout, driven through the UI from System > Advanced Settings.
 */
import { expect, type Page } from '@playwright/test';
import { goToAdvancedSettings } from './navigation';
import { accessLocators } from '../locators/access';
import { preferencesLocators } from '../locators/preferences';

/**
 * Opens the Preferences form from the Access card's link, starting from the sidebar.
 *
 * Waits first for the card to show the timeout the test expects to start from,
 * then for the form's Session Timeout field to hold the same value in minutes.
 * The form is filled from the preferences the app last loaded, so a value typed
 * before then could be overwritten by it.
 *
 * No first-time warning: that is raised by the card's Configure button, and this
 * link opens the panel directly.
 */
export async function openSessionTimeoutFromAccessCard(
  page: Page,
  currentReadout: string,
  currentMinutes: number,
): Promise<void> {
  await goToAdvancedSettings(page);
  await expect(page.locator(accessLocators.card.sessionTimeout)).toHaveText(currentReadout);

  await page.locator(accessLocators.card.openPreferences).click();
  await expect(page.locator(preferencesLocators.form.sessionTimeout)).toHaveValue(String(currentMinutes));
}
