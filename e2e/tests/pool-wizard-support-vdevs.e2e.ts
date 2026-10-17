/**
 * Stories: an admin creates a pool with a mirrored log, a cache disk and a spare through the pool
 * wizard's Log, Spare and Cache steps, and the appliance holds all three; and the wizard warns
 * about a stripe log but still allows it.
 *
 * Each of those steps puts its selection into its own part of `pool.create`'s topology
 * (`topologyToPayload`). If one were dropped, the pool would still be created without it and the
 * wizard would still report success. So the first test reads the result back three ways: the
 * Review step, the pool's VDEVs card on the Storage dashboard, and `pool.query`'s topology. The last
 * is the one that matters.
 *
 * The Spare and Cache steps render no layout select, and the Log, Spare and Cache steps no vdev
 * count: each builds exactly one vdev, and a spare or a cache device is one disk.
 *
 * Both tests own their pool by name. Each name is removed before and after every test, whatever
 * happened, because a pool left behind holds its disks.
 *
 * Not covered: special and dedup vdevs, adding a log or cache to an existing pool from Add VDEV,
 * and removing a log, cache or spare.
 */
import { readPoolTopology, type TopologyVdev } from '../fixtures/pool';
import { ensurePoolAbsent, findPool, requireUnusedDisks } from '../fixtures/storage';
import {
  configureAutomatedVdevs, goToReview, openPoolWizard, submitPool,
} from '../flows/storage';
import { poolCardLocators, poolWizardLocators } from '../locators/storage';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const supportPool = 'e2e_wizard_support';
const logStripePool = 'e2e_wizard_log_stripe';
const pools = [supportPool, logStripePool];

/** Two for the data mirror, two for the log mirror, one cache, one spare. */
const supportDisks = 6;
/** Two for the data mirror, one for the stripe log. */
const logStripeDisks = 3;

const logStripeWarning = 'A stripe log VDEV may result in data loss';

/** The disks of a vdev, or the disk itself for a single-disk entry such as a cache or a spare. */
function disksOf(vdev: TopologyVdev): (string | null | undefined)[] {
  return vdev.children.length ? vdev.children.map((child) => child.disk) : [vdev.disk];
}

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

const supportTitle = 'an admin creates a pool with a mirrored log, a cache and a spare, '
  + 'and the appliance holds all three';

test(supportTitle, async ({ page, api }) => {
  await requireUnusedDisks(api, supportDisks);

  await openPoolWizard(page, supportPool);
  await configureAutomatedVdevs(page, 'data', { layout: 'Mirror', width: 2, vdevs: 1 });
  await page.locator(poolWizardLocators.nextStep('data')).click();

  await configureAutomatedVdevs(page, 'log', { layout: 'Mirror', width: 2 });
  await page.locator(poolWizardLocators.nextStep('log')).click();

  await configureAutomatedVdevs(page, 'spare', { width: 1 });
  await page.locator(poolWizardLocators.nextStep('spare')).click();

  await configureAutomatedVdevs(page, 'cache', { width: 1 });
  await goToReview(page, 'cache');

  // Each row is rendered only for a category that has vdevs. A spare or cache row reads
  // `1 × <size>`; "Manual layout" or "None" would mean the step's selection did not land.
  await expect(page.locator(poolWizardLocators.reviewCategory('data'))).toContainText('1 × MIRROR | 2 ×');
  await expect(page.locator(poolWizardLocators.reviewCategory('log'))).toContainText('1 × MIRROR | 2 ×');
  await expect(page.locator(poolWizardLocators.reviewCategory('cache'))).toContainText('1 × ');
  await expect(page.locator(poolWizardLocators.reviewCategory('spare'))).toContainText('1 × ');

  await submitPool(page);

  await expect(page.locator(poolCardLocators.name(supportPool))).toBeVisible();
  await expect(page.locator(poolCardLocators.vdevs(supportPool, 'log'))).toContainText('1 x MIRROR | 2 wide');
  await expect(page.locator(poolCardLocators.vdevs(supportPool, 'cache'))).toContainText('1 x ');
  await expect(page.locator(poolCardLocators.vdevs(supportPool, 'spare'))).toContainText('1 x ');

  const topology = await readPoolTopology(api, supportPool);
  expect(topology.data.map((vdev) => ({ type: vdev.type, width: vdev.children.length }))).toEqual([
    { type: 'MIRROR', width: 2 },
  ]);
  expect(topology.log.map((vdev) => ({ type: vdev.type, width: vdev.children.length }))).toEqual([
    { type: 'MIRROR', width: 2 },
  ]);
  expect(topology.cache.map((vdev) => vdev.type)).toEqual(['DISK']);
  expect(topology.spare.map((vdev) => vdev.type)).toEqual(['DISK']);

  // Six different disks: none of the steps handed out a disk another step had already taken.
  const members = [...topology.data, ...topology.log, ...topology.cache, ...topology.spare].flatMap(disksOf);
  expect(new Set(members.filter(Boolean)).size).toBe(supportDisks);
});

test('the wizard warns about a stripe log, and still allows it', async ({ page, api }) => {
  await requireUnusedDisks(api, logStripeDisks);

  await openPoolWizard(page, logStripePool);
  await configureAutomatedVdevs(page, 'data', { layout: 'Mirror', width: 2, vdevs: 1 });
  await page.locator(poolWizardLocators.nextStep('data')).click();

  // No log chosen yet, so no warning. This is what makes the next check about the stripe.
  await expect(page.locator(poolWizardLocators.layout)).toBeVisible();
  await expect(page.locator(poolWizardLocators.logStepWarning)).toHaveCount(0);

  await configureAutomatedVdevs(page, 'log', { layout: 'Stripe', width: 1 });
  await expect(page.locator(poolWizardLocators.logStepWarning)).toContainText(logStripeWarning);

  await goToReview(page, 'log');
  await expect(page.locator(poolWizardLocators.reviewCategory('log'))).toContainText('STRIPE');
  await expect(
    page.locator(poolWizardLocators.reviewWarnings).filter({ hasText: logStripeWarning }),
  ).toHaveCount(1);
  // A warning, not an error: Create Pool stays enabled. It is never clicked.
  await expect(page.locator(poolWizardLocators.createPool)).toBeEnabled();

  expect(await findPool(api, logStripePool)).toBeUndefined();
});
