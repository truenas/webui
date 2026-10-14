/**
 * Stories: an admin creates a zvol from the Datasets page, edits one, and deletes one, and the
 * appliance holds what they did.
 *
 * Each change is asserted on screen and through `pool.dataset.query`. The second check is the
 * stronger one. Sync is a ZFS property, and a property the form never sent reads back as
 * inherited, so `source: 'LOCAL'` is what proves the form sent it. The size is checked in bytes,
 * because the form takes `64 MiB` and has to turn that into a number itself.
 *
 * Edit and delete both act beside a bystander zvol that must come through untouched. Both are
 * reached from the details card, which acts on whatever the tree has selected, so a selection bug
 * would act on the wrong zvol and still look right on screen.
 *
 * `datasets-deletion.e2e.ts` already covers the delete dialog's gates for a zvol. Here the
 * deletion is confirmed properly and has to actually happen.
 */
import { ensureDatasetAbsent, ensureZvolPresent, findDataset } from '../fixtures/storage';
import {
  fillDatasetDeletionConfirmation, openAddZvolForm, openDeleteDatasetDialog, openEditZvolForm, saveDatasetForm,
  setZvolSync,
} from '../flows/storage';
import {
  datasetDetailsLocators, datasetLocators, deleteDatasetDialogLocators, zvolLocators,
} from '../locators/storage';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const mib = 1024 * 1024;

/** Created through the form, never over the API, because creating it is the thing under test. */
const createdLeaf = 'e2e_zvol_created';

/**
 * Provisioned over the API at 64 MiB, sparse, with every property inherited (`ensureZvolPresent`).
 * Edited or deleted through the UI.
 */
const targetLeaf = 'e2e_zvol_target';

/** Provisioned the same way as the target. Nothing here acts on it, so nothing here may change it. */
const bystanderLeaf = 'e2e_zvol_bystander';

/** What `ensureZvolPresent` provisions. */
const provisionedVolsize = 64 * mib;

const allLeaves = [createdLeaf, targetLeaf, bystanderLeaf];

test.beforeEach(async ({ api, pool }) => {
  for (const leaf of allLeaves) {
    await ensureDatasetAbsent(api, `${pool}/${leaf}`);
  }
});

test.afterEach(async ({ api, pool }) => {
  const zvols = allLeaves.map((leaf) => `${pool}/${leaf}`);
  if (leavingTestData(`the zvols ${zvols.join(', ')}`)) {
    return;
  }

  await runCleanupSteps(zvols.map((zvol): [string, () => Promise<void>] => [
    `remove the zvol "${zvol}"`, () => ensureDatasetAbsent(api, zvol),
  ]));
});

test('an admin creates a zvol, and the appliance really has one', async ({ page, api, pool }) => {
  const zvol = `${pool}/${createdLeaf}`;

  await openAddZvolForm(page, pool);
  await page.locator(zvolLocators.name).fill(createdLeaf);
  await page.locator(zvolLocators.volsize).fill('64 MiB');
  // Sparse, like the zvols the fixtures provision. A thick one would reserve its whole size
  // from the pool, and the shared pool may be a developer's own.
  await page.locator(zvolLocators.sparse).click();
  await setZvolSync(page, 'Always');

  await saveDatasetForm(page);

  await expect(page.locator(datasetLocators.treeNode(zvol))).toBeVisible();

  const created = await findDataset(api, zvol);
  expect(created).toMatchObject({
    name: zvol,
    type: 'VOLUME',
    volsize: { parsed: 64 * mib },
    sync: { value: 'ALWAYS', source: 'LOCAL' },
  });
  // Left at Inherit in the form, so it has to come back inherited rather than written.
  expect(created).not.toMatchObject({ compression: { source: 'LOCAL' } });
});

test('editing a zvol grows the zvol that was picked', async ({ page, api, pool }) => {
  const target = `${pool}/${targetLeaf}`;
  const bystander = `${pool}/${bystanderLeaf}`;
  await ensureZvolPresent(api, target);
  await ensureZvolPresent(api, bystander);

  await openEditZvolForm(page, target);
  await page.locator(zvolLocators.volsize).fill('128 MiB');
  await setZvolSync(page, 'Always');

  await saveDatasetForm(page);

  // The card belongs to the zvol the tree has selected, and it reloads after the save.
  await expect(page.locator(datasetDetailsLocators.path)).toHaveText(target);
  await expect(page.locator(datasetDetailsLocators.sync)).toHaveText('ALWAYS');

  expect(await findDataset(api, target)).toMatchObject({
    volsize: { parsed: 128 * mib },
    sync: { value: 'ALWAYS', source: 'LOCAL' },
  });

  const untouched = await findDataset(api, bystander);
  expect(untouched).toMatchObject({ volsize: { parsed: provisionedVolsize } });
  expect(untouched).not.toMatchObject({ sync: { source: 'LOCAL' } });
});

test('a fully confirmed deletion removes the zvol that was picked', async ({ page, api, pool }) => {
  const target = `${pool}/${targetLeaf}`;
  const bystander = `${pool}/${bystanderLeaf}`;
  await ensureZvolPresent(api, target);
  await ensureZvolPresent(api, bystander);

  await openDeleteDatasetDialog(page, target);
  await fillDatasetDeletionConfirmation(page, target);
  await page.locator(deleteDatasetDialogLocators.submit).click();

  await expect.poll(() => tolerating(() => findDataset(api, target))).toBeUndefined();
  await expect(page.locator(datasetLocators.treeNode(target))).toBeHidden();
  expect(await findDataset(api, bystander)).toBeDefined();
});

/**
 * Runs a poll generator, turning a rejection into "no answer yet".
 *
 * Playwright awaits an `expect.poll` generator outside its own try/catch, so a rejected call
 * aborts the poll rather than costing one attempt. The same helper is in
 * `datasets-deletion.e2e.ts`, for the same reason.
 */
async function tolerating<T>(read: () => Promise<T>): Promise<T | undefined> {
  try {
    return await read();
  } catch {
    return undefined;
  }
}
