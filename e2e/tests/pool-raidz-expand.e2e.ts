/**
 * Story: on a pool's VDEVs page, an admin adds a fourth disk to a three-disk
 * RAIDZ1 vdev with Extend, and ZFS widens the vdev onto it.
 *
 * The change is asserted on the page and through `pool.query`, which holds the
 * vdev's type and its disks.
 *
 * ## Why this spec builds its own pool
 *
 * The test changes a pool's topology, so it may not use the worker-scoped `pool`
 * fixture other specs share. The pool here is one RAIDZ1 data vdev of three disks,
 * built over the API so a broken wizard does not fail this test. It is destroyed
 * and built again before the test, so a vdev an interrupted run widened is never
 * what it starts from, and destroyed after it: it holds four disks, and
 * `fresh-install` needs nine alike.
 *
 * `pool.attach` on a RAIDZ vdev answers only once ZFS reports the expansion
 * finished, so the pool is settled by the time the dialog closes, and teardown
 * does not export it mid-expansion.
 *
 * Not covered: RAIDZ2 and RAIDZ3, which take the same path, and extending by more
 * than one disk.
 */
import { readPoolTopology } from '../fixtures/pool';
import { createRaidzPool, readFirstDataVdev, readPoolStatus } from '../fixtures/pool-devices';
import { ensurePoolAbsent, requireUnusedDisks } from '../fixtures/storage';
import { extendSelectedRaidz, openVdevsPage, selectNode } from '../flows/pool-devices';
import { vdevsPageLocators } from '../locators/pool-devices';
import { leavingTestData } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** This spec's own pool. Not a name any other spec looks for. */
const pool = 'e2e_raidz_expand_tank';

/** The unused disk `createRaidzPool` left over, alike to the vdev's three. */
let newDisk = '';

test.beforeEach(async ({ api }) => {
  await ensurePoolAbsent(api, pool);
  await requireUnusedDisks(api, 4);
  newDisk = await createRaidzPool(api, pool);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`pool "${pool}"`)) {
    return;
  }

  await ensurePoolAbsent(api, pool);
});

test('an admin adds a fourth disk to a three-disk RAIDZ1 vdev', async ({ page, api }) => {
  const before = await readFirstDataVdev(api, pool);
  expect(before.type).toBe('RAIDZ1');
  expect(before.disks).toHaveLength(3);
  const members = before.disks.map(({ disk }) => disk ?? '');
  expect(members, 'The disk to add should not already be in the vdev.').not.toContain(newDisk);

  await openVdevsPage(page, pool);
  await selectNode(page, before.guid);
  await expect(page.locator(vdevsPageLocators.nodeName(before.guid))).toHaveText('RAIDZ1');

  await extendSelectedRaidz(page, newDisk);

  // The same vdev, one disk wider: not a second vdev beside it.
  const after = await readFirstDataVdev(api, pool);
  expect((await readPoolTopology(api, pool)).data).toHaveLength(1);
  expect(after.guid).toBe(before.guid);
  expect(after.type).toBe('RAIDZ1');
  expect(after.disks.map(({ disk }) => disk ?? '').sort((a, b) => a.localeCompare(b)))
    .toEqual([...members, newDisk].sort((a, b) => a.localeCompare(b)));
  expect(after.disks.map(({ status }) => status)).toEqual(['ONLINE', 'ONLINE', 'ONLINE', 'ONLINE']);
  expect(await readPoolStatus(api, pool)).toBe('ONLINE');

  // The tree reloads once the dialog has closed, with the vdev still selected and
  // so still expanded: all four disks under it by device name, the new one included.
  const vdev = page.locator(vdevsPageLocators.node(before.guid));
  await Promise.all(after.disks.map((disk) => (
    expect(vdev.locator(vdevsPageLocators.nodeName(disk.guid))).toHaveText(disk.disk ?? '')
  )));
});
