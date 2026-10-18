/**
 * A dataset's own quotas and reservations, driven through the Space Management card.
 */
import { expect, type Page } from '@playwright/test';
import { goToDatasets } from './navigation';
import { datasetCapacityLocators } from '../locators/dataset-capacity';
import { datasetDetailsLocators, datasetLocators } from '../locators/storage';

/**
 * Selects `dataset` in the tree and opens Edit on its Space Management card.
 *
 * The page lands with the pool root selected, and the root's card has an Edit too, so the details
 * card's Path has to name `dataset` before the click. Otherwise Edit would open the root's form.
 *
 * The form fills itself from the dataset the card already holds, with no request of its own, so
 * the quota field appearing is the signal that it is ready.
 */
export async function openCapacitySettings(page: Page, dataset: string): Promise<void> {
  await goToDatasets(page);

  const node = page.locator(datasetLocators.treeNode(dataset));
  await expect(node).toBeVisible();
  await node.click();
  await expect(page.locator(datasetDetailsLocators.path)).toHaveText(dataset);

  await page.locator(datasetCapacityLocators.card.edit).click();
  await expect(page.locator(datasetCapacityLocators.form.refquota)).toBeVisible();
}
