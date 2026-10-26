/**
 * Boot environments, driven through the UI from System > Boot.
 */
import { expect, type Page } from '@playwright/test';
import { goToBootEnvironments } from './navigation';
import { confirmDestructiveAction } from './storage';
import { selectRow } from './table';
import { bootEnvironmentLocators, bootEnvironmentRowTag } from '../locators/boot-environments';
import { confirmDialogLocators, errorDialogLocators } from '../locators/dialogs';

const {
  batch,
  header,
  list,
  cloneForm,
  deleteDialog,
  statsDialog,
  status,
  attachDialog,
} = bootEnvironmentLocators;

/** Cloning, setting keep and deleting all write to the boot pool before the page hears back. */
const saveTimeoutMs = 60_000;

/** `boot.attach` partitions the disk, resilvers onto it and installs a boot loader. A ceiling, not a wait. */
const bootAttachTimeoutMs = 10 * 60_000;

/**
 * Opens the clone form from a boot environment's row, starting from the sidebar.
 *
 * Waits on Source holding that name, which is what says the panel is cloning
 * *this* boot environment rather than another row's.
 */
export async function openCloneForm(page: Page, source: string): Promise<void> {
  await goToBootEnvironments(page);
  await page.locator(list.clone(source)).click();
  await expect(page.locator(cloneForm.source)).toHaveValue(source);
}

/**
 * Saves the clone form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded — a refusal
 * leaves it open with the error attached.
 */
export async function saveCloneForm(page: Page): Promise<void> {
  await page.locator(cloneForm.save).click();
  await expect(page.locator(cloneForm.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Ticks the shared confirm's box and presses its button, through
 * `confirmDestructiveAction`, checking first that the button waited for the box —
 * the confirm is raised without `hideCheckbox`. Waits for the confirm to close.
 */
async function confirmWithCheckbox(page: Page): Promise<void> {
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await expect(page.locator(confirmDialogLocators.confirm)).toBeDisabled();

  await confirmDestructiveAction(page);
  await expect(page.locator(confirmDialogLocators.title)).toBeHidden();
}

/**
 * Sets a boot environment's keep flag from its row, through webui's shared
 * confirm, and waits for the row to say so.
 *
 * The confirm is raised without `hideCheckbox`, so its button stays **disabled**
 * until the box is ticked — asserted on the way, as `flows/tunable.ts` does. The
 * list reloads only once the call returns, so the Keep cell is what is waited on.
 */
export async function keepBootEnvironment(page: Page, name: string): Promise<void> {
  await goToBootEnvironments(page);
  await page.locator(list.keepAction(name)).click();
  await confirmWithCheckbox(page);
  await expect(page.locator(list.keep(name))).toHaveText('Yes', { timeout: saveTimeoutMs });
}

/**
 * Starts a scrub of the boot pool from the page header, through the shared confirm.
 *
 * Returns once the confirm has closed. The scrub is a job that runs on after
 * that; what it did is the caller's to read.
 */
export async function scrubBootPool(page: Page): Promise<void> {
  await goToBootEnvironments(page);
  await page.locator(header.scrub).click();
  await confirmWithCheckbox(page);
}

/**
 * Activates a boot environment from its row, through the shared confirm, on the
 * Boot Environments page already on screen.
 *
 * Returns once the confirm has closed. The list reloads after the call returns,
 * so the caller asserts the Active cells with a retrying assertion.
 */
export async function activateBootEnvironment(page: Page, name: string): Promise<void> {
  await page.locator(list.activate(name)).click();
  await confirmWithCheckbox(page);
}

/** Opens Stats/Settings from the page header and waits for the interval to be filled in. */
export async function openBootPoolStats(page: Page): Promise<void> {
  await page.locator(header.stats).click();
  await expect(page.locator(statsDialog.title)).toBeVisible();
  // Filled from the store's advanced config once the dialog has it; empty before.
  await expect(page.locator(statsDialog.interval)).not.toHaveValue('');
}

/**
 * Opens Boot Pool Status from the Boot Environments header, and waits for the
 * named device to be drawn in the tree.
 */
export async function openBootPoolStatus(page: Page, device: string): Promise<void> {
  await page.locator(header.status).click();
  await expect(page.locator(status.deviceName(device))).toBeVisible({ timeout: saveTimeoutMs });
}

/** Where the Attach dialog is after Save: still open, closed, or open behind middleware's refusal. */
type AttachOutcome = 'open' | 'closed' | 'refused';

async function readAttachOutcome(page: Page): Promise<AttachOutcome> {
  if (await page.locator(errorDialogLocators.title).isVisible()) {
    return 'refused';
  }

  const open = await page.locator(attachDialog.title).isVisible();
  return open ? 'open' : 'closed';
}

/**
 * Attaches an unused disk to a single-disk boot pool, from the boot device's menu
 * on Boot Pool Status, and waits for the Attach dialog to close. Throws with
 * middleware's message if the attach is refused.
 *
 * "Use all disk space" is left unticked, as the dialog opens it; that is checked.
 * The autocomplete narrows to the device name typed, and clicking its row is what
 * commits the value.
 */
export async function attachBootDisk(page: Page, bootDevice: string, disk: string): Promise<void> {
  await page.locator(status.actions(bootDevice)).click();
  await page.locator(status.attach).click();
  await expect(page.locator(attachDialog.title)).toBeVisible();

  await page.locator(attachDialog.disk).fill(disk);
  await page.locator(attachDialog.diskOption(disk)).click();
  await expect(page.locator(attachDialog.expand)).not.toBeChecked();
  await page.locator(attachDialog.save).click();

  // Closed only once the job's progress dialog has closed on success. On a failure
  // it stays open, behind the error the job raised, so that error is watched for
  // too. Waiting on the dialog alone sat out the session timeout instead, which
  // signs the page out and hides the dialog as though the attach had worked.
  await expect.poll(() => readAttachOutcome(page), { timeout: bootAttachTimeoutMs }).not.toBe('open');
  if (await readAttachOutcome(page) === 'refused') {
    const message = await page.locator(errorDialogLocators.message).innerText();
    throw new Error(`boot.attach was refused: ${message}`);
  }
}

/**
 * Presses the delete dialog's Delete, checking first that it waited for Confirm
 * to be ticked. Returns once it is pressed; the `core.bulk` job runs on after.
 */
export async function confirmBootEnvironmentDelete(page: Page): Promise<void> {
  const confirm = page.locator(deleteDialog.delete);
  await expect(confirm).toBeDisabled();
  await page.locator(deleteDialog.confirm).click();
  await expect(confirm).toBeEnabled();

  await confirm.click();
}

/**
 * Deletes a boot environment from its row and waits for the row to go.
 *
 * The page's own dialog rather than the shared confirm: it lists what it is
 * about to delete, which is checked to be this one boot environment, and its
 * Delete stays disabled until Confirm is ticked. The delete runs as a
 * `core.bulk` job; with one item the dialog closes on success and the list reloads.
 */
export async function deleteBootEnvironment(page: Page, name: string): Promise<void> {
  await goToBootEnvironments(page);
  await page.locator(list.delete(name)).click();
  await expect(page.locator(deleteDialog.title)).toBeVisible();
  await expect(page.locator(deleteDialog.item(name))).toBeVisible();

  await confirmBootEnvironmentDelete(page);
  await expect(page.locator(list.row(name))).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Opens System > Boot from the sidebar and ticks each named row's selection box,
 * through the table's own `selectRow`.
 */
export async function selectBootEnvironments(page: Page, names: string[]): Promise<void> {
  await goToBootEnvironments(page);
  for (const name of names) {
    await selectRow(page, bootEnvironmentRowTag(name));
  }
}

/**
 * Presses the batch toolbar's Delete and waits for the delete dialog.
 *
 * The toolbar's Delete is reached before the dialog opens, since the dialog's own
 * Delete emits the same bare id.
 */
export async function openBatchDeleteDialog(page: Page): Promise<void> {
  await page.locator(batch.delete).click();
  await expect(page.locator(deleteDialog.title)).toBeVisible();
}

/**
 * Waits for the delete dialog's report: the job has answered for every item and
 * the dialog stayed open, which it does unless exactly one item was sent and it
 * succeeded. Close replacing Cancel and Delete is what says the job is over.
 */
export async function waitForBootEnvironmentDeleteReport(page: Page): Promise<void> {
  await expect(page.locator(deleteDialog.close)).toBeVisible({ timeout: saveTimeoutMs });
}

/**
 * Waits for the delete dialog to close on its own, which it does once a job of
 * exactly one item has succeeded. The list reloads behind it.
 */
export async function waitForBootEnvironmentDeleteDialogToClose(page: Page): Promise<void> {
  await expect(page.locator(deleteDialog.title)).toBeHidden({ timeout: saveTimeoutMs });
}
