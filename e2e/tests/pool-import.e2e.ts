/**
 * Story: an admin imports a pool that was exported, from the storage dashboard.
 *
 * The pool is built and exported over the API without `destroy`, so its labels
 * stay on its disk and `pool.import_find` offers it. The import itself is the
 * UI's: the dashboard's Import Pool button, the pool picked by name from the
 * panel's select, and Import.
 *
 * Each claim is settled through the API as well as on screen. `pool.query` has
 * to list the pool `ONLINE`, and `disk.details` must no longer report its disk as
 * carrying an exported pool. A card on the dashboard is the UI's half.
 *
 * ## Why this spec builds its own pool
 *
 * Exporting the worker-scoped `pool` fixture would pull it from under every
 * other spec in the worker. `e2e_import_tank` is this spec's own, and a disk
 * left carrying it exported is one the pool wizard will not offer
 * (`getSelectableDisks`), so it is removed before and after each test whatever
 * state it was left in: destroyed if imported, its disk wiped if not.
 *
 * Not covered: locked SED disks before the search, and a pool with an encrypted
 * root, which the panel offers to unlock after the import.
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
