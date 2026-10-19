/**
 * The Access card, driven through the UI from System > Advanced Settings: its
 * session timeout, and the sessions it lists.
 */
import { expect, type Page } from '@playwright/test';
import { goToAdvancedSettings } from './navigation';
import { confirmDestructiveAction } from './storage';
import { accessLocators } from '../locators/access';
import { confirmDialogLocators } from '../locators/dialogs';
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

/** How many sessions the card lists before View All: its pager's `pageSize`. */
export const accessSessionsPageSize = 5;

/**
 * Opens System > Advanced Settings from the sidebar and, when the appliance holds
 * more sessions than the card lists, presses View All so every row is in the DOM.
 *
 * The caller passes the count, read over the API just before, because whether
 * View All renders at all depends on it, and probing the page for the button
 * would race the card's load. The card reads the sessions once, when it opens, so
 * every session the test needs has to exist before this runs.
 */
export async function openAccessSessions(page: Page, total: number): Promise<void> {
  await goToAdvancedSettings(page);
  await expect(page.locator(accessLocators.sessions.terminateOthers)).toBeVisible();

  if (total <= accessSessionsPageSize) {
    return;
  }

  await page.locator(accessLocators.sessions.viewAll).click();
  await expect(page.locator(accessLocators.sessions.collapse)).toBeVisible();
}

/** Ends one session from its row, through webui's shared confirm. */
export async function terminateSessionFromRow(page: Page, username: string, origin: string): Promise<void> {
  await page.locator(accessLocators.sessions.terminate(username, origin)).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await confirmDestructiveAction(page);
}

/** Ends every session but the browser's own, from the card footer, through webui's shared confirm. */
export async function terminateOtherSessions(page: Page): Promise<void> {
  await page.locator(accessLocators.sessions.terminateOthers).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await confirmDestructiveAction(page);
}
