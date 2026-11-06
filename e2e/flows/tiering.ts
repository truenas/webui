/**
 * ZFS tiering, driven through the UI: the Tiering side panel on the storage
 * dashboard, and a dataset's Change Storage Tier and Data Migration dialogs —
 * Change Storage Tier from the dataset details card or from a share's row.
 */
import { expect, type Page } from '@playwright/test';
import { goToDatasets, goToStorage } from './navigation';
import { confirmDialogLocators } from '../locators/dialogs';
import { datasetLocators } from '../locators/storage';
import {
  changeTierDialogLocators, datasetTierLocators, migrationStatusDialogLocators, tierConfigLocators,
} from '../locators/tiering';

const saveTimeoutMs = 90_000;

/**
 * Opens the Tiering side panel from the storage dashboard, and waits until it is safe to edit.
 *
 * Safe means Save is enabled, not that a field is visible: the `ix-form` renders defaults and overwrites
 * every control when `zfs.tier.config` answers, so an earlier value is silently replaced and saved.
 * `canSubmit` is false exactly while loading. The S3 service form lost the same race on a slow appliance.
 */
export async function openTierConfig(page: Page): Promise<void> {
  await goToStorage(page);
  await page.locator(tierConfigLocators.open).click();

  await expect(page.locator(tierConfigLocators.save)).toBeEnabled();
}

/** Saves the Tiering panel. The panel closing is the app's signal that it took. */
export async function saveTierConfig(page: Page): Promise<void> {
  await page.locator(tierConfigLocators.save).click();
  await expect(page.locator(tierConfigLocators.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Selects a dataset in the tree, so its details card and tier row are on screen.
 *
 * Opens its pool first: the page expands only the first pool, so in a full run (shared pool present) the
 * tier pool is collapsed and its datasets are not rendered. Selecting a node expands it, as a user would;
 * searching keeps the pool row but leaves it collapsed. `name` is the full dataset id; see
 * `openDeleteDatasetDialog`.
 */
export async function selectDataset(page: Page, name: string): Promise<void> {
  await goToDatasets(page);

  if (!name.includes('/')) {
    throw new Error(`"${name}" is not a dataset under a pool: expected "<pool>/<dataset>".`);
  }
  const pool = name.slice(0, name.indexOf('/'));
  await page.locator(datasetLocators.treeNode(pool)).click();

  const node = page.locator(datasetLocators.treeNode(name));
  await expect(node).toBeVisible();
  await node.click();

  await expect(page.locator(datasetTierLocators.change)).toBeVisible();
}

/**
 * Opens Change Storage Tier from the dataset details card and waits for its details to load.
 *
 * The signal is a tier's "available" line, not Apply, which is enabled from the first render. The space lines
 * render once `zpool.query` and `pool.dataset.query` are back. The four share queries have no signal, but a
 * failure sets `loadFailed` and disables Apply for good, so Apply is asserted after the wait to catch it here
 * rather than as a click on a disabled button.
 */
export async function openChangeTierDialog(page: Page): Promise<void> {
  await page.locator(datasetTierLocators.change).click();
  await waitForChangeTierDialog(page);
}

/**
 * Opens Change Storage Tier from a share's row on the Shares dashboard: the row
 * menu, then the action in it. The same dialog as {@link openChangeTierDialog},
 * waited on the same way.
 */
export async function openChangeTierDialogFromShareRow(
  page: Page,
  { rowMenu, changeTier }: { rowMenu: string; changeTier: string },
): Promise<void> {
  await page.locator(rowMenu).click();
  await page.locator(changeTier).click();
  await waitForChangeTierDialog(page);
}

/** See {@link openChangeTierDialog} for why this is the signal. */
async function waitForChangeTierDialog(page: Page): Promise<void> {
  await expect(page.locator(changeTierDialogLocators.title)).toBeVisible();
  await expect(
    page.locator(changeTierDialogLocators.currentTierSpace)
      .or(page.locator(changeTierDialogLocators.newTierSpace))
      .first(),
  ).toBeVisible();
  await expect(page.locator(changeTierDialogLocators.apply)).toBeEnabled();
}

/**
 * Applies the open Change Storage Tier dialog. It closes once
 * `zfs.tier.dataset_set_tier` has answered, and stays open if it failed.
 */
export async function applyTierChange(page: Page): Promise<void> {
  await page.locator(changeTierDialogLocators.apply).click();
  await expect(page.locator(changeTierDialogLocators.title)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Opens the Data Migration dialog from the migration badge on the details card.
 *
 * With the keyboard, as the badge also allows (Enter), rather than a click. While a migration runs
 * the badge is an icon that spins, so it is never "stable" and a click waits on that until it times
 * out; pressing a key needs only focus. One way for every state keeps the callers from having to
 * know which one the badge is in.
 */
export async function openMigrationStatus(page: Page): Promise<void> {
  await page.locator(datasetTierLocators.migrationStatus).press('Enter');
  await expect(page.locator(migrationStatusDialogLocators.title)).toBeVisible();
}

/**
 * Cancels the migration in the open Data Migration dialog: Cancel, then Stop migration in the
 * confirmation over it.
 *
 * The dialog closes itself once `zfs.tier.rewrite_job_cancel` has answered, and stays open with an
 * error over it if the call failed, so its closing is the signal the cancel was accepted.
 */
export async function cancelMigration(page: Page): Promise<void> {
  await page.locator(migrationStatusDialogLocators.cancel).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();

  const confirm = page.locator(confirmDialogLocators.confirm);
  await page.locator(confirmDialogLocators.checkbox).click();
  await expect(confirm).toBeEnabled();

  await confirm.click();
  await expect(page.locator(migrationStatusDialogLocators.title)).toBeHidden({ timeout: saveTimeoutMs });
}
