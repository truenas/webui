/**
 * Stories: on the Storage dashboard, an admin turns a pool's Auto TRIM on and
 * off from the Advanced Actions menu in its header, and sets and removes its
 * dedup table quota from Set Quota on the Storage Health card's Deduplication
 * Table line. The app refuses a Custom quota with no value.
 *
 * Both dialogs save through `pool.update`, so every test reads the pool back
 * from `pool.query`, as well as what the card says afterwards.
 *
 * ## Two pools
 *
 * Auto TRIM is set on the worker-scoped `pool` other specs share. This file
 * records its Auto TRIM before the first test and writes that back before and
 * after every test.
 *
 * The Deduplication Table line, and Set Quota on it, need a dedup vdev, which
 * that pool does not have. Those tests build their own pool, as
 * `pool-dedup-prune.e2e.ts` does, and destroy it before and after each one,
 * unconditionally: it holds four disks, and `fresh-install` needs nine alike.
 * Its quota goes with it. Set Quota needs only the vdev, not a table with
 * something in it, so nothing waits for the seed write.
 *
 * Not covered: Prune (`pool-dedup-prune.e2e.ts`), whether TRIM runs, and
 * whether the quota is enforced on writes.
 */
import {
  ensureDedupPoolPresent, readAutotrim, readDedupTableQuota, setAutotrim, setDedupTableQuota,
} from '../fixtures/pool-devices';
import { ensurePoolAbsent, requireUnusedDisks } from '../fixtures/storage';
import {
  chooseDedupQuotaType, openAutotrimDialog, openSetDedupQuota, saveAutotrimDialog, saveDedupQuota,
} from '../flows/storage';
import { errorDialogLocators } from '../locators/dialogs';
import { autotrimLocators, dedupQuotaLocators, pruneDedupLocators } from '../locators/storage';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { errorDialogClose } from '../support/constants';
import { expect, test } from '../support/fixtures';

/** The dedup tests' own pool. Not a name any other spec looks for. */
const dedupPool = 'e2e_dedup_quota_tank';

const oneGiB = 1024 ** 3;

/** Middleware refuses the `pool.update` job, and the error dialog follows its failure. */
const refusalTimeoutMs = 60_000;

test.describe('Auto TRIM on the shared pool', () => {
  /** What the shared pool had before this file touched it. A pool the suite built starts off. */
  let autotrimBefore: 'on' | 'off' = 'off';

  test.beforeAll(async ({ api, pool }) => {
    autotrimBefore = await readAutotrim(api, pool) === 'on' ? 'on' : 'off';
  });

  test.beforeEach(async ({ api, pool }) => {
    await runCleanupSteps([
      [`Auto TRIM on pool "${pool}"`, () => setAutotrim(api, pool, autotrimBefore)],
    ]);
  });

  test.afterEach(async ({ api, pool }) => {
    if (leavingTestData(`Auto TRIM on pool "${pool}"`)) {
      return;
    }

    await runCleanupSteps([
      [`Auto TRIM on pool "${pool}"`, () => setAutotrim(api, pool, autotrimBefore)],
    ]);
  });

  test('an admin turns Auto TRIM on for a pool, and then off', async ({ page, api, pool }) => {
    await setAutotrim(api, pool, 'off');

    const checkbox = page.locator(autotrimLocators.checkbox);
    const line = page.locator(autotrimLocators.line(pool));

    await openAutotrimDialog(page, pool);
    await expect(checkbox).not.toBeChecked();
    await checkbox.click();
    await expect(checkbox).toBeChecked();
    await saveAutotrimDialog(page);

    // The line is rendered only while Auto TRIM is on, so it appearing is the dashboard reloading the pool.
    await expect(line).toHaveText('On');
    expect(await readAutotrim(api, pool)).toBe('on');

    await openAutotrimDialog(page, pool);
    // Ticked from the pool, not left over: the dialog is a new one, built from what the dashboard reloaded.
    await expect(checkbox).toBeChecked();
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
    await saveAutotrimDialog(page);

    await expect(line).toBeHidden();
    expect(await readAutotrim(api, pool)).toBe('off');
  });
});

test.describe('the dedup table quota', () => {
  test.beforeEach(async ({ api }) => {
    await ensurePoolAbsent(api, dedupPool);
    // A data mirror and a dedup mirror, all alike.
    await requireUnusedDisks(api, 4);
    await ensureDedupPoolPresent(api, dedupPool);
  });

  test.afterEach(async ({ api }) => {
    if (leavingTestData(`pool "${dedupPool}"`)) {
      return;
    }

    await ensurePoolAbsent(api, dedupPool);
  });

  test('an admin sets a custom dedup table quota', async ({ page, api }) => {
    await setDedupTableQuota(api, dedupPool, 'auto');

    const tableSize = page.locator(pruneDedupLocators.tableSize(dedupPool));

    await openSetDedupQuota(page, dedupPool);
    await expect(page.locator(dedupQuotaLocators.quotaType)).toContainText('Auto');
    // With the quota at Auto, the line shows the table's size alone.
    await expect(tableSize).not.toContainText('/');

    await chooseDedupQuotaType(page, 'Custom');
    await page.locator(dedupQuotaLocators.quotaValue).fill('1 GiB');
    await saveDedupQuota(page);

    await expect(tableSize).toHaveText(/ \/ 1 GiB$/);
    expect(await readDedupTableQuota(api, dedupPool)).toBe(String(oneGiB));
  });

  test('an admin removes the dedup table quota', async ({ page, api }) => {
    await setDedupTableQuota(api, dedupPool, oneGiB);

    const tableSize = page.locator(pruneDedupLocators.tableSize(dedupPool));
    const quotaType = page.locator(dedupQuotaLocators.quotaType);

    await openSetDedupQuota(page, dedupPool);
    // The seeded quota, on the line behind the dialog and patched into the form.
    await expect(tableSize).toHaveText(/ \/ 1 GiB$/);
    await expect(quotaType).toContainText('Custom');
    await expect(page.locator(dedupQuotaLocators.quotaValue)).toHaveValue('1 GiB');

    await chooseDedupQuotaType(page, 'None');
    await saveDedupQuota(page);

    await expect(tableSize).not.toContainText('/');
    // The dialog maps `'0'` to None. Any other reading of "no quota" reopens it as Custom.
    expect(await readDedupTableQuota(api, dedupPool)).toBe('0');

    await openSetDedupQuota(page, dedupPool);
    await expect(quotaType).toContainText('None');
  });

  test('a Custom quota with no value is refused, and nothing is saved', async ({ page, api }) => {
    await setDedupTableQuota(api, dedupPool, 'auto');

    await openSetDedupQuota(page, dedupPool);
    await chooseDedupQuotaType(page, 'Custom');
    // `auto` parses to no number, so Custom Quota starts empty.
    await expect(page.locator(dedupQuotaLocators.quotaValue)).toHaveValue('');

    // The dialog sends `CUSTOM` with no value: it has no required validator on this path. Middleware refuses it.
    await page.locator(dedupQuotaLocators.save).click();
    await expect(page.locator(errorDialogLocators.message)).toContainText(
      'required when Deduplication Table Quota is set to CUSTOM',
      { timeout: refusalTimeoutMs },
    );
    await page.locator(errorDialogClose).click();
    await expect(page.locator(errorDialogLocators.title)).toBeHidden();
    // A refusal leaves the dialog open; a save would have closed it.
    await expect(page.locator(dedupQuotaLocators.title)).toBeVisible();

    expect(await readDedupTableQuota(api, dedupPool)).toBe('auto');
  });
});
