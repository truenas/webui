/**
 * Stories: an admin creates an iSCSI share with the wizard on the Shares page, and
 * deletes one from its row on the Block (iSCSI) Shares Targets card, and the
 * appliance holds what they did.
 *
 * The wizard is several calls behind one Save — a zvol, an extent on it, a portal,
 * an initiator group, a target, and the association between target and extent —
 * so the create is checked through the API: the zvol, the extent on it, the target,
 * the target's association with the extent and the portal its group points at. The
 * chain is what matters, since a target nothing is attached to exports nothing. The
 * initiator group is not read back.
 *
 * The delete runs beside a second target that must come through untouched, since
 * every row has its own Delete in its own menu. It ticks "Delete associated
 * extents", so the extent has to go with the target, while the zvol it sat on
 * stays: the dialog says volumes are not deleted, and a delete that reached
 * through to the data would be an expensive surprise.
 *
 * A second delete leaves "Delete associated extents" unticked. Then only the
 * target and its association go: the extent stays, under the same id and still
 * on its zvol, for the admin to attach to another target.
 */
import {
  countIscsiTargets, ensureIscsiServiceStopped, ensureIscsiShareAbsent, ensureIscsiSharePresent,
  ensureIscsiTargetPresent, findIscsiExtent, findIscsiPortal, findIscsiTarget, findIscsiTargetExtents,
} from '../fixtures/iscsi';
import {
  datasetMountPath, ensureDatasetAbsent, ensureZvolPresent, findDataset,
} from '../fixtures/storage';
import { createIscsiShareWithWizard, deleteIscsiTarget } from '../flows/iscsi';
import { iscsiLocators } from '../locators/iscsi';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const mib = 1024 * 1024;

/**
 * Created through the wizard, never over the API — that is the thing under test.
 * The wizard gives the extent, the target and the zvol this one name.
 */
const createdName = 'e2e-iscsi-created';

/** Provisioned over the API, on a zvol of the same name, so there is something to delete. */
const targetName = 'e2e-iscsi-target';

/** A target with nothing attached, which must survive whatever is done to the other. */
const bystanderName = 'e2e-iscsi-bystander';

/**
 * Provisioned like {@link targetName}, for the delete that keeps its extent. Its
 * own name, so the orphaned extent is still found, and removed, by name.
 */
const keepExtentName = 'e2e-iscsi-keep-extent';

/** The card lists four targets, by name, before its pager. */
const cardPageSize = 4;

const allNames = [createdName, targetName, bystanderName, keepExtentName];

async function removeEverything(api: E2eApiClient, pool: string): Promise<void> {
  await runCleanupSteps(allNames.flatMap((name): [string, () => Promise<void>][] => [
    [`remove the iSCSI share ${name}`, () => ensureIscsiShareAbsent(api, name)],
    [`remove the zvol ${pool}/${name}`, () => ensureDatasetAbsent(api, `${pool}/${name}`)],
  ]));
}

/**
 * Fails up front when the card cannot show every row a test needs. A fresh
 * appliance holds no targets; failing here says why rather than timing out on a
 * row past the pager.
 */
async function requireRoomOnCard(api: E2eApiClient, adding: number): Promise<void> {
  const existing = await countIscsiTargets(api);
  expect(
    existing + adding <= cardPageSize,
    `the card lists ${cardPageSize} targets, this test adds ${adding}, the appliance has ${existing}`,
  ).toBe(true);
}

/**
 * Removed before each test as well as after, so an interrupted run leaves the
 * next one able to start. The service is stopped because what the wizard asks
 * after Save depends on it.
 */
test.beforeEach(async ({ api, pool }) => {
  await removeEverything(api, pool);
  await ensureIscsiServiceStopped(api);
});

test.afterEach(async ({ api, pool }) => {
  if (leavingTestData(`the iSCSI shares and zvols ${allNames.join(', ')} on ${pool}`)) {
    return;
  }

  await removeEverything(api, pool);
  await ensureIscsiServiceStopped(api);
});

test('an admin creates an iSCSI share with the wizard, and the appliance has one', async ({ page, api, pool }) => {
  const zvol = `${pool}/${createdName}`;
  const listenAddress = '0.0.0.0';
  await requireRoomOnCard(api, 1);

  await createIscsiShareWithWizard(page, {
    name: createdName,
    parentPath: datasetMountPath(pool),
    volsize: '64 MiB',
    listenAddress,
  });

  await expect(page.locator(iscsiLocators.card.name(createdName))).toHaveText(createdName);

  // The zvol the wizard made, at the size it was given in MiB.
  expect(await findDataset(api, zvol)).toMatchObject({
    name: zvol,
    type: 'VOLUME',
    volsize: { parsed: 64 * mib },
  });

  // The extent sits on that zvol.
  const extent = await findIscsiExtent(api, createdName);
  expect(extent).toMatchObject({ name: createdName, type: 'DISK', disk: `zvol/${zvol}` });

  // The target exists, carries the extent as a LUN, and is reachable through the
  // portal the wizard made — the three things that make it a share.
  const target = await findIscsiTarget(api, createdName);
  expect(target).toBeDefined();
  expect(await findIscsiTargetExtents(api, target?.id ?? -1)).toEqual([
    expect.objectContaining({ extent: extent?.id }),
  ]);

  expect(target?.groups).toHaveLength(1);
  const portal = await findIscsiPortal(api, target?.groups?.[0]?.portal ?? -1);
  expect(portal).toMatchObject({ comment: createdName });
  expect(portal?.listen).toEqual([expect.objectContaining({ ip: listenAddress })]);
});

test('deleting a target removes the one that was picked and its extent', async ({ page, api, pool }) => {
  const zvol = `${pool}/${targetName}`;
  await requireRoomOnCard(api, 2);
  await ensureZvolPresent(api, zvol);
  await ensureIscsiSharePresent(api, { name: targetName, zvol });
  const bystanderBefore = await ensureIscsiTargetPresent(api, bystanderName);

  await deleteIscsiTarget(page, targetName, { deleteExtents: true });

  // Polled rather than read once: the row can also be hidden while the card is
  // between loads, which proves nothing.
  await expect.poll(() => findIscsiTarget(api, targetName)).toBeUndefined();
  expect(await findIscsiExtent(api, targetName)).toBeUndefined();
  expect(await findDataset(api, zvol)).toBeDefined();

  // The whole point of the second target: the card looks right either way.
  await expect(page.locator(iscsiLocators.card.row(bystanderName))).toBeVisible();
  expect(await findIscsiTarget(api, bystanderName)).toMatchObject({ id: bystanderBefore.id });
});

test('deleting a target with its extents left unticked keeps the extent and the zvol', async ({
  page, api, pool,
}) => {
  const zvol = `${pool}/${keepExtentName}`;
  await requireRoomOnCard(api, 2);
  await ensureZvolPresent(api, zvol);
  await ensureIscsiSharePresent(api, { name: keepExtentName, zvol });
  const bystanderBefore = await ensureIscsiTargetPresent(api, bystanderName);
  const targetBefore = await findIscsiTarget(api, keepExtentName);
  const extentBefore = await findIscsiExtent(api, keepExtentName);
  expect(targetBefore, 'the target was provisioned').toBeDefined();
  expect(extentBefore, 'the extent was provisioned').toBeDefined();
  // Without this the "no association" read-back below would pass on a target that never had one.
  expect(await findIscsiTargetExtents(api, targetBefore?.id ?? -1)).toHaveLength(1);

  await deleteIscsiTarget(page, keepExtentName, { deleteExtents: false });

  await expect.poll(() => findIscsiTarget(api, keepExtentName)).toBeUndefined();
  // The same extent, not one made again under the same name, still on its zvol.
  expect(await findIscsiExtent(api, keepExtentName)).toMatchObject({
    id: extentBefore?.id,
    type: 'DISK',
    disk: `zvol/${zvol}`,
  });
  expect(await findIscsiTargetExtents(api, targetBefore?.id ?? -1)).toEqual([]);
  expect(await findDataset(api, zvol)).toBeDefined();

  await expect(page.locator(iscsiLocators.card.row(bystanderName))).toBeVisible();
  expect(await findIscsiTarget(api, bystanderName)).toMatchObject({ id: bystanderBefore.id });
});
