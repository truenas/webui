/**
 * Story: a configured pool that did not import at boot (its SED disks were locked, now unlocked) is imported
 * again from the UI. Middleware keeps it in `pool.query` as OFFLINE and drops `LOCKED_SED_DISKS` once the disks
 * unlock, so the dashboard offers Import Again for any offline pool, and the Import Pool panel adds it from
 * `pool.query` (`pool.import_find` skips database pools); both run `pool.reimport`. A VM has no SED disks to
 * lock, so `takePoolOffline` exports at the ZFS level only. `e2e_reimport_tank` is removed around each test.
 */
import { ensureExportedPoolGone } from '../fixtures/disks';
import { ensurePoolPresent } from '../fixtures/pool';
import { findPool, takePoolOffline } from '../fixtures/storage';
import { goToStorage } from '../flows/navigation';
import { importPool } from '../flows/storage';
import { offlinePoolLocators, poolCardLocators } from '../locators/storage';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Built and taken offline here. Not a name any other spec looks for. */
const pool = 'e2e_reimport_tank';

/** `pool.reimport` imports, mounts and restarts services, then the dashboard reloads every pool. */
const reimportTimeoutMs = 90_000;

async function cleanUp(api: E2eApiClient): Promise<void> {
  await runCleanupSteps([
    [`remove pool "${pool}" and wipe any disk still carrying it`, () => ensureExportedPoolGone(api, pool)],
  ]);
}

test.beforeEach(async ({ api }) => {
  await cleanUp(api);

  await ensurePoolPresent(api, pool);
  await takePoolOffline(api, pool);
  expect((await findPool(api, pool))?.status).toBe('OFFLINE');
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`pool "${pool}" and any disk still carrying it`)) {
    return;
  }

  await cleanUp(api);
});

test('an offline pool is imported again from its card on the Storage Dashboard', async ({ page, api }) => {
  await goToStorage(page);

  const importAgain = page.locator(offlinePoolLocators.importAgain(pool));
  await expect(importAgain).toBeVisible({ timeout: reimportTimeoutMs });
  await importAgain.click();

  // The banner goes once the reloaded pool is no longer offline.
  await expect(importAgain).toBeHidden({ timeout: reimportTimeoutMs });
  await expect(page.locator(poolCardLocators.name(pool))).toHaveText(pool);
  expect((await findPool(api, pool))?.status).toBe('ONLINE');
});

test('an offline pool is offered, and imported again, by the Import Pool panel', async ({ page, api }) => {
  const before = await findPool(api, pool);

  await importPool(page, pool);

  await expect(page.locator(offlinePoolLocators.importAgain(pool))).toBeHidden({ timeout: reimportTimeoutMs });
  const after = await findPool(api, pool);
  expect(after?.status).toBe('ONLINE');
  // Re-imported in place, not added as a second pool the way `pool.import_pool` would.
  expect(after?.id).toBe(before?.id);
});
