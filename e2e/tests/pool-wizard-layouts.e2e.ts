/**
 * Stories: an admin creates Mirror, RAIDZ1 and striped-mirror pools through Automated Disk Selection, and the
 * appliance holds the layout the wizard showed. The wizard builds `pool.create`'s payload itself
 * (`topologyToPayload`), so Review can read right while the payload is wrong; `pool.query`'s topology is the
 * check that matters. Each test owns one pool by name, removed before and after it, whatever happened: a pool
 * left behind holds its disks, and `findOnlinePool` would hand it to a later spec.
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
