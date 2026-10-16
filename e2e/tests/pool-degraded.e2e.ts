/**
 * Stories: the Storage dashboard tells an admin that a pool has lost redundancy,
 * and tells them again once it is repaired.
 *
 * The Storage Health card composes its line from the pool's status and its error
 * count, and picks a warning or a safe icon beside it. The VDEVs page shows ZFS's
 * own status for each vdev and disk.
 *
 * ## Why the disk goes offline over the API
 *
 * Taking a disk offline is the setup here, not the subject: `pool-devices.e2e.ts`
 * already drives it from the VDEVs page. What this spec owns is what the dashboard
 * says about the pool afterwards.
 *
 * ## Why this spec builds its own pool
 *
 * A degraded pool is a changed topology, so the worker-scoped `pool` fixture other
 * specs share is out. The pool is a two-disk mirror, because ZFS refuses to take
 * the only disk of a stripe offline. It is destroyed and built again before each
 * test, so a disk an interrupted run left offline is never the starting state, and
 * destroyed after each one. A degraded pool exports like any other.
 *
 * Not covered: the `VolumeStatus` alert, which middleware raises on its own
 * schedule, and faulted pools, which need a disk taken away from the VM.
 */
import {
  ensureMirrorPoolPresent, readMirror, readPoolStatus, setPoolDiskState,
} from '../fixtures/pool-devices';
import { ensurePoolAbsent } from '../fixtures/storage';
import { goToStorage } from '../flows/navigation';
import { openVdevsPage } from '../flows/pool-devices';
import { vdevsPageLocators } from '../locators/pool-devices';
import { poolHealthLocators } from '../locators/storage';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** This spec's own pool. Not a name any other spec looks for. */
const pool = 'e2e_degraded_tank';

/** ZFS brings an onlined disk back by resilvering what it missed, which on an empty pool is quick. */
const resilverTimeoutMs = 60_000;

/** The dashboard loads every pool and its topology before a card renders. */
const dashboardTimeoutMs = 30_000;

/** The mirror's guid and the guid of the disk taken offline in it. */
interface DegradedMirror {
  mirrorGuid: string;
  diskGuid: string;
}

/** Takes the mirror's first disk offline and waits for the pool to say it is degraded. */
async function degradeMirror(api: E2eApiClient): Promise<DegradedMirror> {
  const mirror = await readMirror(api, pool);
  const [disk] = mirror.disks;
  if (!disk) {
    throw new Error(`Pool "${pool}" reports no disks in its mirror.`);
  }

  await setPoolDiskState(api, pool, disk.guid, 'OFFLINE');
  await expect.poll(() => readPoolStatus(api, pool), { timeout: resilverTimeoutMs }).toBe('DEGRADED');

  return { mirrorGuid: mirror.guid, diskGuid: disk.guid };
}

test.beforeEach(async ({ api }) => {
  await ensurePoolAbsent(api, pool);
  await ensureMirrorPoolPresent(api, pool);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`pool "${pool}"`)) {
    return;
  }

  await ensurePoolAbsent(api, pool);
});

test('a mirror with a disk offline shows as degraded on the dashboard and its VDEVs', async ({ page, api }) => {
  const { mirrorGuid, diskGuid } = await degradeMirror(api);

  await goToStorage(page);
  await expect(page.locator(poolHealthLocators.status(pool))).toContainText('Degraded', {
    timeout: dashboardTimeoutMs,
  });
  await expect(page.locator(poolHealthLocators.icon(pool, 'warn'))).toBeVisible();
  await expect(page.locator(poolHealthLocators.icon(pool, 'safe'))).toBeHidden();

  await openVdevsPage(page, pool);
  await expect(page.locator(vdevsPageLocators.nodeStatus(mirrorGuid))).toHaveText('DEGRADED');
  // The tree opens a vdev with a child that is not ONLINE on its own; selecting it keeps it open.
  await page.locator(vdevsPageLocators.node(mirrorGuid)).click();
  await expect(page.locator(vdevsPageLocators.nodeStatus(diskGuid))).toHaveText('OFFLINE');
});

test('a repaired mirror shows as online again on the dashboard', async ({ page, api }) => {
  const { diskGuid } = await degradeMirror(api);

  await setPoolDiskState(api, pool, diskGuid, 'ONLINE');
  await expect.poll(() => readPoolStatus(api, pool), { timeout: resilverTimeoutMs }).toBe('ONLINE');

  // Reached afresh, so the card is read from the repaired pool.
  await goToStorage(page);
  await expect(page.locator(poolHealthLocators.status(pool))).toHaveText('Online, no errors.', {
    timeout: dashboardTimeoutMs,
  });
  await expect(page.locator(poolHealthLocators.icon(pool, 'safe'))).toBeVisible();
  await expect(page.locator(poolHealthLocators.icon(pool, 'warn'))).toBeHidden();
});
