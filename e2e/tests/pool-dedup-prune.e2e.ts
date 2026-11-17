/**
 * Stories: on the Storage dashboard an admin prunes a pool's dedup table by percentage and by age. A prune's effect
 * is unpredictable, so each test asserts the `pool.ddt_prune` job ran for this pool with the chosen value and
 * succeeded. The shared `pool` has no dedup vdev, so each test builds one, writes until the table has a size, and
 * destroys it before and after unconditionally: it holds four disks, and `fresh-install` needs nine alike.
 */
import {
  addDedupSeed, ensureDedupPoolPresent, findDedupPruneRuns, readDedupTableSize,
} from '../fixtures/pool-devices';
import { ensurePoolAbsent, requireUnusedDisks } from '../fixtures/storage';
import { pruneDedupTable } from '../flows/storage';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** This spec's own pool. Not a name any other spec looks for. */
const pool = 'e2e_dedup_prune_tank';

/**
 * The seed write is synced before the first read, so the size is normally there
 * at once. A ceiling, since each re-seed is a cron job made, run and removed.
 */
const seedSyncTimeoutMs = 120_000;

/** The table's size, seeding it again if it still reads zero. See `addDedupSeed`. */
async function readOrReseedTableSize(api: E2eApiClient): Promise<number> {
  const size = await readDedupTableSize(api, pool);
  if (size === 0) {
    await addDedupSeed(api, pool);
  }
  return size;
}

test.beforeEach(async ({ api }) => {
  await ensurePoolAbsent(api, pool);
  // A data mirror and a dedup mirror, all alike.
  await requireUnusedDisks(api, 4);

  await ensureDedupPoolPresent(api, pool);
  await expect
    .poll(() => readOrReseedTableSize(api), {
      message: `Pool "${pool}" should have entries in its dedup table, or the card offers no Prune.`,
      timeout: seedSyncTimeoutMs,
    })
    .toBeGreaterThan(0);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`pool "${pool}"`)) {
    return;
  }

  await ensurePoolAbsent(api, pool);
});

/** The highest `pool.ddt_prune` job id for the pool so far, so a test reads only its own. */
async function lastPruneRunId(api: E2eApiClient): Promise<number> {
  return Math.max(0, ...(await findDedupPruneRuns(api, pool)).map(({ id }) => id));
}

test('an admin prunes the dedup table by percentage', async ({ page, api }) => {
  const since = await lastPruneRunId(api);

  await pruneDedupTable(page, pool, { percentage: 50 });

  const runs = (await findDedupPruneRuns(api, pool)).filter(({ id }) => id > since);
  expect(runs.map(({ state, percentage, days }) => ({ state, percentage, days }))).toEqual([
    { state: 'SUCCESS', percentage: 50, days: null },
  ]);
});

test('an admin prunes the dedup table by age', async ({ page, api }) => {
  const since = await lastPruneRunId(api);

  await pruneDedupTable(page, pool, { days: 30 });

  const runs = (await findDedupPruneRuns(api, pool)).filter(({ id }) => id > since);
  expect(runs.map(({ state, percentage, days }) => ({ state, percentage, days }))).toEqual([
    { state: 'SUCCESS', percentage: null, days: 30 },
  ]);
});
