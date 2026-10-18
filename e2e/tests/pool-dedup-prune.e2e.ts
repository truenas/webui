/**
 * Stories: on the Storage dashboard, an admin prunes a pool's dedup table from
 * Prune on its Storage Health card, by percentage and by age.
 *
 * A prune changes nothing a test can read back from the pool: it drops entries
 * for blocks written once, if they are old enough, and the table's size is not a
 * number either test can predict. What the UI owns is the request, so each test
 * asserts the `pool.ddt_prune` job middleware ran for this pool, with the value
 * chosen in the dialog, and that it succeeded.
 *
 * ## Why this spec builds its own pool
 *
 * The dedup line, and Prune on it, need a pool with a dedup vdev and a table
 * with something in it, which the worker-scoped `pool` fixture has neither of.
 * Each test builds one, writes to it and waits for the table to have a size,
 * then destroys it before and after, unconditionally: the pool holds four disks,
 * and `fresh-install` needs nine alike.
 *
 * Not covered: Set Quota on the same line.
 */
import {
  ensureDedupPoolPresent, findDedupPruneRuns, readDedupTableSize,
} from '../fixtures/pool-devices';
import { ensurePoolAbsent, requireUnusedDisks } from '../fixtures/storage';
import { pruneDedupTable } from '../flows/storage';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** This spec's own pool. Not a name any other spec looks for. */
const pool = 'e2e_dedup_prune_tank';

/** The seed write lands in the table once its transaction group syncs. This is a ceiling. */
const seedSyncTimeoutMs = 60_000;

test.beforeEach(async ({ api }) => {
  await ensurePoolAbsent(api, pool);
  // A data mirror and a dedup mirror, all alike.
  await requireUnusedDisks(api, 4);

  await ensureDedupPoolPresent(api, pool);
  await expect
    .poll(() => readDedupTableSize(api, pool), {
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
