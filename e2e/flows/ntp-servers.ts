/**
 * NTP servers, driven through the UI from System > Advanced Settings.
 *
 * Unlike most cards on that page, NTP Servers opens its form without the
 * first-time warning, so nothing here waits for one.
 */
import { expect, type Page } from '@playwright/test';
import { goToAdvancedSettings } from './navigation';
import { confirmDialogLocators } from '../locators/dialogs';
import { ntpServerLocators, type NtpServerRowKey } from '../locators/ntp-servers';

/**
 * Creating, updating and deleting a server are middleware calls that query the
 * server and restart the time daemon, not instant.
 */
const saveTimeoutMs = 60_000;

/** Opens the add form from the card, starting from the sidebar. */
export async function openAddNtpServerForm(page: Page): Promise<void> {
  await goToAdvancedSettings(page);

  await page.locator(ntpServerLocators.card.add).click();
  await expect(page.locator(ntpServerLocators.form.address)).toBeVisible();
}

/** Opens a row's kebab menu, starting from the sidebar. */
async function openRowMenu(page: Page, key: NtpServerRowKey): Promise<void> {
  await goToAdvancedSettings(page);
  await page.locator(ntpServerLocators.card.rowMenu(key)).click();
}

/**
 * Opens the edit form for a server from its row menu.
 *
 * Waits on the address having been patched in, which is what says the panel is
 * editing *this* server rather than showing an empty form.
 */
export async function openEditNtpServerForm(page: Page, key: NtpServerRowKey): Promise<void> {
  await openRowMenu(page, key);
  await page.locator(ntpServerLocators.card.rowMenuEdit(key)).click();
  await expect(page.locator(ntpServerLocators.form.address)).toHaveValue(key.address);
}

/**
 * Ticks Force, then saves the form and waits for the panel to close.
 *
 * Force on every save, because every address the specs use is unreachable by
 * design — see `fixtures/ntp-servers.ts`. The panel closing is the app's own
 * signal that the save succeeded — a refusal leaves it open with the error
 * attached.
 */
export async function forceSaveNtpServerForm(page: Page): Promise<void> {
  await page.locator(ntpServerLocators.form.force).click();
  await page.locator(ntpServerLocators.form.save).click();
  await expect(page.locator(ntpServerLocators.form.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Deletes a server from its row menu, through webui's shared confirm, and waits
 * for its row to go.
 *
 * `confirmDelete` does not pass `hideCheckbox`, so Delete stays **disabled**
 * until the box is ticked — asserted on the way, so a dialog that lost its gate
 * fails here rather than passing a test that never needed it. The card reloads
 * only once the delete has returned, so the row is what is waited on.
 */
export async function deleteNtpServer(page: Page, key: NtpServerRowKey): Promise<void> {
  await openRowMenu(page, key);
  await page.locator(ntpServerLocators.card.rowMenuDelete(key)).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();

  const confirm = page.locator(confirmDialogLocators.confirm);
  await expect(confirm).toBeDisabled();
  await page.locator(confirmDialogLocators.checkbox).click();
  await expect(confirm).toBeEnabled();

  await confirm.click();
  await expect(page.locator(ntpServerLocators.card.row(key))).toBeHidden({ timeout: saveTimeoutMs });
}
