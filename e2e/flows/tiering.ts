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
 * Searches for it first. The tree expands only the selected pool, so with the
 * shared pool present as well — any full run — the tier pool sits collapsed and
 * its datasets are not rendered at all. Filtering by name is how a user finds one
 * dataset among several pools, and it does not depend on which pool is open.
 *
 * `name` is the full dataset id; see `openDeleteDatasetDialog`.
 */
export async function selectDataset(page: Page, name: string): Promise<void> {
  await goToDatasets(page);

  await page.locator(datasetLocators.search).fill(name.split('/').pop() ?? name);

  const node = page.locator(datasetLocators.treeNode(name));
  await expect(node).toBeVisible();
  await node.click();

  await expect(page.locator(datasetTierLocators.change)).toBeVisible();
}

/**
 * Opens Change Storage Tier from the dataset details card and waits for it to
 * finish loading.
 *
 * The dialog asks five things before it lets you apply — the pool's tier space,
 * the dataset, and three share services — and Apply stays disabled while any of
 * them is outstanding, or for good if one failed. So an enabled Apply is both the
 * ready signal and the check that the dialog loaded cleanly.
 */
export async function openChangeTierDialog(page: Page): Promise<void> {
  await page.locator(datasetTierLocators.change).click();

  await expect(page.locator(changeTierDialogLocators.title)).toBeVisible();
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
