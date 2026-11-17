/**
 * Stories: in the Datasets tree, clicking the selected dataset's row opens and closes it, and a
 * dataset the user closed stays closed when the page reloads its datasets.
 *
 * The chevron that also toggles a row is drawn by the library's tree node with no `data-test`, so
 * both stories open and close rows by clicking the selected one. What reopened a closed row was
 * the page's own reload, however the row was closed.
 */
import { ensureDatasetAbsent, ensureDatasetPresent, findDataset } from '../fixtures/storage';
import { expandDatasetNode, selectDatasetNode } from '../flows/dataset-tree';
import { goToDatasets } from '../flows/navigation';
import { saveDatasetForm } from '../flows/storage';
import { datasetDetailsLocators, datasetLocators } from '../locators/storage';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const parentLeaf = 'e2e_tree_parent';
const childLeaf = 'e2e_tree_child';
const comment = 'edited while closed';

test.beforeEach(async ({ api, pool }) => {
  const parent = `${pool}/${parentLeaf}`;
  await ensureDatasetAbsent(api, parent);
  await ensureDatasetPresent(api, parent);
  await ensureDatasetPresent(api, `${parent}/${childLeaf}`);
});

test.afterEach(async ({ api, pool }) => {
  const parent = `${pool}/${parentLeaf}`;
  if (leavingTestData(`the dataset "${parent}" and its child`)) {
    return;
  }

  await runCleanupSteps([
    [`remove the dataset "${parent}" and its child`, () => ensureDatasetAbsent(api, parent)],
  ]);
});

test('clicking the selected dataset opens and closes it', async ({ page, pool }) => {
  const parent = `${pool}/${parentLeaf}`;
  const parentNode = page.locator(datasetLocators.treeNode(parent));
  const childNode = page.locator(datasetLocators.treeNode(`${parent}/${childLeaf}`));

  await goToDatasets(page);
  await expandDatasetNode(page, pool);

  // A click on a row that is not selected selects it and opens nothing.
  await parentNode.click();
  await expect(page.locator(datasetDetailsLocators.path)).toHaveText(parent);
  await expect(parentNode).toHaveAttribute('aria-expanded', 'false');
  await expect(childNode).toBeHidden();

  await parentNode.click();
  await expect(childNode).toBeVisible();

  await parentNode.click();
  await expect(childNode).toBeHidden();

  await parentNode.click();
  await expect(childNode).toBeVisible();
});

test('a dataset closed by the user stays closed after the page reloads', async ({ page, api, pool }) => {
  const parent = `${pool}/${parentLeaf}`;
  const parentNode = page.locator(datasetLocators.treeNode(parent));
  const childNode = page.locator(datasetLocators.treeNode(`${parent}/${childLeaf}`));

  await goToDatasets(page);
  await expandDatasetNode(page, pool);
  await expandDatasetNode(page, parent);
  await expect(childNode).toBeVisible();

  await parentNode.click();
  await expect(childNode).toBeHidden();

  // Saving an edit reloads every dataset on the page. The card's new comment is what says the
  // reload has answered, so the tree is read only after it.
  await page.locator(datasetLocators.editDataset).click();
  await expect(page.locator(datasetLocators.name)).toHaveValue(parent);
  await page.locator(datasetLocators.comments).fill(comment);
  await saveDatasetForm(page);
  await expect(page.locator(datasetDetailsLocators.comments)).toHaveText(comment);

  await expect(parentNode).toHaveAttribute('aria-expanded', 'false');
  await expect(childNode).toBeHidden();
  // The reload kept the selection, so the closed row is still the one that was edited.
  await expect(page.locator(datasetDetailsLocators.path)).toHaveText(parent);
  expect(await findDataset(api, parent)).toMatchObject({
    user_properties: { comments: { value: comment, source: 'LOCAL' } },
  });

  // And it still opens: the reload left the row closed, not stuck.
  await selectDatasetNode(page, parent);
  await parentNode.click();
  await expect(childNode).toBeVisible();
});
