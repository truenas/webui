/**
 * Story: an admin scrubs a pool from the storage dashboard and sees it finish.
 *
 * The scrub is the UI's: Scrub Now on the pool's Storage Health card, and Start
 * Scrub in the confirmation it raises. The pool is built over the API.
 *
 * The finished scrub is checked through the API and on screen. `pool.query` has
 * to report a `SCRUB` scan in state `FINISHED` with no errors. On the card, Last
 * Scan has to read "Finished Scrub on …" and Last Scan Errors has to read 0. The
 * card is not reloaded for that. It updates from the `pool.scan` events it
 * subscribes to, and that update is part of what is tested.
 *
 * ## Why this spec builds its own pool
 *
 * The worker-scoped `pool` fixture is an existing pool wherever the appliance
 * has one, and on a developer's box that pool can hold enough data to take hours
 * to scrub. `e2e_scrub_tank` is one empty disk, so its scrub takes seconds.
 *
 * It is built fresh before each test, because a pool that has been scrubbed
 * already shows "Finished Scrub" on its card. Without the rebuild the on-screen
 * checks could pass when the button did nothing. Teardown destroys it.
 *
 * Not covered: Pause, Resume and Stop. A scrub of an empty pool is over before
 * the buttons could be clicked. Also not covered: the scheduled scrub form.
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
