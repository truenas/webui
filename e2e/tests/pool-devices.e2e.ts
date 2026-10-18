/**
 * Stories: on a pool's VDEVs page, an admin takes a disk offline and brings it
 * back, and adds a spare to the pool.
 *
 * Each change is asserted on the page and through `pool.query`, which holds each
 * disk's ZFS status and the pool's spares.
 *
 * ## Why this spec builds its own pool
 *
 * Both tests change a pool's topology, so neither may use the worker-scoped
 * `pool` fixture other specs share. The pool here is a two-disk mirror, because
 * taking a disk offline needs a vdev that survives losing it: on a one-disk stripe
 * ZFS refuses. It is destroyed and built again before each test, so a spare or an
 * offline disk an interrupted run left behind is never what a test starts from,
 * and destroyed after each one: it holds two disks, three with its spare, and
 * `fresh-install` needs nine alike.
 *
 * Replace is `pool-replace-disk.e2e.ts`. Not covered: Extend, Detach and Remove, and
 * the other kinds of vdev the wizard adds (log, cache, special, dedup, more data).
 */
import { ensureMirrorPoolPresent, listSpares, readMirror, readPoolStatus } from '../fixtures/pool-devices';
import { ensurePoolAbsent, getSelectableDisks } from '../fixtures/storage';
import {
  addOneSpare, openVdevsPage, selectMirrorDisk, setSelectedDiskState,
} from '../flows/pool-devices';
import { vdevsPageLocators } from '../locators/pool-devices';
import { leavingTestData } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** This spec's own pool. Not a name any other spec looks for. */
const pool = 'e2e_devices_tank';

/** ZFS brings an onlined disk back by resilvering what it missed, which on an empty pool is quick. */
const resilverTimeoutMs = 60_000;

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

test('an admin takes a disk in a mirror offline and brings it back online', async ({ page, api }) => {
  const mirror = await readMirror(api, pool);
  const [disk, partner] = mirror.disks;
  expect(disk?.disk, `Pool "${pool}" should have two named disks in its mirror.`).toBeTruthy();
  expect(partner).toBeDefined();
  const target = { guid: disk?.guid ?? '', name: disk?.disk ?? '' };

  await openVdevsPage(page, pool);
  await selectMirrorDisk(page, mirror.guid, target);
  await expect(page.locator(vdevsPageLocators.nodeStatus(target.guid))).toHaveText('ONLINE');

  await setSelectedDiskState(page, target, 'OFFLINE');

  // The other half of the mirror carries the pool, which is degraded rather than lost.
  expect((await readMirror(api, pool)).disks.map(({ guid, status }) => ({ guid, status }))).toEqual([
    { guid: target.guid, status: 'OFFLINE' },
    { guid: partner?.guid, status: 'ONLINE' },
  ]);
  expect(await readPoolStatus(api, pool)).toBe('DEGRADED');

  await setSelectedDiskState(page, target, 'ONLINE');

  await expect
    .poll(async () => (await readMirror(api, pool)).disks.map(({ status }) => status), { timeout: resilverTimeoutMs })
    .toEqual(['ONLINE', 'ONLINE']);
  await expect.poll(() => readPoolStatus(api, pool), { timeout: resilverTimeoutMs }).toBe('ONLINE');
});

test('an admin adds a spare to a pool, and the VDEVs page lists it', async ({ page, api }) => {
  const unused = (await getSelectableDisks(api)).map(({ devname }) => devname);
  expect(unused.length, 'The appliance needs an unused disk to add as a spare.').toBeGreaterThan(0);
  expect(await listSpares(api, pool)).toEqual([]);

  await openVdevsPage(page, pool);
  await expect(page.locator(vdevsPageLocators.group('spare'))).toBeHidden();

  await addOneSpare(page);

  const spares = await listSpares(api, pool);
  expect(spares).toHaveLength(1);
  const [spare] = spares;
  // A disk that was unused before, not one of the mirror's.
  expect(unused).toContain(spare?.disk);

  // Opened again from the dashboard, where the wizard left, so the tree is read
  // back from the appliance.
  await openVdevsPage(page, pool);
  await expect(page.locator(vdevsPageLocators.group('spare'))).toBeVisible();
  await expect(page.locator(vdevsPageLocators.nodeName(spare?.guid ?? ''))).toHaveText(spare?.disk ?? '');
  await expect(page.locator(vdevsPageLocators.nodeStatus(spare?.guid ?? ''))).toHaveText(spare?.status ?? '');
});
