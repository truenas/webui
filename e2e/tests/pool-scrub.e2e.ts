/**
 * Story: an admin scrubs a pool from its Storage Health card and sees it finish, in `pool.query` and on the card.
 * The card isn't reloaded: it updates from `pool.scan` events, and that update is under test. `e2e_scrub_tank` is
 * one empty disk so its scrub takes seconds; the shared `pool` may be a real one that takes hours. It's rebuilt
 * before each test because an already-scrubbed pool shows "Finished Scrub" anyway, which would let the checks pass
 * when the button did nothing. Teardown destroys it.
 */
import { ensurePoolPresent } from '../fixtures/pool';
import { ensurePoolAbsent, findPoolScan } from '../fixtures/storage';
import { startScrub } from '../flows/storage';
import { poolScrubLocators } from '../locators/storage';
import { leavingTestData } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Built, scrubbed and destroyed here. Not a name any other spec looks for. */
const pool = 'e2e_scrub_tank';

/** A scrub of one empty disk takes seconds. This leaves room for a slow appliance. */
const scrubTimeoutMs = 2 * 60_000;

/** The card hears the scan finish from a `pool.scan` event, which can trail the API. */
const cardUpdateTimeoutMs = 60_000;

test.beforeEach(async ({ api }) => {
  await ensurePoolAbsent(api, pool);
  await ensurePoolPresent(api, pool);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`pool "${pool}"`)) {
    return;
  }

  // Exporting stops a scrub that is still running, so nothing else needs restoring.
  await ensurePoolAbsent(api, pool);
});

test('an admin scrubs a pool and the dashboard shows it finished', async ({ page, api }) => {
  // The starting state the scrub has to change: a new pool, never scrubbed.
  expect((await findPoolScan(api, pool))?.function).not.toBe('SCRUB');

  await startScrub(page, pool);

  await expect.poll(
    async () => {
      const scan = await findPoolScan(api, pool);
      return { function: scan?.function, state: scan?.state, errors: scan?.errors };
    },
    { message: `pool.query should report a finished scrub of "${pool}"`, timeout: scrubTimeoutMs },
  ).toEqual({ function: 'SCRUB', state: 'FINISHED', errors: 0 });

  await expect(page.locator(poolScrubLocators.lastScan(pool))).toContainText(
    'Finished Scrub on',
    { timeout: cardUpdateTimeoutMs },
  );
  await expect(page.locator(poolScrubLocators.lastScanErrors(pool))).toHaveText('0');

  // Scrub Now is hidden while a scan runs and comes back once it is over.
  await expect(page.locator(poolScrubLocators.start(pool))).toBeVisible();
});
