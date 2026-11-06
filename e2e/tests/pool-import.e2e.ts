/**
 * Story: an admin imports an exported pool from the storage dashboard's Import Pool panel.
 * The pool is exported over the API without `destroy`, so `pool.import_find` offers it. Afterwards `pool.query`
 * must list it `ONLINE` and `disk.details` must no longer report its disk as carrying an exported pool.
 * `e2e_import_tank` is this spec's own; a disk left carrying it exported is one the wizard won't offer
 * (`getSelectableDisks`), so it's removed before and after each test: destroyed if imported, its disk wiped if not.
 */
import { ensureDiskWithExportedPool, ensureExportedPoolGone, findDisksCarryingExportedPool } from '../fixtures/disks';
import { findPool } from '../fixtures/storage';
import { importPool } from '../flows/storage';
import { poolCardLocators } from '../locators/storage';
import { leavingTestData } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Built, exported and imported here. Not a name any other spec looks for. */
const pool = 'e2e_import_tank';

/** The dashboard reloads every pool and its disks after an import. */
const dashboardReloadTimeoutMs = 60_000;

test.beforeEach(async ({ api }) => {
  await ensureExportedPoolGone(api, pool);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`pool "${pool}" and any disk still carrying it`)) {
    return;
  }

  await ensureExportedPoolGone(api, pool);
});

test('an admin imports an exported pool, and it is back online on the dashboard', async ({ page, api }) => {
  const disk = await ensureDiskWithExportedPool(api, pool);

  // The starting state the import has to change: no such pool, and its disk
  // still carrying it.
  expect(await findPool(api, pool)).toBeUndefined();
  expect(await findDisksCarryingExportedPool(api, pool)).toEqual([disk]);

  await importPool(page, pool);

  // The dashboard reloads when the panel reports success, without a navigation.
  await expect(page.locator(poolCardLocators.name(pool))).toHaveText(pool, { timeout: dashboardReloadTimeoutMs });

  expect((await findPool(api, pool))?.status).toBe('ONLINE');
  expect(await findDisksCarryingExportedPool(api, pool)).toEqual([]);
});
