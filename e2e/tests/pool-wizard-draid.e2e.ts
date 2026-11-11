/**
 * Stories: an admin creates a dRAID1 pool with the chosen geometry, and the wizard warns about a dRAID with no
 * distributed spare but allows it. A lost or swapped `draid_data_disks` or `draid_spare_disks` would still build a
 * dRAID with the wrong geometry, so the test reads it back from the vdev name in `pool.query`
 * (`draid<parity>:<data>d:<children>c:<spares>s`). Five disks, not ten, because CI can't spare ten, so the
 * below-recommended-width warning is expected. Each pool name is removed before and after every test.
 */
import { readPoolTopology } from '../fixtures/pool';
import { ensurePoolAbsent, findPool, requireUnusedDisks } from '../fixtures/storage';
import {
  configureDraidVdevs, goToReview, openPoolWizard, submitPool,
} from '../flows/storage';
import { poolCardLocators, poolWizardLocators } from '../locators/storage';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const draidPool = 'e2e_wizard_draid';
const noSparePool = 'e2e_wizard_draid_nospare';
const pools = [draidPool, noSparePool];

/** One parity and two data disks in the group, plus one distributed spare. */
const draidDisks = 5;
/** One parity and two data disks, and no spare. */
const noSpareDisks = 4;

const smallDraidWarning = 'we recommend at least 10 disks per dRAID vdev';
const noSpareWarning = 'At least one distributed spare is recommended for dRAID';

test.beforeEach(async ({ api }) => {
  for (const pool of pools) {
    await ensurePoolAbsent(api, pool);
  }
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the pools ${pools.join(', ')}`)) {
    return;
  }

  await runCleanupSteps(pools.map((pool): [string, () => Promise<void>] => [
    `remove the pool "${pool}"`, () => ensurePoolAbsent(api, pool),
  ]));
});

test('an admin creates a dRAID1 pool, and the appliance builds the geometry chosen', async ({ page, api }) => {
  await requireUnusedDisks(api, draidDisks);

  await openPoolWizard(page, draidPool);
  await configureDraidVdevs(page, {
    layout: 'dRAID1',
    dataDevices: 2,
    spares: 1,
    children: draidDisks,
    vdevs: 1,
  });

  // Only a dRAID narrower than ten disks raises this, so it is also the readback that the
  // layout and the children landed.
  await expect(page.locator(poolWizardLocators.dataStepWarning)).toContainText(smallDraidWarning);

  await goToReview(page, 'data');
  await expect(page.locator(poolWizardLocators.reviewCategory('data'))).toContainText('1 × DRAID1 | 5 ×');
  await expect(page.locator(poolWizardLocators.reviewWarnings).filter({ hasText: smallDraidWarning })).toHaveCount(1);
  // There is a spare, so the warning the second test expects is absent here.
  await expect(page.locator(poolWizardLocators.reviewWarnings).filter({ hasText: noSpareWarning })).toHaveCount(0);

  await submitPool(page);

  // The card shows the vdev type middleware reports, `DRAID`, not the layout's `DRAID1`.
  await expect(page.locator(poolCardLocators.dataVdevs(draidPool))).toContainText('1 x DRAID | 5 wide');
  // The VDEVs card hides its Spare row for a dRAID pool: a distributed spare is part of the vdev.
  await expect(page.locator(poolCardLocators.vdevs(draidPool, 'spare'))).toHaveCount(0);

  const topology = await readPoolTopology(api, draidPool);
  expect(topology.data).toHaveLength(1);
  const [vdev] = topology.data;
  expect(vdev?.type).toBe('DRAID');
  // Parity, data disks, children and spares, in ZFS's own words. A swapped or dropped
  // `draid_data_disks` or `draid_spare_disks` changes this name and nothing else on screen.
  expect(vdev?.name).toMatch(/^draid1:2d:5c:1s/);
  expect(vdev?.children).toHaveLength(draidDisks);
});

test('the wizard warns about a dRAID with no distributed spare, and still allows it', async ({ page, api }) => {
  await requireUnusedDisks(api, noSpareDisks);

  await openPoolWizard(page, noSparePool);
  await configureDraidVdevs(page, {
    layout: 'dRAID1',
    dataDevices: 2,
    spares: 0,
    children: noSpareDisks,
    vdevs: 1,
  });

  await goToReview(page, 'data');
  await expect(page.locator(poolWizardLocators.reviewCategory('data'))).toContainText('1 × DRAID1 | 4 ×');
  await expect(page.locator(poolWizardLocators.reviewWarnings).filter({ hasText: noSpareWarning })).toHaveCount(1);
  // A warning, not an error: Create Pool stays enabled. It is never clicked.
  await expect(page.locator(poolWizardLocators.createPool)).toBeEnabled();

  expect(await findPool(api, noSparePool)).toBeUndefined();
});
