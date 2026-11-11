/**
 * Stories: an admin creates and edits a dataset from the Datasets page, through Other Options (the form's advanced
 * half). Each save is checked on screen and through `pool.dataset.query`, where `source: 'LOCAL'` proves the form
 * sent a property, since an unsent one reads back as inherited. The edit runs beside a sibling that must come
 * through untouched: the details card acts on the tree's selected node, so a selection bug would still look right.
 */
import { ensureDatasetAbsent, ensureDatasetPresent, findDataset } from '../fixtures/storage';
import {
  openAddDatasetForm, openEditDatasetForm, saveDatasetForm, selectOption,
} from '../flows/storage';
import { datasetDetailsLocators, datasetLocators } from '../locators/storage';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Created through the form, never over the API, because creating it is the thing under test. */
const createdLeaf = 'e2e_dataset_created';
const createdComment = 'made by the dataset form';

/** Provisioned over the API with every property inherited, so there is something to edit. */
const targetLeaf = 'e2e_dataset_target';
const editedComment = 'changed by the dataset form';

/** A sibling of the target that nothing here edits, so nothing here may change it. */
const bystanderLeaf = 'e2e_dataset_bystander';

const allLeaves = [createdLeaf, targetLeaf, bystanderLeaf];

test.beforeEach(async ({ api, pool }) => {
  for (const leaf of allLeaves) {
    await ensureDatasetAbsent(api, `${pool}/${leaf}`);
  }
});

test.afterEach(async ({ api, pool }) => {
  const datasets = allLeaves.map((leaf) => `${pool}/${leaf}`);
  if (leavingTestData(`the datasets ${datasets.join(', ')}`)) {
    return;
  }

  await runCleanupSteps(datasets.map((dataset): [string, () => Promise<void>] => [
    `remove the dataset "${dataset}"`, () => ensureDatasetAbsent(api, dataset),
  ]));
});

test('an admin creates a dataset, and the appliance really has one', async ({ page, api, pool }) => {
  const dataset = `${pool}/${createdLeaf}`;

  await openAddDatasetForm(page, pool);
  await page.locator(datasetLocators.name).fill(createdLeaf);

  // Other Options is not on screen until the form is switched to advanced mode,
  // so the comments field appearing shows that the toggle worked.
  await page.locator(datasetLocators.advancedToggle).click();
  await expect(page.locator(datasetLocators.comments)).toBeVisible();
  await page.locator(datasetLocators.comments).fill(createdComment);
  await selectOption(page, datasetLocators.sync, datasetLocators.syncOption('Always'));

  await saveDatasetForm(page);

  await expect(page.locator(datasetLocators.treeNode(dataset))).toBeVisible();

  const created = await findDataset(api, dataset);
  expect(created).toMatchObject({
    name: dataset,
    type: 'FILESYSTEM',
    sync: { value: 'ALWAYS', source: 'LOCAL' },
    user_properties: { comments: { value: createdComment, source: 'LOCAL' } },
  });
  // Left alone in the form, so it has to come back inherited rather than written.
  expect(created).not.toMatchObject({ atime: { source: 'LOCAL' } });
});

test('editing a dataset changes the dataset that was picked', async ({ page, api, pool }) => {
  const target = `${pool}/${targetLeaf}`;
  const bystander = `${pool}/${bystanderLeaf}`;
  await ensureDatasetPresent(api, target);
  await ensureDatasetPresent(api, bystander);

  await openEditDatasetForm(page, target);
  await page.locator(datasetLocators.comments).fill(editedComment);
  await selectOption(page, datasetLocators.sync, datasetLocators.syncOption('Always'));
  await selectOption(page, datasetLocators.atime, datasetLocators.atimeOption('Off'));

  await saveDatasetForm(page);

  // The card belongs to the dataset the tree has selected, and it reloads after the save.
  await expect(page.locator(datasetDetailsLocators.comments)).toHaveText(editedComment);
  await expect(page.locator(datasetDetailsLocators.sync)).toHaveText('ALWAYS');

  expect(await findDataset(api, target)).toMatchObject({
    sync: { value: 'ALWAYS', source: 'LOCAL' },
    atime: { value: 'OFF', source: 'LOCAL' },
    user_properties: { comments: { value: editedComment, source: 'LOCAL' } },
  });

  // Nothing here touched it, so it should still inherit everything and have no
  // comment of its own. A user property is inherited like any other, so a
  // comment on the pool would show up here too, as INHERITED rather than LOCAL.
  const untouched = await findDataset(api, bystander);
  expect(untouched).toBeDefined();
  expect(untouched).not.toMatchObject({ sync: { source: 'LOCAL' } });
  expect(untouched).not.toMatchObject({ atime: { source: 'LOCAL' } });
  expect(untouched).not.toMatchObject({ user_properties: { comments: { source: 'LOCAL' } } });
});
