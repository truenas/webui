/**
 * Stories: on a pool's VDEVs page an admin takes a disk offline and back, and adds a spare; each checked on the
 * page and through `pool.query`. Topology changes rule out the shared `pool` fixture, so the spec builds a two-disk
 * mirror (ZFS will not offline a stripe's only disk), rebuilt before each test so leftover spares or offline disks
 * never carry over, and destroyed after, since `fresh-install` needs nine alike. Replace is
 * `pool-replace-disk.e2e.ts`; Extend and Detach are `pool-extend-detach.e2e.ts`.
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
