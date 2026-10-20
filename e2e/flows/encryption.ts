/**
 * Dataset encryption, driven through the UI: the form's Encryption Options, and editing, locking,
 * unlocking and exporting the key from the Encryption card.
 */
import { expect, type Download, type Page } from '@playwright/test';
import { goToDatasets } from './navigation';
import { keyDownloadTimeoutMs, selectOption } from './storage';
import {
  encryptionCardLocators, encryptionFormLocators, encryptionOptionsLocators, exportKeyDialogLocators,
  jobDialogLocators, lockDialogLocators, unlockLocators, unlockSummaryLocators,
} from '../locators/encryption';
import { datasetDetailsLocators, datasetLocators } from '../locators/storage';

/**
 * Locking, unlocking and changing a key are jobs behind a progress dialog. The first two also
 * remount or unmount.
 */
const jobTimeoutMs = 90_000;

/**
 * Selects `dataset` in the tree, and waits for the details panel to belong to it.
 *
 * The page lands with the pool root selected, and every card acts on the selected dataset, so the
 * panel's Path has to name `dataset` before anything on it is read or pressed.
 */
export async function selectDataset(page: Page, dataset: string): Promise<void> {
  await goToDatasets(page);

  const node = page.locator(datasetLocators.treeNode(dataset));
  await expect(node).toBeVisible();
  await node.click();
  await expect(page.locator(datasetDetailsLocators.path)).toHaveText(dataset);
}

/**
 * On the open Add Dataset form, in advanced mode: stop inheriting encryption and encrypt with
 * `passphrase` instead.
 *
 * Clearing Inherit reveals Encryption, already ticked, and the type select, which opens on Key.
 * The passphrase fields exist only once the type is Passphrase.
 */
export async function encryptWithPassphrase(page: Page, passphrase: string): Promise<void> {
  await page.locator(encryptionFormLocators.inherit).setChecked(false);
  await expect(page.locator(encryptionFormLocators.encryption)).toBeChecked();

  await selectOption(page, encryptionFormLocators.type, encryptionFormLocators.typeOption('Passphrase'));
  await page.locator(encryptionFormLocators.passphrase).fill(passphrase);
  await page.locator(encryptionFormLocators.confirmPassphrase).fill(passphrase);
}

/** Opens Edit Encryption Options from the selected dataset's Encryption card. */
export async function openEncryptionOptions(page: Page): Promise<void> {
  await page.locator(encryptionCardLocators.edit).click();
  await expect(page.locator(encryptionOptionsLocators.title)).toBeVisible();
}

/**
 * Ticks Confirm on the open Edit Encryption Options dialog, saves, and waits for the dialog to close.
 *
 * A key change runs as a job behind a progress dialog of its own, and this dialog closes only once
 * that has finished. Inheriting is a plain call. Either way the card reloads after the close.
 */
export async function saveEncryptionOptions(page: Page): Promise<void> {
  await page.locator(encryptionOptionsLocators.confirm).setChecked(true);

  const save = page.locator(encryptionOptionsLocators.save);
  await expect(save).toBeEnabled();
  await save.click();
  await expect(page.locator(encryptionOptionsLocators.title)).toBeHidden({ timeout: jobTimeoutMs });
}

/**
 * Opens Export Key from the selected dataset's Encryption card, and returns the key the dialog shows.
 *
 * The dialog opens on a `pool.dataset.export_key` job and fills the key in only once that has
 * finished, so the paragraph is waited on until it holds something. The key is returned rather than
 * asserted, so that a failure never prints it into the report.
 */
export async function openExportKeyDialog(page: Page): Promise<string> {
  await page.locator(encryptionCardLocators.exportKey).click();
  await expect(page.locator(exportKeyDialogLocators.title)).toBeVisible();

  const key = page.locator(exportKeyDialogLocators.key);
  await expect(key).not.toBeEmpty({ timeout: jobTimeoutMs });
  return (await key.textContent())?.trim() ?? '';
}

/**
 * Presses Download Key on the open Export Key dialog, and returns the download once it has started.
 *
 * The file comes from a `core.download` job, the same as the pool wizard's key in `downloadPoolKey`,
 * so it gets the same ceiling. A sibling of that flow rather than a call to it, because that one
 * presses the wizard dialog's button.
 */
export async function downloadDatasetKey(page: Page): Promise<Download> {
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: keyDownloadTimeoutMs }),
    page.locator(exportKeyDialogLocators.download).click(),
  ]);

  return download;
}

/**
 * Locks the selected dataset from its Encryption card, and waits for the card to say so.
 *
 * The dialog closes once the lock job has finished, and the card reloads after it. `Locked` is the
 * card's own readback, and it cannot be on screen before the lock because the card said `Unlocked`.
 */
export async function lockFromCard(page: Page): Promise<void> {
  await page.locator(encryptionCardLocators.lock).click();
  await expect(page.locator(lockDialogLocators.title)).toBeVisible();

  await page.locator(lockDialogLocators.submit).click();
  await expect(page.locator(lockDialogLocators.title)).toBeHidden({ timeout: jobTimeoutMs });
  await expect(page.locator(encryptionCardLocators.state)).toHaveText('Locked');
}

/**
 * Unlocks the selected dataset from its Encryption card with `passphrase`, and returns once the app
 * is back on the Datasets page.
 *
 * Unlock is a link to a page of its own. That page fetches an encryption summary first and lists the
 * dataset only once it has one, so the passphrase field appearing is the signal it is ready. Unlock
 * on that page checks the passphrase, and a summary dialog names what it would unlock. Continue
 * there does the unlock, and a second summary names what was unlocked. Close on that one goes back.
 */
export async function unlockFromCard(page: Page, dataset: string, passphrase: string): Promise<void> {
  await page.locator(encryptionCardLocators.unlock).click();

  const field = page.locator(unlockLocators.passphrase);
  await expect(field).toBeVisible({ timeout: jobTimeoutMs });
  await field.fill(passphrase);

  const submit = page.locator(unlockLocators.submit);
  await expect(submit).toBeEnabled();
  await submit.click();

  // The first summary: what the passphrase would unlock.
  await expect(page.locator(unlockSummaryLocators.unlocked(dataset))).toBeVisible({ timeout: jobTimeoutMs });
  const proceed = page.locator(unlockSummaryLocators.continue);
  await proceed.click();
  await expect(proceed).toBeHidden();

  // The second: what was unlocked. Only this one lacks Continue, which is how the two differ.
  await expect(page.locator(unlockSummaryLocators.unlocked(dataset))).toBeVisible({ timeout: jobTimeoutMs });
  await expect(page.locator(jobDialogLocators.title)).toBeHidden();
  await page.locator(unlockSummaryLocators.close).click();
  await expect(page.locator(unlockSummaryLocators.title)).toBeHidden();
}
