/**
 * Selecting and opening datasets in the Datasets tree.
 *
 * A click on a row that is not selected selects it and opens nothing. A click on the row that is
 * already selected opens or closes it instead. Selecting a dataset opens its ancestors, so its own
 * row is in view, and entering the page with nothing selected opens the first pool.
 *
 * So a bare click is right only for a row known not to be selected. These helpers are for a row
 * that may be: the page selects the first pool as it loads, and a flow that clicked that pool to
 * select it would close it.
 */
import { expect, type Page } from '@playwright/test';
import { datasetDetailsLocators, datasetLocators } from '../locators/storage';

/**
 * Selects `name`, whose row must already be in view, without opening or closing it.
 *
 * Waits for the details card first: the page selects a dataset as it loads, and the card's Path
 * says which. Clicking before then could land on the row just as the page selected it.
 */
export async function selectDatasetNode(page: Page, name: string): Promise<void> {
  const path = page.locator(datasetDetailsLocators.path);
  await expect(path).toBeVisible();

  const node = page.locator(datasetLocators.treeNode(name));
  await expect(node).toBeVisible();
  if ((await path.textContent())?.trim() !== name) {
    await node.click();
  }
  await expect(path).toHaveText(name);
}

/**
 * Selects `name` and opens it, so its children are in view. A dataset with no children is only
 * selected: there is nothing to open.
 *
 * The tree node carries `aria-expanded` only when it has children. Once the row is selected, a
 * click on it toggles it.
 */
export async function expandDatasetNode(page: Page, name: string): Promise<void> {
  await selectDatasetNode(page, name);

  const node = page.locator(datasetLocators.treeNode(name));
  const expanded = await node.getAttribute('aria-expanded');
  if (expanded === null) {
    return;
  }
  if (expanded !== 'true') {
    await node.click();
  }
  await expect(node).toHaveAttribute('aria-expanded', 'true');
}
