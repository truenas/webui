/**
 * Stories: an admin builds a pool's mirror from two disks they choose in the pool wizard's Manual
 * Disk Selection dialog, and the appliance builds it from exactly those disks; and taking a disk
 * back out of a vdev makes the vdev invalid again, while Cancel leaves the step as it was.
 *
 * Every other wizard spec lets Automated Disk Selection pick the disks. Only the names of the
 * disks coming back from `pool.query` show that the ones dragged in the dialog are the ones that
 * reached `pool.create`, so the first test picks two disks from the end of the unused list and
 * reads their names back.
 *
 * The disks are dragged with HTML5 drag and drop, which the dialog takes from `ngx-drag-drop`.
 * Nothing on screen confirms a drop, so after every drag a test checks where the disk is now.
 *
 * The first test owns its pool by name. Both names are removed before and after every test,
 * whatever happened, because a pool left behind holds its disks.
 *
 * Not covered: the dialog's disk filters, which show nothing of interest on identical CI disks;
 * manual selection on the other vdev steps; Inspect VDEVs; and enclosure grouping, which needs
 * enclosure hardware.
 */
import { readPoolTopology } from '../fixtures/pool';
import {
  ensurePoolAbsent, getSelectableDisks, requireUnusedDisks, type UnusedDisk,
} from '../fixtures/storage';
import {
  dragDisk, goToReview, openManualDiskSelection, openPoolWizard, selectOption, submitPool,
} from '../flows/storage';
import { manualDiskSelectionLocators, poolCardLocators, poolWizardLocators } from '../locators/storage';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const dialog = manualDiskSelectionLocators;

const manualPool = 'e2e_wizard_manual';
const editPool = 'e2e_wizard_manual_edit';
const pools = [manualPool, editPool];

/** The `CreateVdevLayout` value the dialog keys its vdev ids by, and the type `pool.query` reports. */
const mirror = 'MIRROR';
const tooFewDisksError = 'At least 2 disk(s) are required';

/**
 * Two unused disks of one type and size, taken from the end of the list rather than the start.
 * Alike, so that the dialog raises no "Mixing disks of different sizes" error of its own.
 */
function pickTwoAlikeDisks(disks: UnusedDisk[]): [UnusedDisk, UnusedDisk] {
  const fromTheEnd = [...disks].reverse();
  for (const [index, disk] of fromTheEnd.entries()) {
    const partner = fromTheEnd.slice(index + 1).find((other) => (
      other.type === disk.type && other.size === disk.size
    ));
    if (partner) {
      return [partner, disk];
    }
  }

  throw new Error(`This test needs two unused disks of one type and size, and the appliance offers ${disks.length}.`);
}

test.beforeEach(async ({ api }) => {
  for (const pool of pools) {
    await ensurePoolAbsent(api, pool);
  }
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the pools ${pools.join(', ')}`)) {
    return;
  }

  await runCleanupSteps(pools.map((pool): [string, () => Promise<void>] => [
    `remove the pool "${pool}"`, () => ensurePoolAbsent(api, pool),
  ]));
});

test('an admin builds a mirror from two chosen disks, and the pool is made of exactly those', async ({ page, api }) => {
  await requireUnusedDisks(api, 2);
  const [first, second] = pickTwoAlikeDisks(await getSelectableDisks(api));

  await openPoolWizard(page, manualPool);
  await selectOption(page, poolWizardLocators.layout, poolWizardLocators.layoutOption('Mirror'));
  await openManualDiskSelection(page, 'data');

  const vdevError = page.locator(dialog.vdevError(mirror, 1));
  const save = page.locator(dialog.save);

  await page.locator(dialog.add).click();
  await expect(vdevError).toContainText(tooFewDisksError);
  await expect(save).toBeDisabled();

  await dragDisk(page, dialog.unusedDiskDrag(first.name), dialog.vdevDropzone(mirror, 1));
  await expect(page.locator(dialog.vdevDisk(first.name))).toBeVisible();
  await expect(page.locator(dialog.unusedDisk(first.name))).toHaveCount(0);
  // One disk is still short of a mirror.
  await expect(vdevError).toContainText(tooFewDisksError);
  await expect(save).toBeDisabled();

  await dragDisk(page, dialog.unusedDiskDrag(second.name), dialog.vdevDropzone(mirror, 1));
  await expect(page.locator(dialog.vdevDisk(second.name))).toBeVisible();
  await expect(vdevError).toHaveCount(0);
  await expect(page.locator(dialog.vdevCapacityEstimate(mirror, 1))).toBeVisible();
  await expect(save).toBeEnabled();

  await save.click();
  await expect(page.locator(dialog.title)).toBeHidden();
  // The step now shows the saved manual layout instead of Automated Disk Selection.
  await expect(page.locator(poolWizardLocators.manualSelectionMessage('data'))).toBeVisible();

  await goToReview(page, 'data');
  // A manual layout is summarised by its vdev count alone (`TopologyCategoryDescriptionPipe`).
  await expect(page.locator(poolWizardLocators.reviewCategory('data'))).toContainText('Manual layout | 1 VDEVs');

  await submitPool(page);
  await expect(page.locator(poolCardLocators.dataVdevs(manualPool))).toContainText('1 x MIRROR | 2 wide');

  const topology = await readPoolTopology(api, manualPool);
  expect(topology.data).toHaveLength(1);
  const [vdev] = topology.data;
  expect(vdev?.type).toBe(mirror);
  expect(vdev?.children).toHaveLength(2);
  expect(new Set(vdev?.children.map((child) => child.disk))).toEqual(new Set([first.devname, second.devname]));
});

test('removing a disk invalidates the vdev again, and Cancel keeps the automated selection', async ({ page, api }) => {
  await requireUnusedDisks(api, 2);
  const [first, second] = pickTwoAlikeDisks(await getSelectableDisks(api));

  await openPoolWizard(page, editPool);
  await selectOption(page, poolWizardLocators.layout, poolWizardLocators.layoutOption('Mirror'));
  await openManualDiskSelection(page, 'data');

  const vdevError = page.locator(dialog.vdevError(mirror, 1));
  const save = page.locator(dialog.save);

  await page.locator(dialog.add).click();
  await dragDisk(page, dialog.unusedDiskDrag(first.name), dialog.vdevDropzone(mirror, 1));
  await expect(page.locator(dialog.vdevDisk(first.name))).toBeVisible();
  await dragDisk(page, dialog.unusedDiskDrag(second.name), dialog.vdevDropzone(mirror, 1));
  await expect(page.locator(dialog.vdevDisk(second.name))).toBeVisible();
  await expect(save).toBeEnabled();

  await dragDisk(page, dialog.vdevDisk(second.name), dialog.unusedDisksDropzone);
  await expect(page.locator(dialog.unusedDisk(second.name))).toBeVisible();
  await expect(page.locator(dialog.vdevDisk(second.name))).toHaveCount(0);
  await expect(vdevError).toContainText(tooFewDisksError);
  await expect(save).toBeDisabled();

  await page.locator(dialog.deleteVdev(mirror, 1)).click();
  await expect(page.locator(dialog.vdevDropzone(mirror, 1))).toHaveCount(0);
  // The disk it still held goes back to the unused list with it.
  await expect(page.locator(dialog.unusedDisk(first.name))).toBeVisible();

  await page.locator(dialog.cancel).click();
  await expect(page.locator(dialog.title)).toBeHidden();
  // Nothing was saved: the step still offers Automated Disk Selection, not a manual layout.
  await expect(page.locator(poolWizardLocators.width('data'))).toBeVisible();
  await expect(page.locator(poolWizardLocators.manualSelectionMessage('data'))).toHaveCount(0);
});
