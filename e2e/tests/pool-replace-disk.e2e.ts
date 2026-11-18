/**
 * Story: on a pool's VDEVs page, an admin replaces one disk of a mirror with an
 * unused disk, from Replace on the disk's Disk Info card.
 *
 * The change is asserted on the page and through `pool.query`, which holds the
 * mirror's disks and their ZFS status. The page is left open through the resilver,
 * which ZFS finishes after the dialog has closed, so the page has to follow it on
 * its own: the old disk leaves the tree and the new one, in its place, is selected.
 *
 * ## Why this spec builds its own pool
 *
 * Replacing a disk changes the pool's topology, so it may not use the
 * worker-scoped `pool` fixture other specs share. The pool is a two-disk mirror,
 * as in `pool-devices.e2e.ts`, built before the test and destroyed before and
 * after it, unconditionally: it holds two disks, the replacement takes a third,
 * and `fresh-install` needs nine alike.
 *
 * Not covered: Force, for a replacement that carries data or another pool's
 * labels, and replacing a disk in a RAIDZ vdev, which is the same dialog.
 */
import {
  ensureMirrorPoolPresent, pickReplacementDisk, readMirror, readPoolStatus,
} from '../fixtures/pool-devices';
import { ensurePoolAbsent, getSelectableDisks, requireUnusedDisks } from '../fixtures/storage';
import { openVdevsPage, replaceSelectedDisk, selectMirrorDisk } from '../flows/pool-devices';
import { vdevsPageLocators } from '../locators/pool-devices';
import { leavingTestData } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** This spec's own pool. Not a name any other spec looks for. */
const pool = 'e2e_replace_tank';

/**
 * The job ends once the new disk is attached, and ZFS then resilvers onto it and
 * detaches the old one. On an empty pool that is quick; this is a ceiling.
 */
const resilverTimeoutMs = 60_000;

/** Middleware reads the old disk back into the unused inventory once it is detached. */
const inventoryTimeoutMs = 30_000;

/** Middleware sends the detach once ZFS has made it, and the page reads the pool again. A ceiling only. */
const liveUpdateTimeoutMs = 30_000;

/** Mirror members in device-name order, so the comparison does not depend on ZFS's. */
function byName(a: { name?: string | null }, b: { name?: string | null }): number {
  return (a.name ?? '').localeCompare(b.name ?? '');
}

test.beforeEach(async ({ api }) => {
  await ensurePoolAbsent(api, pool);
  // Two for the mirror and one to replace with, all alike.
  await requireUnusedDisks(api, 3);
  await ensureMirrorPoolPresent(api, pool);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`pool "${pool}"`)) {
    return;
  }

  await ensurePoolAbsent(api, pool);
});

test('an admin replaces a disk in a mirror with an unused disk', async ({ page, api }) => {
  const mirror = await readMirror(api, pool);
  const [disk, partner] = mirror.disks;
  expect(disk?.disk, `Pool "${pool}" should have two named disks in its mirror.`).toBeTruthy();
  expect(partner?.disk).toBeTruthy();
  const target = { guid: disk?.guid ?? '', name: disk?.disk ?? '' };
  const replacement = await pickReplacementDisk(api, target.name);

  await openVdevsPage(page, pool);
  await selectMirrorDisk(page, mirror.guid, target);
  await replaceSelectedDisk(page, replacement.devname);

  // The mirror holds the partner and the new disk, the old one is gone from it,
  // and the resilver has finished: both members and the pool are ONLINE.
  await expect
    .poll(
      async () => (await readMirror(api, pool)).disks.map(({ disk: name, status }) => ({ name, status })).sort(byName),
      { timeout: resilverTimeoutMs },
    )
    .toEqual([
      { name: partner?.disk, status: 'ONLINE' },
      { name: replacement.name, status: 'ONLINE' },
    ].sort(byName));
  const after = await readMirror(api, pool);
  expect(after.disks.map(({ guid }) => guid)).not.toContain(target.guid);
  expect(await readPoolStatus(api, pool)).toBe('ONLINE');

  await expect
    .poll(async () => (await getSelectableDisks(api)).map(({ name }) => name), { timeout: inventoryTimeoutMs })
    .toContain(target.name);

  // Not opened again: the page has stayed open since the dialog closed, and follows the
  // pool on its own. The old disk was selected, so the new one in its place is now.
  const added = after.disks.find(({ disk: name }) => name === replacement.name);
  await expect(page.locator(vdevsPageLocators.node(target.guid))).toHaveCount(0, { timeout: liveUpdateTimeoutMs });
  await expect(page.locator(vdevsPageLocators.nodeName(added?.guid ?? ''))).toHaveText(replacement.devname);
  await expect(page).toHaveURL(new RegExp(`/vdevs/${added?.guid}$`));
  await expect(page.locator(vdevsPageLocators.detailsTitle)).toHaveText(replacement.devname);
});
