/**
 * Stories: on a pool's VDEVs page, an admin extends a single-disk vdev into a
 * mirror, from Extend on the disk's ZFS Info card, and detaches a disk from a
 * mirror, from Detach in the same card's menu.
 *
 * Each change is asserted on the page and through `pool.query`, which holds the
 * type of each data vdev and the disks in it.
 *
 * ## Why this spec builds its own pool
 *
 * Both tests change a pool's topology, so neither may use the worker-scoped
 * `pool` fixture other specs share. Each test builds the pool it starts from: one
 * disk for Extend, a two-disk mirror for Detach. The pool is destroyed before and
 * after each test, unconditionally: it holds two disks at some point either way,
 * and `fresh-install` needs nine alike.
 *
 * Not covered: extending a RAIDZ vdev, which is a different dialog, and extending
 * a log, special or dedup vdev.
 */
import { ensurePoolPresent } from '../fixtures/pool';
import {
  ensureMirrorPoolPresent, pickReplacementDisk, readDataVdevs, readMirror,
} from '../fixtures/pool-devices';
import { ensurePoolAbsent, getSelectableDisks, requireUnusedDisks } from '../fixtures/storage';
import {
  detachSelectedDisk, extendSelectedDisk, openVdevsPage, selectDisk, selectMirrorDisk,
} from '../flows/pool-devices';
import { vdevsPageLocators } from '../locators/pool-devices';
import { leavingTestData } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** This spec's own pool. Not a name any other spec looks for. */
const pool = 'e2e_extend_tank';

/**
 * The job ends once the new disk is attached, and `pool.query` may take a moment
 * to report the mirror with both disks ONLINE. This is a ceiling.
 */
const attachTimeoutMs = 60_000;

/** Middleware reads a detached disk back into the unused inventory. */
const inventoryTimeoutMs = 30_000;

/** Disks in device-name order, so a comparison does not depend on ZFS's. */
function byName(a: { disk: string | null }, b: { disk: string | null }): number {
  return (a.disk ?? '').localeCompare(b.disk ?? '');
}

test.beforeEach(async ({ api }) => {
  await ensurePoolAbsent(api, pool);
  // Two for the pool each test ends with, all alike.
  await requireUnusedDisks(api, 2);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`pool "${pool}"`)) {
    return;
  }

  await ensurePoolAbsent(api, pool);
});

test('an admin extends a single-disk vdev into a mirror', async ({ page, api }) => {
  await ensurePoolPresent(api, pool);
  const [vdev] = await readDataVdevs(api, pool);
  expect(vdev?.type, `Pool "${pool}" should start as a single disk.`).toBe('DISK');
  const [original] = vdev?.disks ?? [];
  expect(original?.disk).toBeTruthy();
  const target = { guid: original?.guid ?? '', name: original?.disk ?? '' };
  const newDisk = await pickReplacementDisk(api, target.name);

  await openVdevsPage(page, pool);
  await selectDisk(page, target);
  await extendSelectedDisk(page, newDisk.devname);

  // One data vdev, now a mirror of the original disk and the new one, both ONLINE.
  await expect
    .poll(
      async () => (await readDataVdevs(api, pool)).map(({ type, disks }) => ({
        type,
        disks: disks.map(({ disk, status }) => ({ disk, status })).sort(byName),
      })),
      { timeout: attachTimeoutMs },
    )
    .toEqual([{
      type: 'MIRROR',
      disks: [
        { disk: target.name, status: 'ONLINE' },
        { disk: newDisk.devname, status: 'ONLINE' },
      ].sort(byName),
    }]);

  // Opened again from the dashboard, so the tree is read back from the appliance
  // rather than left as the dialog's reload found it mid-resilver.
  const [mirror] = await readDataVdevs(api, pool);
  const kept = mirror?.disks.find(({ disk }) => disk === target.name);
  const added = mirror?.disks.find(({ disk }) => disk === newDisk.devname);
  await openVdevsPage(page, pool);
  await expect(page.locator(vdevsPageLocators.nodeName(mirror?.guid ?? ''))).toHaveText('MIRROR');
  await page.locator(vdevsPageLocators.node(mirror?.guid ?? '')).click();
  await expect(page.locator(vdevsPageLocators.nodeName(kept?.guid ?? ''))).toHaveText(target.name);
  await expect(page.locator(vdevsPageLocators.nodeName(added?.guid ?? ''))).toHaveText(newDisk.devname);
});

test('an admin detaches a disk from a mirror', async ({ page, api }) => {
  await ensureMirrorPoolPresent(api, pool);
  const mirror = await readMirror(api, pool);
  const [disk, partner] = mirror.disks;
  expect(disk?.disk, `Pool "${pool}" should have two named disks in its mirror.`).toBeTruthy();
  expect(partner?.disk).toBeTruthy();
  const target = { guid: disk?.guid ?? '', name: disk?.disk ?? '' };

  await openVdevsPage(page, pool);
  await selectMirrorDisk(page, mirror.guid, target);
  await detachSelectedDisk(page, target);

  // The mirror is gone, and the disk that stayed is the pool's one data vdev.
  const vdevs = await readDataVdevs(api, pool);
  expect(vdevs.map(({ type, disks }) => ({ type, disks: disks.map(({ disk: name }) => name) }))).toEqual([
    { type: 'DISK', disks: [partner?.disk] },
  ]);

  await expect
    .poll(async () => (await getSelectableDisks(api)).map(({ name }) => name), { timeout: inventoryTimeoutMs })
    .toContain(target.name);

  // Opened again from the dashboard, so the tree is read back from the appliance.
  // ZFS hands the top-level vdev's guid to the disk that takes its place, so the
  // mirror's guid now names the disk that stayed: the node is still there, and
  // reading the disk's name rather than MIRROR is what says the mirror is gone.
  const [stayed] = vdevs;
  await openVdevsPage(page, pool);
  await expect(page.locator(vdevsPageLocators.node(target.guid))).toHaveCount(0);
  await expect(page.locator(vdevsPageLocators.nodeName(stayed?.guid ?? ''))).toHaveText(partner?.disk ?? '');
});
