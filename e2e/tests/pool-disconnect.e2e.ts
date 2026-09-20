/**
 * Story: a pool cannot be destroyed without meaning it.
 *
 * This is the same confirmation-bypass class as `datasets-deletion.e2e.ts` and
 * the most expensive place in the app to get it wrong. Choosing "Delete Pool"
 * and confirming runs `pool.export` with `destroy: true`, which wipes every
 * member disk — there is no undo and no snapshot to fall back to.
 *
 * Its handler was worse than the dataset dialog's: `startExportDisconnectJob()`
 * read the form and started the job with no validity check whatsoever. The only
 * thing standing between a keypress and a destroyed pool was a disabled button
 * that the browser's implicit form submission does not consult — and once
 * "Delete Pool" is chosen, the name field it reveals is the form's single text
 * input, which is exactly the shape Enter submits.
 *
 * Each claim is settled through `pool.query`. A dialog that stayed open is not
 * evidence the pool survived, and the pool row disappears while the disk wipe
 * is still running, so the screen is not evidence either way.
 *
 * ## Why this spec builds its own pool
 *
 * It must not use the worker-scoped `pool` fixture. That pool is shared with
 * every other spec in the worker, and a test whose subject is destroying a pool
 * would take the rest of the run with it the moment it regressed — the failure
 * would arrive as a dozen unrelated specs breaking. `ensurePoolPresent` builds
 * one disk's worth of pool under a name of this spec's own, and `afterEach`
 * removes it unconditionally: left behind, `findOnlinePool` would hand it to a
 * later spec as *its* pool.
 */
import type { Page } from '@playwright/test';
import { ensurePoolPresent } from '../fixtures/pool';
import { ensurePoolAbsent, findPool } from '../fixtures/storage';
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

test.beforeEach(async ({ api }) => {
  await ensurePoolPresent(api, target);
});

test.afterEach(async ({ api }) => {
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
    .poll(() => findPool(api, target), { timeout: 3 * 60_000 })
    .toBeUndefined();
});

/**
 * Asserts that whatever just happened in the dialog did not start an export.
 *
 * Getting this right took two attempts, and the first one passed against the
 * *broken* build. Unlike the delete-dataset dialog, this one does not close
 * when it submits — it hands off to a job dialog and closes later — so neither
 * "the dialog is still open" nor "the form still accepts input" says anything
 * about whether `pool.export` was called. Asking `pool.query` straight away is
 * no better: it races the job.
 *
 * So the readback is the dashboard itself. Dismissing the dialog and coming
 * back to the pool list is a full navigation, which cannot resolve before the
 * app has sent everything the keypress queued on the same socket; and an
 * export that did start takes the pool off that page. The appliance is then
 * asked directly, which is the claim that actually matters.
 */
async function expectPoolSurvived(page: Page, api: E2eApiClient, pool: string): Promise<void> {
  await page.locator(poolDisconnectLocators.cancel).click();
  await goToStorage(page);

  await expect(page.locator(poolDisconnectLocators.open(pool))).toBeVisible();
  expect(await findPool(api, pool)).toBeDefined();
}
