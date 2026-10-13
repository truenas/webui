/**
 * Stories: an admin creates a dataset from the Datasets page, and edits one,
 * and the appliance holds what they did.
 *
 * Each save is asserted twice. The tree or the details card shows that the
 * screen believed it, and `pool.dataset.query` shows that the appliance did it.
 * That second check is the stronger one here: every field the form offers is
 * one ZFS property, and a property that was never sent reads back as inherited,
 * so `source: 'LOCAL'` is what proves the form sent it.
 *
 * Both tests go through Other Options, the advanced half of the form. Adding opens
 * in basic mode and the test switches it. Editing always opens in advanced mode.
 *
 * The edit acts beside a sibling dataset that must come through untouched. The
 * edit form is opened from the details card, which acts on whichever node the
 * tree has selected, so a selection bug would edit the wrong dataset and still
 * look right on the card.
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
