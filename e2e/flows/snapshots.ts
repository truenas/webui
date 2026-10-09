/**
 * Snapshots, driven through the UI.
 *
 * Both journeys start where a user starts them: on a dataset, in the Datasets
 * tree, at its Data Protection card.
 */
import { expect, type Page } from '@playwright/test';
import { goToDatasets } from './navigation';
import { snapshotLocators } from '../locators/snapshots';
import { datasetLocators } from '../locators/storage';

/** How long the datasets tree, or the snapshot list, may take to render. */
const pageSettleTimeoutMs = 60_000;

/** A snapshot, rollback or clone is one middleware call, but not a quick one. */
const actionTimeoutMs = 60_000;

/** Selects a dataset in the tree, and waits for its Data Protection card. */
async function openDataset(page: Page, dataset: string): Promise<void> {
  await goToDatasets(page);

  const node = page.locator(datasetLocators.treeNode(dataset));
  await expect(node).toBeVisible({ timeout: pageSettleTimeoutMs });
  await node.click();

  await expect(page.locator(snapshotLocators.card.takeSnapshot)).toBeVisible({ timeout: pageSettleTimeoutMs });
}

/**
 * Opens the take-snapshot form from a dataset's card.
 *
 * Waits for the dataset picker to show that dataset, not merely to exist: the
 * card passes its dataset to the form, which sets it once the options have
 * loaded, and a name typed before then is typed into a form still settling.
 */
export async function openTakeSnapshotForm(page: Page, dataset: string): Promise<void> {
  await openDataset(page, dataset);

  await page.locator(snapshotLocators.card.takeSnapshot).click();
  await expect(page.locator(snapshotLocators.form.dataset)).toContainText(dataset, { timeout: pageSettleTimeoutMs });
}

/** Saves the take-snapshot form and waits for the panel to go. */
export async function saveSnapshotForm(page: Page): Promise<void> {
  await page.locator(snapshotLocators.form.save).click();
  await expect(page.locator(snapshotLocators.form.save)).toBeHidden({ timeout: actionTimeoutMs });
}

/** Opens the snapshot list for a dataset, by its card's "View Snapshots" link. */
export async function openSnapshotList(page: Page, dataset: string): Promise<void> {
  await openDataset(page, dataset);

  await page.locator(snapshotLocators.card.viewSnapshots).click();
  await expect(page.locator(snapshotLocators.list.add)).toBeVisible({ timeout: pageSettleTimeoutMs });
}

/**
 * Expands a snapshot's row, which is where its actions are.
 *
 * Waits for the creation date rather than for a button. The row looks its
 * snapshot up when it opens, and Hold and the three buttons render before that
 * answer arrives: a click that lands in between acts on a row that does not yet
 * know whether the snapshot is held or has a clone.
 */
export async function expandSnapshot(page: Page, dataset: string, name: string): Promise<void> {
  const cell = page.locator(snapshotLocators.list.nameCell(dataset, name));

  await expect(cell).toBeVisible({ timeout: pageSettleTimeoutMs });
  await cell.click();
  await expect(page.locator(snapshotLocators.details.created(name))).toBeVisible({ timeout: pageSettleTimeoutMs });
}

/** Opens the rollback dialog for a snapshot, from its row in a dataset's list. */
export async function openRollbackDialog(page: Page, dataset: string, name: string): Promise<void> {
  await openSnapshotList(page, dataset);
  await expandSnapshot(page, dataset, name);

  await page.locator(snapshotLocators.details.rollback(name)).click();
  // The dialog looks the snapshot up before it shows its form, so the title
  // arrives before anything in it can be acted on.
  await expect(page.locator(snapshotLocators.rollbackDialog.confirm)).toBeVisible({ timeout: pageSettleTimeoutMs });
}

/**
 * Ticks Confirm and submits the open rollback dialog.
 *
 * Asserts the gate on the way through, as `confirmShareDeletion` does: Rollback
 * is disabled until the box is ticked, and a dialog that stopped requiring it
 * would otherwise let this flow through unnoticed. Stops at the click — what
 * the dialog does next is the caller's claim.
 */
export async function confirmAndSubmitRollback(page: Page): Promise<void> {
  const submit = page.locator(snapshotLocators.rollbackDialog.submit);

  await expect(submit).toBeDisabled();
  await page.locator(snapshotLocators.rollbackDialog.confirm).click();
  await expect(submit).toBeEnabled();

  await submit.click();
}

/** Waits for the rollback dialog to report success, then closes it. */
export async function closeRollbackDialogAfterSuccess(page: Page): Promise<void> {
  await expect(page.locator(snapshotLocators.rollbackDialog.goToStorage)).toBeVisible({ timeout: actionTimeoutMs });

  await page.locator(snapshotLocators.rollbackDialog.close).click();
  await expect(page.locator(snapshotLocators.rollbackDialog.title)).toBeHidden();
}
