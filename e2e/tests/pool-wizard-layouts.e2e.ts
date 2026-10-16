/**
 * Stories: an admin creates a Mirror pool, a RAIDZ1 pool and a pool of two striped mirrors
 * through the pool wizard's Automated Disk Selection, and the appliance holds the layout the
 * wizard showed.
 *
 * Each test checks the layout four times: in the Data step's Configuration Preview, on the Review
 * step, on the pool's VDEVs card on the Storage dashboard, and in `pool.query`'s topology. The last
 * is the one that matters. The wizard builds `pool.create`'s payload itself (`topologyToPayload`),
 * so a payload with the wrong layout, width or vdev count would still show the right words on the
 * Review step. Only the appliance would show the mistake.
 *
 * `fresh-install` already builds a RAIDZ2 pool through the wizard as one step of a longer journey.
 * These tests cover the other layouts, and check the Review step and the result, which that one
 * does not.
 *
 * ## Why these tests build pools of their own
 *
 * Creating a pool is the thing under test, so none of them can use the worker-scoped `pool`
 * fixture. Each test owns one pool, by name. Every one of those names is removed before each test
 * and after it, whatever happened. A pool left behind holds its disks, and `findOnlinePool` would
 * hand it to a later spec as that spec's pool.
 *
 * Not covered: RAIDZ2 (`fresh-install`'s), RAIDZ3, dRAID, the other kinds of vdev, Manual Disk
 * Selection, encryption, Inspect VDEVs, Reset Step and Start Over. The wizard's validation is in
 * `pool-wizard-validation.e2e.ts`.
 */
import { readPoolTopology } from '../fixtures/pool';
import { ensurePoolAbsent, findPool, requireUnusedDisks } from '../fixtures/storage';
import {
  configureAutomatedVdevs, goToReview, openPoolWizard, submitPool,
} from '../flows/storage';
import { poolCardLocators, poolWizardLocators } from '../locators/storage';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** A data vdev layout the wizard builds, and the pool a test builds it as. */
interface WizardLayout {
  /** The test's own pool. Not a name any other spec looks for. */
  pool: string;
  /** What the test is called, after "an admin creates". */
  story: string;
  /** The layout option's label in the wizard. */
  label: string;
  /** The vdev `type` middleware reports, and the word the wizard and the dashboard show. */
  type: string;
  width: number;
  vdevs: number;
}

const layouts: WizardLayout[] = [
  {
    pool: 'e2e_wizard_mirror',
    story: 'a pool of one two-disk mirror',
    label: 'Mirror',
    type: 'MIRROR',
    width: 2,
    vdevs: 1,
  },
  {
    pool: 'e2e_wizard_raidz1',
    story: 'a pool of one three-disk RAIDZ1 vdev',
    label: 'RAIDZ1',
    type: 'RAIDZ1',
    width: 3,
    vdevs: 1,
  },
  {
    pool: 'e2e_wizard_mirror2',
    story: 'a pool of two striped two-disk mirrors',
    label: 'Mirror',
    type: 'MIRROR',
    width: 2,
    vdevs: 2,
  },
];

const pools = layouts.map(({ pool }) => pool);

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

for (const layout of layouts) {
  const {
    pool,
    story,
    label,
    type,
    width,
    vdevs,
  } = layout;
  const disks = width * vdevs;
  const title = `an admin creates ${story} through the wizard, and the appliance holds that layout`;

  test(title, async ({ page, api }) => {
    await requireUnusedDisks(api, disks);

    // The words the wizard uses for this layout, in the preview and on the Review step.
    const wizardSummary = `${vdevs} × ${type} | ${width} ×`;

    await openPoolWizard(page, pool);
    await configureAutomatedVdevs(page, 'data', { layout: label, width, vdevs });
    await expect(page.locator(poolWizardLocators.configPreview('data'))).toContainText(wizardSummary);

    await goToReview(page, 'data');
    await expect(page.locator(poolWizardLocators.reviewPoolName)).toHaveText(pool);
    await expect(page.locator(poolWizardLocators.reviewCategory('data'))).toContainText(wizardSummary);
    // A size that starts with a digit other than 0. The value is empty until the
    // capacity is worked out, and a wrong topology can work out to `0 B`.
    await expect(page.locator(poolWizardLocators.reviewEstUsableRawCapacity)).toHaveText(/^[1-9]/);

    await submitPool(page);

    await expect(page.locator(poolCardLocators.name(pool))).toBeVisible();
    await expect(page.locator(poolCardLocators.dataVdevs(pool))).toContainText(
      `${vdevs} x ${type} | ${width} wide`,
    );

    expect((await findPool(api, pool))?.status).toBe('ONLINE');

    const topology = await readPoolTopology(api, pool);
    expect(topology.data.map((vdev) => ({ type: vdev.type, width: vdev.children.length }))).toEqual(
      Array.from({ length: vdevs }, () => ({ type, width })),
    );
    // Every disk in its own place: no disk counted twice across the vdevs.
    const members = topology.data.flatMap((vdev) => vdev.children.map((child) => child.disk));
    expect(new Set(members.filter(Boolean)).size).toBe(disks);
    expect({
      log: topology.log,
      cache: topology.cache,
      spare: topology.spare,
      special: topology.special,
      dedup: topology.dedup,
    }).toEqual({
      log: [],
      cache: [],
      spare: [],
      special: [],
      dedup: [],
    });
  });
}
