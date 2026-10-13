/**
 * Init/Shutdown Scripts, driven through the UI from System > Advanced Settings.
 */
import { expect, type Page } from '@playwright/test';
import { closeFirstTimeWarning } from './advanced-settings';
import { goToAdvancedSettings } from './navigation';
import { confirmDialogLocators } from '../locators/dialogs';
import { initShutdownLocators, type InitShutdownWhen } from '../locators/init-shutdown';

/** Creating, updating and deleting a script are middleware calls, not instant. */
const saveTimeoutMs = 60_000;

/** Opens the add form from the card, starting from the sidebar. */
export async function openAddInitShutdownForm(page: Page): Promise<void> {
  await goToAdvancedSettings(page);

  await page.locator(initShutdownLocators.card.add).click();
  await closeFirstTimeWarning(page);
  await expect(page.locator(initShutdownLocators.form.command)).toBeVisible();
}

/** Opens a row's kebab menu, starting from the sidebar. */
async function openRowMenu(page: Page, command: string, when: InitShutdownWhen): Promise<void> {
  await goToAdvancedSettings(page);
  await page.locator(initShutdownLocators.card.rowMenu(command, when)).click();
}

/**
 * Opens the edit form for a script from its row menu.
 *
 * Waits on the command having been patched in, which is what says the panel is
 * editing *this* script rather than showing an empty form.
 */
export async function openEditInitShutdownForm(
  page: Page,
  command: string,
  when: InitShutdownWhen,
): Promise<void> {
  await openRowMenu(page, command, when);
  await page.locator(initShutdownLocators.card.rowMenuEdit(command, when)).click();
  await closeFirstTimeWarning(page);
  await expect(page.locator(initShutdownLocators.form.command)).toHaveValue(command);
}

/** Opens the delete confirmation for a script from its row menu. Delete raises no first-time warning. */
export async function openDeleteInitShutdownDialog(
  page: Page,
  command: string,
  when: InitShutdownWhen,
): Promise<void> {
  await openRowMenu(page, command, when);
  await page.locator(initShutdownLocators.card.rowMenuDelete(command, when)).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
}

/**
 * Ticks the confirmation, confirms the open delete dialog and waits for it to go.
 *
 * `confirmDelete` does not pass `hideCheckbox`, so Delete stays **disabled**
 * until the box is ticked — asserted on the way, so a dialog that lost its gate
 * fails here rather than passing a test that never needed it.
 */
export async function confirmInitShutdownDeletion(page: Page): Promise<void> {
  const confirm = page.locator(confirmDialogLocators.confirm);

  await expect(confirm).toBeDisabled();
  await page.locator(confirmDialogLocators.checkbox).click();
  await expect(confirm).toBeEnabled();

  await confirm.click();
  await expect(page.locator(confirmDialogLocators.title)).toBeHidden({ timeout: saveTimeoutMs });
}

/** Picks a When in the open form. */
export async function chooseInitShutdownWhen(page: Page, when: InitShutdownWhen): Promise<void> {
  await page.locator(initShutdownLocators.form.when).click();
  await page.locator(initShutdownLocators.form.whenOption(when)).click();
}

/**
 * Saves the form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded — a
 * refusal leaves it open with the error attached.
 */
export async function saveInitShutdownForm(page: Page): Promise<void> {
  await page.locator(initShutdownLocators.form.save).click();
  await expect(page.locator(initShutdownLocators.form.save)).toBeHidden({ timeout: saveTimeoutMs });
}
