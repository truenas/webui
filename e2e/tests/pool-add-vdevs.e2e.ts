/**
 * Stories: from "Add VDEV" on a pool's VDEVs page, an admin adds a second mirror
 * to a one-mirror pool, and adds a cache and a log to it in one Update Pool.
 *
 * When adding to a pool, the wizard's Data step does not offer a layout: it shows
 * the pool's own, read-only, and the new data vdev takes it. The Review step
 * summarises what is being added, not the pool it is added to, so each test
 * checks it holds only the new vdevs. What the appliance then holds is read back
 * from the pool's card on the Storage dashboard, where the wizard lands, and
 * through `pool.query`, which is the one that matters.
 *
 * The first test also seeds a dataset before the update and reads it back after,
 * and both check the pool's original mirror is still there by its guid: adding
 * vdevs must change the pool, not rebuild it.
 *
 * ## Why this spec builds its own pool
 *
 * Both tests change a pool's topology, so neither may use the worker-scoped
 * `pool` fixture other specs share. The pool is built in each test, one two-disk
 * mirror, and destroyed before and after each one: with what is added it holds
 * four disks, and `fresh-install` needs nine alike.
 *
 * Not covered: a spare, which `pool-devices.e2e.ts` adds the same way; special
 * and dedup vdevs; and a pool whose data vdevs are RAIDZ.
 */
import { readPoolTopology } from '../fixtures/pool';
import { ensureDevicePoolPresent, readPoolStatus } from '../fixtures/pool-devices';
import {
  ensureDatasetPresent, ensurePoolAbsent, findDataset, requireUnusedDisks,
} from '../fixtures/storage';
import { openAddVdevsWizard, openVdevsPage, submitPoolUpdate } from '../flows/pool-devices';
import { configureAutomatedVdevs, goToReview } from '../flows/storage';
import { poolCardLocators, poolWizardLocators } from '../locators/storage';
import { leavingTestData } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** This spec's own pool. Not a name any other spec looks for. */
const pool = 'e2e_add_vdevs_tank';

/** Two for the pool's mirror, and two more for whatever each test adds. */
const neededDisks = 4;

test.beforeEach(async ({ api }) => {
  await ensurePoolAbsent(api, pool);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`pool "${pool}"`)) {
    return;
  }

  await ensurePoolAbsent(api, pool);
});

const mirrorTitle = 'an admin adds a second mirror to a one-mirror pool, in the layout the pool already has';

test(mirrorTitle, async ({ page, api }) => {
  await requireUnusedDisks(api, neededDisks);
  await ensureDevicePoolPresent(api, pool, { mirrors: 1 });
  const dataset = `${pool}/kept`;
  await ensureDatasetPresent(api, dataset);

  const [original] = (await readPoolTopology(api, pool)).data;
  expect(original?.type, `Pool "${pool}" should have one data mirror.`).toBe('MIRROR');

  await openVdevsPage(page, pool);
  await openAddVdevsWizard(page);

  // The layout is the pool's, and there is nothing to choose it with.
  const layout = page.locator(poolWizardLocators.lockedLayout);
  await expect(layout).toHaveValue('MIRROR');
  await expect(layout).not.toBeEditable();
  await expect(page.locator(poolWizardLocators.layout)).toHaveCount(0);

  await configureAutomatedVdevs(page, 'data', { width: 2, vdevs: 1 });
  await goToReview(page, 'data');

  // One mirror, the new one, not the two the pool will have.
  await expect(page.locator(poolWizardLocators.reviewCategory('data'))).toContainText('1 × MIRROR | 2 ×');
  for (const type of ['log', 'spare', 'cache'] as const) {
    await expect(page.locator(poolWizardLocators.reviewCategory(type))).toHaveCount(0);
  }

  await submitPoolUpdate(page);
  await expect(page.locator(poolCardLocators.dataVdevs(pool))).toContainText('2 x MIRROR | 2 wide');

  const after = await readPoolTopology(api, pool);
  expect(after.data.map(({ type }) => type)).toEqual(['MIRROR', 'MIRROR']);
  expect(after.data.map(({ children }) => children.length)).toEqual([2, 2]);
  // The mirror the pool was built with is the first, disks and all.
  expect(after.data[0]?.guid).toBe(original?.guid);
  expect(after.data[0]?.children.map(({ guid }) => guid)).toEqual(original?.children.map(({ guid }) => guid));
  expect(after.log).toEqual([]);
  expect(after.cache).toEqual([]);
  expect(after.spare).toEqual([]);

  expect(await findDataset(api, dataset), `Dataset "${dataset}" should survive the update.`).toBeDefined();
  expect(await readPoolStatus(api, pool)).toBe('ONLINE');
});

test('an admin adds a cache and a log to a pool in one Update Pool', async ({ page, api }) => {
  await requireUnusedDisks(api, neededDisks);
  await ensureDevicePoolPresent(api, pool, { mirrors: 1 });

  const [original] = (await readPoolTopology(api, pool)).data;
  expect(original?.type, `Pool "${pool}" should have one data mirror.`).toBe('MIRROR');

  await openVdevsPage(page, pool);
  await openAddVdevsWizard(page);
  await page.locator(poolWizardLocators.nextStep('data')).click();

  await configureAutomatedVdevs(page, 'log', { layout: 'Stripe', width: 1 });
  await page.locator(poolWizardLocators.nextStep('log')).click();
  await page.locator(poolWizardLocators.nextStep('spare')).click();

  await configureAutomatedVdevs(page, 'cache', { width: 1 });
  await goToReview(page, 'cache');

  await expect(page.locator(poolWizardLocators.reviewCategory('log'))).toContainText('1 × STRIPE | 1 ×');
  await expect(page.locator(poolWizardLocators.reviewCategory('cache'))).toContainText('1 × ');
  // The pool's data mirror is not listed: nothing is being added to it.
  await expect(page.locator(poolWizardLocators.reviewCategory('data'))).toHaveCount(0);
  await expect(page.locator(poolWizardLocators.reviewCategory('spare'))).toHaveCount(0);

  await submitPoolUpdate(page);
  await expect(page.locator(poolCardLocators.vdevs(pool, 'log'))).toContainText('1 x ');
  await expect(page.locator(poolCardLocators.vdevs(pool, 'cache'))).toContainText('1 x ');

  const after = await readPoolTopology(api, pool);
  expect(after.log).toHaveLength(1);
  expect(after.cache).toHaveLength(1);
  const [log] = after.log;
  const [cache] = after.cache;
  // Two different disks, and neither one of the mirror's.
  const mirrorDisks = original?.children.map(({ disk }) => disk) ?? [];
  expect(log?.disk).toBeTruthy();
  expect(cache?.disk).toBeTruthy();
  expect(log?.disk).not.toBe(cache?.disk);
  expect(mirrorDisks).not.toContain(log?.disk);
  expect(mirrorDisks).not.toContain(cache?.disk);

  expect(after.data.map(({ guid }) => guid)).toEqual([original?.guid]);
  expect(after.spare).toEqual([]);
  expect(await readPoolStatus(api, pool)).toBe('ONLINE');
});
