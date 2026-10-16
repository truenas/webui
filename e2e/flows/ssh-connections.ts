/**
 * SSH connections, driven through the UI from Credentials > Backup Credentials.
 */
import { expect, type Page } from '@playwright/test';
import { goToBackupCredentials } from './navigation';
import { selectOption } from './storage';
import { confirmDialogLocators } from '../locators/dialogs';
import {
  generateNewKeyLabel, sshConnectionLocators, sshConnectionSetupMethodLabels,
} from '../locators/ssh-connections';

/**
 * Saving, scanning a host key and deleting are middleware calls. A
 * semi-automatic save also signs in to the other system, enables SSH there and
 * starts it, so it gets the most room.
 */
const saveTimeoutMs = 90_000;

/**
 * How many connections the card lists before View All — its pager's
 * `pageSize`. Sorted oldest first, so a connection a test has just made is the
 * first one hidden.
 */
export const sshConnectionCardPageSize = 5;

export interface ManualSshConnectionValues {
  name: string;
  host: string;
  /** The keypair to sign in with, by name. */
  keypair: string;
}

export interface SemiAutomaticSshConnectionValues {
  name: string;
  url: string;
  adminUsername: string;
  adminPassword: string;
}

/** Opens the add form from the card, starting from the sidebar. */
export async function openAddSshConnectionForm(page: Page): Promise<void> {
  await goToBackupCredentials(page);

  await page.locator(sshConnectionLocators.card.add).click();
  await expect(page.locator(sshConnectionLocators.form.name)).toBeVisible();
}

/**
 * Fills a Manual connection with an existing keypair. Port and username are
 * left at the form's defaults, 22 and root.
 */
export async function fillManualSshConnection(page: Page, values: ManualSshConnectionValues): Promise<void> {
  const { form } = sshConnectionLocators;

  await page.locator(form.name).fill(values.name);
  await selectOption(page, form.setupMethod, form.setupMethodOption(sshConnectionSetupMethodLabels.manual));
  await page.locator(form.host).fill(values.host);
  await selectOption(page, form.privateKey, form.privateKeyOption(values.keypair));
}

/**
 * Presses Discover Remote Host Key and returns the key it filled in.
 *
 * The field is asserted empty first, so a key read back afterwards can only
 * have come from this click.
 */
export async function discoverRemoteHostKey(page: Page): Promise<string> {
  const remoteHostKey = page.locator(sshConnectionLocators.form.remoteHostKey);
  await expect(remoteHostKey).toHaveValue('');

  await page.locator(sshConnectionLocators.form.discoverRemoteHostKey).click();

  await expect(remoteHostKey).not.toHaveValue('', { timeout: saveTimeoutMs });
  return remoteHostKey.inputValue();
}

/**
 * Fills a Semi-automatic connection that generates its own keypair. The
 * username it signs in as is left at the form's default, root.
 */
export async function fillSemiAutomaticSshConnection(
  page: Page,
  values: SemiAutomaticSshConnectionValues,
): Promise<void> {
  const { form } = sshConnectionLocators;

  await page.locator(form.name).fill(values.name);
  await selectOption(page, form.setupMethod, form.setupMethodOption(sshConnectionSetupMethodLabels.semiAutomatic));
  await page.locator(form.url).fill(values.url);
  await page.locator(form.adminUsername).fill(values.adminUsername);
  await page.locator(form.adminPassword).fill(values.adminPassword);
  await selectOption(page, form.privateKey, form.privateKeyOption(generateNewKeyLabel));
}

/**
 * Saves the form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded — a
 * refusal leaves it open with the error attached.
 */
export async function saveSshConnectionForm(page: Page): Promise<void> {
  await page.locator(sshConnectionLocators.form.save).click();
  await expect(page.locator(sshConnectionLocators.form.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Opens a connection's edit form from its row, starting from the sidebar, and
 * waits for the form to hold that connection.
 */
export async function openEditSshConnectionForm(page: Page, name: string): Promise<void> {
  await goToBackupCredentials(page);

  await page.locator(sshConnectionLocators.card.edit(name)).click();
  await expect(page.locator(sshConnectionLocators.form.name)).toHaveValue(name);
}

/**
 * Deletes a connection from its row, starting from the sidebar, ticking or
 * leaving "Delete associated SSH Keypair", and waits for its row to go.
 *
 * Only for a connection that signs in with a keypair, which is the only kind
 * the card offers that box for. The dialog is webui's shared confirm without
 * `hideCheckbox`, so Delete stays **disabled** until the confirm box is ticked
 * — asserted on the way, as in `deleteSshKeypair`.
 */
export async function deleteSshConnection(
  page: Page,
  name: string,
  { deleteKeypair }: { deleteKeypair: boolean },
): Promise<void> {
  await goToBackupCredentials(page);
  await page.locator(sshConnectionLocators.card.delete(name)).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible({ timeout: saveTimeoutMs });

  const secondary = page.locator(confirmDialogLocators.secondaryCheckbox);
  await expect(secondary).toBeVisible();
  if (deleteKeypair) {
    await secondary.click();
  }

  const confirm = page.locator(confirmDialogLocators.confirm);
  await expect(confirm).toBeDisabled();
  await page.locator(confirmDialogLocators.checkbox).click();
  await expect(confirm).toBeEnabled();

  await confirm.click();
  await expect(page.locator(sshConnectionLocators.card.row(name))).toBeHidden({ timeout: saveTimeoutMs });
}
