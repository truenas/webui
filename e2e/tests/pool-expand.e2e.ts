/**
 * Story: an admin expands a pool from the Advanced Actions menu on its Storage
 * card, and the pool comes through as it was.
 *
 * ## Why the expand is a no-op here
 *
 * `pool.expand` grows each data partition to fill its disk and then onlines it
 * with ZFS's expand flag. The CI appliance cannot grow a disk under a running
 * test, and every partition there already fills its disk, so the resize returns
 * early and the online changes nothing (`plugins/pool_/expand.py`). That no-op is
 * the only case this suite can run. What it still proves is that the menu item
 * starts a `pool.expand` job, that the job succeeds, and that the pool is unharmed
 * afterwards. Which pool the job was for is not read: this spec's pool is the only
 * one an expand is started for while it runs.
 *
 * ## What is evidence
 *
 * The job runs under the page loader with no dialog, and its success snackbar has
 * no `data-test`. So the screen's evidence is that no error dialog is raised and
 * the card's Data VDEVs line reads as it did. The job's own end state comes from
 * `core.get_jobs`, and the pool from `pool.query`.
 *
 * ## Why this spec builds its own pool
 *
 * An expand acts on every data vdev of the pool, so the worker-scoped `pool`
 * fixture other specs share is out. The pool is a two-disk mirror, built before
 * the test and destroyed before and after it, unconditionally.
 */
import { findJobStateAfter, findLatestJobId } from '../fixtures/jobs';
import { readPoolTopology, type PoolTopology, type TopologyVdev } from '../fixtures/pool';
import { ensureMirrorPoolPresent, readPoolStatus } from '../fixtures/pool-devices';
import { ensurePoolAbsent, requireUnusedDisks } from '../fixtures/storage';
import { goToStorage } from '../flows/navigation';
import { expandPool } from '../flows/storage';
import { errorDialogLocators } from '../locators/dialogs';
import { poolCardLocators } from '../locators/storage';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** This spec's own pool. Not a name any other spec looks for. */
const pool = 'e2e_expand_tank';

/** A no-op expand reads the partition table and onlines two disks. A ceiling, not a wait. */
const expandTimeoutMs = 2 * 60_000;

/** The dashboard loads every pool and its topology before a card renders. */
const dashboardTimeoutMs = 30_000;

interface VdevShape {
  type: string;
  guid: string;
  disk: string | null;
  children: VdevShape[];
}

/**
 * What the pool is built from: each vdev's type, guid and disk, and its children.
 * `pool.query` also returns I/O counters and sizes with each entry, which change
 * from one read to the next whatever an expand did, so they are left out.
 */
function shapeOf(vdevs: TopologyVdev[]): VdevShape[] {
  return vdevs.map((vdev) => ({
    type: vdev.type,
    guid: vdev.guid,
    disk: vdev.disk ?? null,
    children: shapeOf(vdev.children),
  }));
}

async function readPoolShape(api: E2eApiClient): Promise<Record<string, VdevShape[]>> {
  const topology = await readPoolTopology(api, pool);
  const categories = Object.keys(topology) as (keyof PoolTopology)[];

  return Object.fromEntries(categories.map((category) => [category, shapeOf(topology[category])]));
}

test.beforeEach(async ({ api }) => {
  await ensurePoolAbsent(api, pool);
  await requireUnusedDisks(api, 2);
  await ensureMirrorPoolPresent(api, pool);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`pool "${pool}"`)) {
    return;
  }

  await ensurePoolAbsent(api, pool);
});

test('Expand Pool on a pool whose disks are already full finishes, and leaves the pool as it was', async ({
  page,
  api,
}) => {
  const shapeBefore = await readPoolShape(api);
  expect(shapeBefore.data, 'the pool should have one data vdev, its mirror').toHaveLength(1);
  expect(await readPoolStatus(api, pool)).toBe('ONLINE');
  const lastJobId = await findLatestJobId(api, 'pool.expand');

  await goToStorage(page);
  const dataVdevs = page.locator(poolCardLocators.dataVdevs(pool));
  await expect(dataVdevs).toBeVisible({ timeout: dashboardTimeoutMs });
  const dataVdevsBefore = await dataVdevs.innerText();

  await expandPool(page, pool);

  // Polled to any end state and then judged, so a failed expand reports itself
  // in seconds rather than as a timeout.
  await expect.poll(
    () => findJobStateAfter(api, 'pool.expand', lastJobId),
    { message: 'a pool.expand job newer than the last should finish', timeout: expandTimeoutMs },
  ).toMatch(/^(SUCCESS|FAILED|ABORTED)$/);
  expect(await findJobStateAfter(api, 'pool.expand', lastJobId)).toBe('SUCCESS');

  // A failed job would raise the error dialog. These two hold before the
  // dashboard's reload as well as after it, so they back up the job's state and
  // the topology read below rather than prove anything alone.
  await expect(page.locator(errorDialogLocators.title)).toBeHidden();
  await expect(dataVdevs).toHaveText(dataVdevsBefore, { timeout: dashboardTimeoutMs });

  expect(await readPoolStatus(api, pool)).toBe('ONLINE');
  // Same vdev types, guids and disks: the expand neither rebuilt nor reshaped anything.
  expect(await readPoolShape(api)).toEqual(shapeBefore);
});
