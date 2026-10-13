/**
 * Syslog settings, driven through the UI from System > Advanced Settings.
 */
import { expect, type Page } from '@playwright/test';
import { closeFirstTimeWarning } from './advanced-settings';
import { goToAdvancedSettings } from './navigation';
import { selectOption } from './storage';
import {
  syslogLevelLabels, syslogLocators, type SyslogLevel, type SyslogTransport,
} from '../locators/syslog';

/** Saving rewrites the syslog daemon's configuration and reloads it. */
const saveTimeoutMs = 60_000;

/**
 * Opens the form from the card, starting from the sidebar.
 *
 * Waits first for the card to show the level the test expects to start from.
 * The form loads its values from the same store as the card, so once the card
 * shows them the form opens already filled in. Clicking before that could tick a
 * box the form then overwrites as it loads.
 */
export async function openSyslogForm(page: Page, currentLevel: SyslogLevel): Promise<void> {
  await goToAdvancedSettings(page);
  await expect(page.locator(syslogLocators.card.level)).toHaveText(syslogLevelLabels[currentLevel]);

  await page.locator(syslogLocators.card.configure).click();
  await closeFirstTimeWarning(page);
  await expect(page.locator(syslogLocators.form.level)).toBeVisible();
}

/** Picks a level in the open form. */
export async function chooseSyslogLevel(page: Page, level: SyslogLevel): Promise<void> {
  await selectOption(page, syslogLocators.form.level, syslogLocators.form.levelOption(level));
}

/**
 * Adds a server to a form that has none, and fills it in.
 *
 * A new server starts on UDP, so the transport is picked only when it is another one.
 */
export async function addSyslogServer(page: Page, host: string, transport: SyslogTransport): Promise<void> {
  await page.locator(syslogLocators.form.addServer).click();
  await page.locator(syslogLocators.form.host).fill(host);

  if (transport !== 'UDP') {
    await selectOption(page, syslogLocators.form.transport, syslogLocators.form.transportOption(transport));
  }
}

/**
 * Saves the form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded. A refusal
 * leaves it open with the error attached.
 */
export async function saveSyslogForm(page: Page): Promise<void> {
  await page.locator(syslogLocators.form.save).click();
  await expect(page.locator(syslogLocators.form.save)).toBeHidden({ timeout: saveTimeoutMs });
}
