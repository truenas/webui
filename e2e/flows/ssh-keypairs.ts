/**
 * SSH keypairs, driven through the UI from Credentials > Backup Credentials.
 */
import { expect, type Page } from '@playwright/test';
import { goToBackupCredentials } from './navigation';
import { confirmDialogLocators } from '../locators/dialogs';
import { sshKeypairLocators } from '../locators/ssh-keypairs';

/** Generating, saving and deleting a keypair are middleware calls, not instant. */
const saveTimeoutMs = 60_000;

/**
 * How many keypairs the card lists before View All — its pager's `pageSize`.
 * Sorted oldest first, so a keypair a test has just made is the first one hidden.
 */
export const sshKeypairCardPageSize = 5;

/**
 * Presses View All on a freshly loaded card when the appliance holds more
 * keypairs than it lists, so every row is in the DOM.
 *
 * The caller passes the count, read over the API, because whether View All
 * renders at all depends on it, and probing the page for the button would race
 * the card's load. Fresh, because once the card has reloaded after a save, View
 * All sizes the list by whatever count it held at the click — see the generate
 * test for why that one does not expand.
 */
async function showAllSshKeypairs(page: Page, total: number): Promise<void> {
  if (total <= sshKeypairCardPageSize) {
    return;
  }

  await page.locator(sshKeypairLocators.card.viewAll).click();
  await expect(page.locator(sshKeypairLocators.card.collapse)).toBeVisible();
}

/** Opens the add form from the card, starting from the sidebar. */
export async function openAddSshKeypairForm(page: Page): Promise<void> {
  await goToBackupCredentials(page);

  await page.locator(sshKeypairLocators.card.add).click();
  await expect(page.locator(sshKeypairLocators.form.name)).toBeVisible();
}

/**
 * Presses Generate Keypair in the open form and returns the pair it filled in.
 *
 * Both key fields are asserted empty first, so keys read back afterwards can only
 * have come from this click.
 */
export async function generateKeypair(page: Page): Promise<{ privateKey: string; publicKey: string }> {
  const privateKey = page.locator(sshKeypairLocators.form.privateKey);
  const publicKey = page.locator(sshKeypairLocators.form.publicKey);

  await expect(privateKey).toHaveValue('');
  await expect(publicKey).toHaveValue('');

  await page.locator(sshKeypairLocators.form.generate).click();

  await expect(privateKey).not.toHaveValue('', { timeout: saveTimeoutMs });
  await expect(publicKey).not.toHaveValue('', { timeout: saveTimeoutMs });

  return { privateKey: await privateKey.inputValue(), publicKey: await publicKey.inputValue() };
}

/**
 * Saves the form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded — a
 * refusal leaves it open with the error attached.
 */
export async function saveSshKeypairForm(page: Page): Promise<void> {
  await page.locator(sshKeypairLocators.form.save).click();
  await expect(page.locator(sshKeypairLocators.form.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Deletes a keypair from its row menu, starting from the sidebar, and waits for
 * its row to go. `total` is how many keypairs the appliance holds, the target
 * included — see {@link showAllSshKeypairs}.
 *
 * The card asks `keychaincredential.used_by` first and then raises webui's shared
 * confirm without `hideCheckbox`, so Delete stays **disabled** until the box is
 * ticked — asserted on the way, so a dialog that lost its gate fails here rather
 * than passing a test that never needed it.
 */
export async function deleteSshKeypair(page: Page, name: string, total: number): Promise<void> {
  await goToBackupCredentials(page);
  await showAllSshKeypairs(page, total);
  await page.locator(sshKeypairLocators.card.rowMenu(name)).click();
  await page.locator(sshKeypairLocators.card.rowMenuDelete(name)).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible({ timeout: saveTimeoutMs });

  const confirm = page.locator(confirmDialogLocators.confirm);
  await expect(confirm).toBeDisabled();
  await page.locator(confirmDialogLocators.checkbox).click();
  await expect(confirm).toBeEnabled();

  await confirm.click();
  await expect(page.locator(sshKeypairLocators.card.row(name))).toBeHidden({ timeout: saveTimeoutMs });
}
