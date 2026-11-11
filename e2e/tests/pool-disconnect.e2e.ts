/**
 * Story: a pool cannot be destroyed without meaning it. "Delete Pool" runs `pool.export` with `destroy: true`,
 * wiping every member disk with no undo. Once chosen, its name field is the form's single text input, which Enter
 * submits past the disabled button, and `startExportDisconnectJob()` had no validity check (the same class as
 * `datasets-deletion.e2e.ts`). Claims are settled through `pool.query`, since the row vanishes while the wipe runs.
 * It builds its own one-disk pool, never the shared `pool` fixture, and `afterEach` removes it unconditionally:
 * left behind, `findOnlinePool` would hand it to a later spec.
 */
import type { Page } from '@playwright/test';
import { ensurePoolPresent } from '../fixtures/pool';
import { ensurePoolAbsent, findPool, getSelectableDisks } from '../fixtures/storage';
import { goToStorage } from '../flows/navigation';
import { chooseDeletePool, openPoolDisconnectDialog } from '../flows/storage';
import { poolDisconnectLocators } from '../locators/storage';
import type { E2eApiClient } from '../support/api/client';
import { expect, test } from '../support/fixtures';

/**
 * This spec's own pool. Not `e2e_shared_tank` — see the note above — and not a
 * name any other spec looks for.
 */
const target = 'e2e_disconnect_target';

/** Set by {@link tolerating} so a persistent query fault reaches the run log. */
let lastPollError: unknown;

test.beforeEach(async ({ api }) => {
  await ensurePoolPresent(api, target);
});

test.afterEach(async ({ api }) => {
  if (lastPollError) {
    console.warn('A polled read kept failing; last error:', lastPollError);
    lastPollError = undefined;
  }
  await ensurePoolAbsent(api, target);
});

test('pressing Enter does not destroy a pool with the confirmation empty', async ({ page, api }) => {
  await openPoolDisconnectDialog(page, target);
  await chooseDeletePool(page);

  // Nothing typed, nothing ticked: the state the dialog is in the moment
  // "Delete Pool" is chosen, and the state in which the bug destroyed the pool.
  await expect(page.locator(poolDisconnectLocators.submit)).toBeDisabled();
  await page.locator(poolDisconnectLocators.name).press('Enter');

  await expectPoolSurvived(page, api, target);
});

test('pressing Enter with the wrong pool name does not destroy the pool', async ({ page, api }) => {
  await openPoolDisconnectDialog(page, target);
  await chooseDeletePool(page);

  // Both gates touched, neither satisfied: the tick is on, but the name is not
  // this pool's. A guard that only checked for an empty field would pass this.
  await page.locator(poolDisconnectLocators.confirm).click();
  await page.locator(poolDisconnectLocators.name).fill(`${target}-not-really`);
  await expect(page.locator(poolDisconnectLocators.submit)).toBeDisabled();

  await page.locator(poolDisconnectLocators.name).press('Enter');

  await expectPoolSurvived(page, api, target);
});

test('a fully confirmed delete really does destroy the pool', async ({ page, api }) => {
  // Counted while the pool still holds its disk, so the wait at the end has
  // something to compare against.
  const disksWhileClaimed = (await getSelectableDisks(api)).length;

  await openPoolDisconnectDialog(page, target);
  await chooseDeletePool(page);

  await page.locator(poolDisconnectLocators.confirm).click();
  await page.locator(poolDisconnectLocators.name).fill(target);
  await expect(page.locator(poolDisconnectLocators.submit)).toBeEnabled();

  await page.locator(poolDisconnectLocators.submit).click();

  // The counterweight to the two tests above. A guard that refused every
  // submission would satisfy them both and leave nobody able to remove a pool.
  // Polled: `pool.export` is a job, so the row goes some time after the click.
  await expect
    .poll(() => tolerating(() => findPool(api, target)), { timeout: 3 * 60_000 })
    .toBeUndefined();

  // The row going is not the end: `destroy: true` keeps wiping the disk after `pool.query` drops the pool (see
  // `CLAUDE.md` on inferring job success from side effects), and leaving mid-wipe starves `requireUnusedDisks`,
  // which `fresh-install` needs, so wait for the disk to come back. A count rather than this pool's `devname` is
  // sound only because `playwright.config.ts` pins `workers: 1` and `fullyParallel: false`, so nothing else can be
  // freeing a disk meanwhile.
  await expect
    .poll(
      () => tolerating(() => getSelectableDisks(api).then((disks) => disks.length)),
      { timeout: 6 * 60_000 },
    )
    .toBeGreaterThan(disksWhileClaimed);
});

/**
 * Asserts that whatever just happened in the dialog did not start an export. This dialog hands off to a job dialog
 * and closes later, so "still open" or "still accepts input" proves nothing (a first attempt relying on that passed
 * against the broken build), and asking `pool.query` at once races the job. So the readback is a full navigation
 * back to the pool list, which cannot resolve before the app sends what the keypress queued on the same socket,
 * and an export that started removes the pool from it; then the appliance is asked directly.
 */
async function expectPoolSurvived(page: Page, api: E2eApiClient, pool: string): Promise<void> {
  await page.locator(poolDisconnectLocators.cancel).click();
  await goToStorage(page);

  await expect(page.locator(poolDisconnectLocators.open(pool))).toBeVisible();
  expect(await findPool(api, pool)).toBeDefined();
}

/**
 * Runs a poll generator, turning a rejection into "no answer yet". Playwright awaits an `expect.poll` generator
 * outside its own try/catch, so a rejection aborts the poll (see `readServiceState` in
 * `tests/unauthenticated/fresh-install.e2e.ts`). Both polls span a `pool.export`, which drops its connection
 * (`support/jobs.ts`), so a transient rejection is normal. The last failure is kept so a persistently broken query
 * names itself instead of hiding behind "the pool never went away".
 */
async function tolerating<T>(read: () => Promise<T>): Promise<T | undefined> {
  try {
    lastPollError = undefined;
    return await read();
  } catch (error) {
    lastPollError = error;
    return undefined;
  }
}
