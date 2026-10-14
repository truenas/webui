/**
 * Sysctl tunables, driven through the UI from System > Advanced Settings.
 */
import { expect, type Page } from '@playwright/test';
import { closeFirstTimeWarning } from './advanced-settings';
import { goToAdvancedSettings } from './navigation';
import { selectOption } from './storage';
import { confirmDialogLocators } from '../locators/dialogs';
import { tunableLocators } from '../locators/tunable';

/**
 * Creating, updating and deleting a tunable are middleware jobs that set a
 * kernel variable, not instant.
 */
const saveTimeoutMs = 60_000;

/** Opens the add form from the card, starting from the sidebar. */
export async function openAddTunableForm(page: Page): Promise<void> {
  await goToAdvancedSettings(page);

  await page.locator(tunableLocators.card.add).click();
  await closeFirstTimeWarning(page);
  await expect(page.locator(tunableLocators.form.variable)).toBeVisible();
}

/** Picks Sysctl as the type in the open add form. The select starts empty. */
export async function chooseSysctlType(page: Page): Promise<void> {
  await selectOption(page, tunableLocators.form.type, tunableLocators.form.typeSysctl);
}

/** Opens a row's kebab menu, starting from the sidebar. */
async function openRowMenu(page: Page, variable: string): Promise<void> {
  await goToAdvancedSettings(page);
  await page.locator(tunableLocators.card.rowMenu(variable)).click();
}

/**
 * Opens the edit form for a tunable from its row menu.
 *
 * Waits on the value having been patched in, which is what says the panel is
 * editing *this* tunable rather than showing an empty form.
 */
export async function openEditTunableForm(page: Page, variable: string, value: string): Promise<void> {
  await openRowMenu(page, variable);
  await page.locator(tunableLocators.card.rowMenuEdit(variable)).click();
  await closeFirstTimeWarning(page);
  await expect(page.locator(tunableLocators.form.value)).toHaveValue(value);
}

/**
 * Saves the form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded — a
 * refusal leaves it open with the error attached.
 */
export async function saveTunableForm(page: Page): Promise<void> {
  await page.locator(tunableLocators.form.save).click();
  await expect(page.locator(tunableLocators.form.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Deletes a tunable from its row menu, through webui's shared confirm, and
 * waits for its row to go. Delete raises no first-time warning.
 *
 * `confirmDelete` does not pass `hideCheckbox`, so Delete stays **disabled**
 * until the box is ticked — asserted on the way, so a dialog that lost its gate
 * fails here rather than passing a test that never needed it. The delete is a
 * job that runs behind its own progress dialog after the confirm closes, and the
 * card reloads only once that finishes, so the row is what is waited on.
 */
export async function deleteTunable(page: Page, variable: string): Promise<void> {
  await openRowMenu(page, variable);
  await page.locator(tunableLocators.card.rowMenuDelete(variable)).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();

  const confirm = page.locator(confirmDialogLocators.confirm);
  await expect(confirm).toBeDisabled();
  await page.locator(confirmDialogLocators.checkbox).click();
  await expect(confirm).toBeEnabled();

  await confirm.click();
  await expect(page.locator(tunableLocators.card.row(variable))).toBeHidden({ timeout: saveTimeoutMs });
}
