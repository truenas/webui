/**
 * Stories: an admin manages iSCSI targets and extents on the full iSCSI page, the
 * one the Block (iSCSI) Shares Targets card's title opens, and the appliance holds
 * what they did.
 *
 * On the Targets tab: adding a target with an authorized network and a group that
 * points at a portal, and associating an extent with a target as a LUN and then
 * unlinking it. On the Extents tab: adding a zvol (Device) extent and a File
 * extent, editing one extent beside another, and deleting a File extent with
 * "Remove file?" ticked.
 *
 * The portal, the initiator group, the zvols and every extent or target a test does
 * not create itself are provisioned over the API. Everything is read back over the
 * API too, since the page shows little of what a target or an extent holds.
 */
import {
  ensureIscsiFileExtentPresent, ensureIscsiInitiatorPresent, ensureIscsiPortalPresent, ensureIscsiShareAbsent,
  ensureIscsiTargetPresent, ensureIscsiZvolExtentPresent, findIscsiExtent, findIscsiTarget, findIscsiTargetExtents,
} from '../fixtures/iscsi';
import { directoryExists } from '../fixtures/snapshots';
import {
  datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent, ensureZvolPresent,
} from '../fixtures/storage';
import {
  addIscsiFileExtent, addIscsiTarget, addIscsiZvolExtent, associateIscsiExtent, deleteIscsiFileExtentAndFile,
  editIscsiExtentDescription, removeIscsiExtentAssociation,
} from '../flows/iscsi';
import { iscsiLocators } from '../locators/iscsi';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const mib = 1024 * 1024;

/** The `comment` on the portal and the initiator group a new target's group points at. */
const groupComment = 'e2e-iscsi-tab-group';

/** Added through the Targets tab, never over the API. */
const addedTarget = 'e2e-iscsi-tab-added';

/** A target with nothing attached, and the extent associated with it and then unlinked. */
const lunTarget = 'e2e-iscsi-tab-lun';
const lunExtent = 'e2e-iscsi-tab-lun-extent';

/** Added through the Extents tab: one on a zvol, one on a file. */
const zvolExtent = 'e2e-iscsi-tab-zvol-extent';
const fileExtent = 'e2e-iscsi-tab-file-extent';

/** The extent an edit acts on, and the one beside it that must not change. */
const editedExtent = 'e2e-iscsi-tab-edited';
const keptExtent = 'e2e-iscsi-tab-kept';

/** The File extent a delete acts on, and a second whose file must stay. */
const removedFileExtent = 'e2e-iscsi-tab-removed';
const keptFileExtent = 'e2e-iscsi-tab-file-kept';

/**
 * The zvols the Device extents sit on, one per extent. None of these names is
 * the start of another, since the Device option is matched on its head.
 */
const zvols = {
  lun: 'e2e-iscsi-tab-lun-zvol',
  added: 'e2e-iscsi-tab-new-zvol',
  edited: 'e2e-iscsi-tab-edited-zvol',
  kept: 'e2e-iscsi-tab-kept-zvol',
} as const;

/** Holds every File extent's file, so deleting it takes them all. */
const filesDataset = 'e2e_iscsi_tab_files';

const allTargets = [addedTarget, lunTarget];
const allExtents = [lunExtent, zvolExtent, fileExtent, editedExtent, keptExtent, removedFileExtent, keptFileExtent];

/**
 * Targets first, then extents, then the portal and the initiator group: middleware
 * refuses to delete an extent a target still uses without force, and deleting a
 * portal first would quietly strip the group from the target instead.
 *
 * `ensureIscsiShareAbsent` does each step: it removes the target, the extent, and
 * the portal and initiator group labelled with the name it is given, whichever
 * of them exist. The files go with their dataset, and the zvols last.
 */
async function removeEverything(api: E2eApiClient, pool: string): Promise<void> {
  await runCleanupSteps([
    ...allTargets.map((name): [string, () => Promise<void>] => [
      `remove the iSCSI target ${name}`, () => ensureIscsiShareAbsent(api, name),
    ]),
    ...allExtents.map((name): [string, () => Promise<void>] => [
      `remove the iSCSI extent ${name}`, () => ensureIscsiShareAbsent(api, name),
    ]),
    [`remove the portal and initiator group "${groupComment}"`, () => ensureIscsiShareAbsent(api, groupComment)],
    [`remove the dataset ${pool}/${filesDataset}`, () => ensureDatasetAbsent(api, `${pool}/${filesDataset}`)],
    ...Object.values(zvols).map((zvol): [string, () => Promise<void>] => [
      `remove the zvol ${pool}/${zvol}`, () => ensureDatasetAbsent(api, `${pool}/${zvol}`),
    ]),
  ]);
}

/** Where a File extent's file goes. */
function extentFilePath(pool: string, name: string): string {
  const directory = datasetMountPath(`${pool}/${filesDataset}`);
  return `${directory}/${name}.img`;
}

/** Removed before each test as well as after, so an interrupted run leaves the next one able to start. */
test.beforeEach(async ({ api, pool }) => {
  await removeEverything(api, pool);
});

test.afterEach(async ({ api, pool }) => {
  if (leavingTestData(`the iSCSI targets, extents, portal, initiator group and zvols e2e-iscsi-tab-* on ${pool}`)) {
    return;
  }

  await removeEverything(api, pool);
});

test('an admin adds a target with an authorized network and a portal group, and the appliance has it', async ({
  page, api,
}) => {
  const portal = await ensureIscsiPortalPresent(api, groupComment);
  const initiator = await ensureIscsiInitiatorPresent(api, groupComment);

  await addIscsiTarget(page, {
    name: addedTarget,
    alias: 'Added from the Targets tab',
    network: { address: '10.20.30.0', prefix: 24 },
    portal: { id: portal.id, comment: groupComment },
    initiatorId: initiator.id,
  });

  await expect(page.locator(iscsiLocators.targets.authorizedNetwork(0))).toHaveText('10.20.30.0/24');

  expect(await findIscsiTarget(api, addedTarget)).toMatchObject({
    name: addedTarget,
    alias: 'Added from the Targets tab',
    auth_networks: ['10.20.30.0/24'],
    groups: [{ portal: portal.id, initiator: initiator.id, authmethod: 'NONE' }],
  });
});

test('associating an extent with a LUN ID creates the association, and unlinking removes it', async ({
  page, api, pool,
}) => {
  const lunId = 3;
  await ensureZvolPresent(api, `${pool}/${zvols.lun}`);
  const extent = await ensureIscsiZvolExtentPresent(api, { name: lunExtent, zvol: `${pool}/${zvols.lun}` });
  const target = await ensureIscsiTargetPresent(api, lunTarget);

  await associateIscsiExtent(page, { target: lunTarget, extent: { id: extent.id, name: lunExtent }, lunId });

  await expect(page.locator(iscsiLocators.targets.associatedExtent(extent.id))).toContainText(`LUN ID: ${lunId}`);
  expect(await findIscsiTargetExtents(api, target.id)).toEqual([
    expect.objectContaining({ extent: extent.id, lunid: lunId }),
  ]);

  await removeIscsiExtentAssociation(page, extent.id);

  // Polled: the line can leave the card before the delete has landed.
  await expect.poll(() => findIscsiTargetExtents(api, target.id)).toEqual([]);
  // Unlinking is not deleting: both ends of the association are still there.
  expect(await findIscsiExtent(api, lunExtent)).toMatchObject({ id: extent.id });
  expect(await findIscsiTarget(api, lunTarget)).toMatchObject({ id: target.id });
});

test('a zvol extent added on the Extents tab exists with the settings picked', async ({ page, api, pool }) => {
  const zvol = `${pool}/${zvols.added}`;
  await ensureZvolPresent(api, zvol);

  await addIscsiZvolExtent(page, {
    name: zvolExtent,
    comment: 'Added on a zvol',
    zvol,
    blocksize: 4096,
  });

  await expect(page.locator(iscsiLocators.extents.description(zvolExtent))).toHaveText('Added on a zvol');

  // 4096 rather than the 512 the form opens on, so a form that dropped the pick shows.
  expect(await findIscsiExtent(api, zvolExtent)).toMatchObject({
    name: zvolExtent,
    comment: 'Added on a zvol',
    type: 'DISK',
    disk: `zvol/${zvol}`,
    blocksize: 4096,
  });
});

test('a file extent added on the Extents tab exists, and so does its file', async ({ page, api, pool }) => {
  await ensureDatasetPresent(api, `${pool}/${filesDataset}`);
  const path = extentFilePath(pool, fileExtent);

  await addIscsiFileExtent(page, { name: fileExtent, path, filesize: '16 MiB' });

  await expect(page.locator(iscsiLocators.extents.row(fileExtent))).toBeVisible();

  const extent = await findIscsiExtent(api, fileExtent);
  expect(extent).toMatchObject({ name: fileExtent, type: 'FILE', path });
  // At least what was asked. The form rounds the size up to the block size before
  // it sends it, and on an exact multiple that adds a whole block.
  expect(Number(extent?.filesize)).toBeGreaterThanOrEqual(16 * mib);
  // Middleware made the file, which is what the extent exports.
  expect(await directoryExists(api, path)).toBe(true);
});

test('editing an extent changes only that extent', async ({ page, api, pool }) => {
  const editedZvol = `${pool}/${zvols.edited}`;
  const keptZvol = `${pool}/${zvols.kept}`;
  const edited = 'Edited from the Extents tab';
  await ensureZvolPresent(api, editedZvol);
  await ensureZvolPresent(api, keptZvol);
  await ensureIscsiZvolExtentPresent(api, { name: editedExtent, zvol: editedZvol, comment: 'Before the edit' });
  await ensureIscsiZvolExtentPresent(api, { name: keptExtent, zvol: keptZvol, comment: 'Left alone' });

  await editIscsiExtentDescription(page, editedExtent, edited);

  await expect(page.locator(iscsiLocators.extents.description(editedExtent))).toHaveText(edited);

  // The form submits the whole extent, so what it loaded has to go back the way it came.
  expect(await findIscsiExtent(api, editedExtent)).toMatchObject({
    comment: edited,
    type: 'DISK',
    disk: `zvol/${editedZvol}`,
  });
  // The panel opened from one row's menu; the row beside it must not change.
  expect(await findIscsiExtent(api, keptExtent)).toMatchObject({
    comment: 'Left alone',
    disk: `zvol/${keptZvol}`,
  });
  await expect(page.locator(iscsiLocators.extents.description(keptExtent))).toHaveText('Left alone');
});

test('deleting a file extent with "Remove file?" deletes its file too', async ({ page, api, pool }) => {
  await ensureDatasetPresent(api, `${pool}/${filesDataset}`);
  const removedPath = extentFilePath(pool, removedFileExtent);
  const keptPath = extentFilePath(pool, keptFileExtent);
  await ensureIscsiFileExtentPresent(api, { name: removedFileExtent, path: removedPath, filesize: 16 * mib });
  await ensureIscsiFileExtentPresent(api, { name: keptFileExtent, path: keptPath, filesize: 16 * mib });
  // Otherwise the file's absence afterwards proves nothing.
  expect(await directoryExists(api, removedPath)).toBe(true);

  await deleteIscsiFileExtentAndFile(page, removedFileExtent);

  await expect.poll(() => findIscsiExtent(api, removedFileExtent)).toBeUndefined();
  expect(await directoryExists(api, removedPath)).toBe(false);

  // Only the picked extent's file: the other extent and its file stay.
  expect(await findIscsiExtent(api, keptFileExtent)).toBeDefined();
  expect(await directoryExists(api, keptPath)).toBe(true);
  await expect(page.locator(iscsiLocators.extents.row(keptFileExtent))).toBeVisible();
});
