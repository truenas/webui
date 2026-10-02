/**
 * ZFS tiering, driven through the UI: the Tiering side panel on the storage
 * dashboard, and a dataset's Change Storage Tier and Data Migration dialogs.
 */
import { expect, type Page } from '@playwright/test';
import { goToDatasets, goToStorage } from './navigation';
import { datasetLocators } from '../locators/storage';
import {
  changeTierDialogLocators, datasetTierLocators, migrationStatusDialogLocators, tierConfigLocators,
} from '../locators/tiering';

const saveTimeoutMs = 90_000;

/**
 * Opens the Tiering side panel from the storage dashboard, and waits until it
 * is safe to edit.
 *
 * Safe means Save is enabled, not that a field is visible. The panel is an
 * `ix-form` host: it renders on the component's own defaults and overwrites every
 * control when `zfs.tier.config` answers, so a value typed before then is silently
 * replaced — and saved. `canSubmit` is false while the form is loading, which
 * makes the button the one signal that covers exactly that window. The S3 service
 * form lost the same race on a slow appliance.
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
 * Selects a dataset in the tree, so its details card — and the tier row on it —
 * is the one on screen.
 *
 * Opens its pool first. The page selects the first pool on arrival and expands
 * only the selected branch, so with the shared pool present as well — any full
 * run — the tier pool sits collapsed and its datasets are not rendered at all.
 * Selecting a node expands it (`selectedBranch$` in `dataset-management`), so
 * clicking the pool is how a user opens it too. Searching does not help: the
 * filter keeps the pool row but leaves it collapsed.
 *
 * `name` is the full dataset id; see `openDeleteDatasetDialog`.
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
 * Opens Change Storage Tier from the dataset details card and waits for its
 * details to load.
 *
 * The signal is a tier's "available" line, not Apply. Apply is bound to
 * `isSubmitting() || loadFailed()`, both false from the first render, so it is
 * enabled before any of the dialog's calls have answered and says nothing about
 * them. The space lines come from `zpool.query` and render only once it and
 * `pool.dataset.query` are back — the regular tier's always, so whichever side
 * that is on appears.
 *
 * The four share queries have no such signal: with no share on the dataset they
 * render nothing. What they can do is fail, which sets `loadFailed` and disables
 * Apply for good — so Apply is asserted after the wait, where a failure that has
 * already landed is caught here rather than as a click on a disabled button.
 */
export async function openChangeTierDialog(page: Page): Promise<void> {
  await page.locator(datasetTierLocators.change).click();

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

/** Opens the Data Migration dialog from the migration badge on the details card. */
export async function openMigrationStatus(page: Page): Promise<void> {
  await page.locator(datasetTierLocators.migrationStatus).click();
  await expect(page.locator(migrationStatusDialogLocators.title)).toBeVisible();
}
