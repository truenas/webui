/**
 * Stories: on a pool's VDEVs page, an admin removes the pool's cache, log and
 * spare disks, and removes one of two mirrored data vdevs.
 *
 * Each removal is asserted on the page, by its node and its group leaving the
 * tree, and through `pool.query`, which holds the pool's topology.
 *
 * The UI also reports a removal in the snackbar "Device removed". It is not
 * asserted: the snackbar renders no `data-test`, and a text match is not a
 * selector this suite uses. The tree is reloaded in the same callback that raises
 * it, so the node going says the same thing.
 *
 * ## Why this spec builds its own pool
 *
 * Both tests change a pool's topology, so neither may use the worker-scoped
 * `pool` fixture other specs share. The pool is built in each test, in the shape
 * that test needs, and destroyed before and after each one: it holds five disks or
 * four, and `fresh-install` needs nine alike.
 *
 * Not covered: a pool with a top-level RAIDZ, where Remove is not offered on a
 * data vdev, and special and dedup vdevs.
 */
import { readPoolTopology } from '../fixtures/pool';
import { ensureDevicePoolPresent, readPoolStatus } from '../fixtures/pool-devices';
import { ensurePoolAbsent, getSelectableDisks, requireUnusedDisks } from '../fixtures/storage';
import { openVdevsPage, removeSelectedDevice, selectNode } from '../flows/pool-devices';
import { vdevsPageLocators } from '../locators/pool-devices';
import { leavingTestData } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** This spec's own pool. Not a name any other spec looks for. */
const pool = 'e2e_remove_tank';

/** A removed disk is offered again once middleware has re-read the inventory. */
const diskReleaseTimeoutMs = 60_000;

test.beforeEach(async ({ api }) => {
  await ensurePoolAbsent(api, pool);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`pool "${pool}"`)) {
    return;
  }

  await ensurePoolAbsent(api, pool);
});

test('an admin removes a pool\'s cache, log and spare disks', async ({ page, api }) => {
  await requireUnusedDisks(api, 5);
  await ensureDevicePoolPresent(api, pool, {
    mirrors: 1,
    cache: true,
    log: true,
    spare: true,
  });

  const before = await readPoolTopology(api, pool);
  const [mirror] = before.data;
  const removals = [
    { group: 'cache', guid: before.cache[0]?.guid },
    { group: 'log', guid: before.log[0]?.guid },
    { group: 'spare', guid: before.spare[0]?.guid },
  ] as const;
  expect(mirror, `Pool "${pool}" should have a data mirror.`).toBeDefined();
  for (const { group, guid } of removals) {
    expect(guid, `Pool "${pool}" should have one ${group} disk.`).toBeTruthy();
  }

  await openVdevsPage(page, pool);

  for (const { group, guid } of removals) {
    await expect(page.locator(vdevsPageLocators.group(group))).toBeVisible();
    await selectNode(page, guid ?? '');
    await removeSelectedDevice(page, guid ?? '');
    await expect(page.locator(vdevsPageLocators.group(group))).toBeHidden();
  }

  const after = await readPoolTopology(api, pool);
  expect(after.cache).toEqual([]);
  expect(after.log).toEqual([]);
  expect(after.spare).toEqual([]);

  // The data mirror is the one the pool was built with, both disks and all.
  expect(after.data.map(({ type, guid }) => ({ type, guid }))).toEqual([{ type: 'MIRROR', guid: mirror?.guid }]);
  expect(after.data[0]?.children.map(({ guid }) => guid)).toEqual(mirror?.children.map(({ guid }) => guid));
  expect(await readPoolStatus(api, pool)).toBe('ONLINE');
});

test('an admin removes one of two mirrored data vdevs', async ({ page, api }) => {
  await requireUnusedDisks(api, 4);
  await ensureDevicePoolPresent(api, pool, { mirrors: 2 });

  const [kept, removed] = (await readPoolTopology(api, pool)).data;
  expect(kept?.type).toBe('MIRROR');
  expect(removed?.type).toBe('MIRROR');
  const removedGuid = removed?.guid ?? '';
  const removedDisks = removed?.children.map(({ disk }) => disk) ?? [];
  expect(removedDisks, 'The mirror to remove should have two named disks.').toHaveLength(2);

  await openVdevsPage(page, pool);
  await expect(page.locator(vdevsPageLocators.node(kept?.guid ?? ''))).toBeVisible();

  await selectNode(page, removedGuid);
  await removeSelectedDevice(page, removedGuid);

  // The data group is left with the other mirror.
  await expect(page.locator(vdevsPageLocators.group('data'))).toBeVisible();
  await expect(page.locator(vdevsPageLocators.node(kept?.guid ?? ''))).toBeVisible();

  const data = (await readPoolTopology(api, pool)).data;
  expect(data.map(({ type, guid }) => ({ type, guid }))).toEqual([{ type: 'MIRROR', guid: kept?.guid }]);
  expect(await readPoolStatus(api, pool)).toBe('ONLINE');

  // Both disks of the removed mirror are free for a new vdev again.
  await expect
    .poll(async () => {
      const unused = (await getSelectableDisks(api)).map(({ devname }) => devname);
      return removedDisks.filter((disk) => disk && unused.includes(disk));
    }, { timeout: diskReleaseTimeoutMs })
    .toEqual(removedDisks);
});
