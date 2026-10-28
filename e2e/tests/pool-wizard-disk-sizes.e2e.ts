/**
 * Stories: on an appliance with unused disks of more than one size, the pool wizard offers one
 * Disk Size per size; "Treat Disk Size as Minimum" lets larger disks fill a vdev built for the
 * smaller size, and the appliance builds it from both; and Manual Disk Selection warns when a vdev
 * mixes disk sizes.
 *
 * The wizard groups unused disks by type and size (`getDiskTypeSizeMap`), offers one option per
 * group in ascending size, and generates the Width options from the selected group alone. So each
 * test reads the groups from `disk.details` first, and the widths it expects follow from their
 * counts. Every test skips where the appliance has only one size of a type.
 *
 * Automated selection fills a vdev smallest disks first (`GenerateVdevsService.pickDisks`), so the
 * only width that takes exactly one larger disk is one more than the smaller group holds. On CI
 * that is eleven wide: ten 10GB disks and the 32GB one. Middleware refuses a mirror wider than four
 * (`VDEV_MAX_DISKS` in `pool_/pool.py`), so that vdev is a RAIDZ1, which takes up to fifteen.
 *
 * Both sizes in one vdev are also visible after the pool is made: the VDEVs card on the Storage
 * dashboard reads "Mixed Capacity" in place of a size. The Review step has no such warning; the
 * Mixed Disk Capacities warning (`StorageService.validateVdevs`) is the card's.
 *
 * Each test owns its pool by name. Every name is removed before and after every test, whatever
 * happened, because a pool left behind holds its disks.
 */
import type { Page } from '@playwright/test';
import { readPoolTopology } from '../fixtures/pool';
import {
  ensurePoolAbsent, findTwoDiskSizes, getSelectableDisks, getUnusedDiskBuckets, type TwoDiskSizes, type UnusedDisk,
} from '../fixtures/storage';
import {
  addManualVdev, dragDisk, goToReview, openManualDiskSelection, openPoolWizard, selectOption, submitPool,
} from '../flows/storage';
import { manualDiskSelectionLocators, poolCardLocators, poolWizardLocators } from '../locators/storage';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const dialog = manualDiskSelectionLocators;

const optionsPool = 'e2e_wizard_sizes_options';
const minimumPool = 'e2e_wizard_sizes_minimum';
const manualPool = 'e2e_wizard_sizes_manual';
const pools = [optionsPool, minimumPool, manualPool];

/** The `CreateVdevLayout` value the dialog keys its vdev ids by, and the type `pool.query` reports. */
const mirror = 'MIRROR';

/** The widest RAIDZ1 vdev middleware accepts on create. */
const raidz1MaxWidth = 15;

/** What the VDEVs card shows in place of a size while a vdev mixes disk sizes. */
const mixedCapacity = 'Mixed Capacity';

const oneSizeOnly = 'the appliance has no unused disk larger than the smallest of the same type';

/**
 * Opens the Data step's Width select, checks that it offers every width up to `max` and none past
 * it, and picks `pick`, which closes it.
 */
async function expectWidthsUpTo(page: Page, max: number, pick: number): Promise<void> {
  await page.locator(poolWizardLocators.width('data')).click();
  await expect(page.locator(poolWizardLocators.widthOption('data', max))).toBeVisible();
  await expect(page.locator(poolWizardLocators.widthOption('data', max + 1))).toHaveCount(0);
  await page.locator(poolWizardLocators.widthOption('data', pick)).click();
}

/** The unused disks of one type and size. */
function disksOfSize(disks: UnusedDisk[], type: string, size: number): UnusedDisk[] {
  return disks.filter((disk) => disk.type === type && disk.size === size);
}

/** Reads the two sizes, skipping the test where the appliance has only one. */
async function requireTwoDiskSizes(api: E2eApiClient): Promise<TwoDiskSizes> {
  const sizes = await findTwoDiskSizes(api);
  // Skipped rather than failed: the appliance is not wrong, it just cannot show what this covers.
  test.skip(sizes === undefined, oneSizeOnly);
  if (!sizes) {
    throw new Error(oneSizeOnly);
  }
  return sizes;
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

test('Disk Size offers one option per size, smallest first, each with its own widths', async ({ page, api }) => {
  await requireTwoDiskSizes(api);
  const buckets = await getUnusedDiskBuckets(api);

  await openPoolWizard(page, optionsPool);
  // Stripe, so that a size with a single disk still has a width to offer.
  await selectOption(page, poolWizardLocators.layout, poolWizardLocators.layoutOption('Stripe'));

  const options = page.locator(poolWizardLocators.diskSizeOptions('data'));
  for (const [index, bucket] of buckets.entries()) {
    await page.locator(poolWizardLocators.diskSize('data')).click();
    await expect(options).toHaveCount(buckets.length);
    await expect(options.nth(index)).toContainText(`(${bucket.type})`);
    await options.nth(index).click();

    // The widths stop at this size's count, so the option picked was this size's.
    await expectWidthsUpTo(page, bucket.count, bucket.count);
  }
});

test('Treat Disk Size as Minimum lets a larger disk into the vdev, and the pool is built from both sizes', async ({ page, api }) => {
  const { smaller, larger } = await requireTwoDiskSizes(api);
  const disks = await getSelectableDisks(api);
  const atLeastSmaller = disks.filter((disk) => disk.type === smaller.type && disk.size >= smaller.size);
  // Every disk of the smaller size, and the first larger one.
  const width = smaller.count + 1;
  // Skipped rather than failed: middleware would refuse the vdev, whatever the wizard did.
  test.skip(width > raidz1MaxWidth, `${width} disks is wider than a RAIDZ1 vdev can be`);

  await openPoolWizard(page, minimumPool);
  await selectOption(page, poolWizardLocators.layout, poolWizardLocators.layoutOption('RAIDZ1'));
  await page.locator(poolWizardLocators.diskSize('data')).click();
  await page.locator(poolWizardLocators.diskSizeOptions('data')).first().click();

  const treatAsMinimum = page.locator(poolWizardLocators.treatDiskSizeAsMinimum('data'));
  await expect(treatAsMinimum).not.toBeChecked();
  await expectWidthsUpTo(page, smaller.count, smaller.count);

  await treatAsMinimum.check();
  await expectWidthsUpTo(page, atLeastSmaller.length, width);
  await selectOption(page, poolWizardLocators.vdevCount('data'), poolWizardLocators.vdevCountOption('data', 1));

  await goToReview(page, 'data');
  await submitPool(page);
  await expect(page.locator(poolCardLocators.dataVdevs(minimumPool)))
    .toContainText(`1 x RAIDZ1 | ${width} wide | ${mixedCapacity}`);

  const topology = await readPoolTopology(api, minimumPool);
  expect(topology.data).toHaveLength(1);
  const children = new Set(topology.data[0]?.children.map((child) => child.disk));
  const smallerNames = disksOfSize(disks, smaller.type, smaller.size).map((disk) => disk.devname);
  const largerNames = disksOfSize(disks, larger.type, larger.size).map((disk) => disk.devname);
  expect(children.size).toBe(width);
  expect(smallerNames.filter((name) => children.has(name))).toHaveLength(smaller.count);
  expect(largerNames.filter((name) => children.has(name))).toHaveLength(1);
});

test('Manual Disk Selection warns about a vdev mixing disk sizes, and still builds it', async ({ page, api }) => {
  const { smaller, larger } = await requireTwoDiskSizes(api);
  const disks = await getSelectableDisks(api);
  const [small] = disksOfSize(disks, smaller.type, smaller.size);
  const [large] = disksOfSize(disks, larger.type, larger.size);
  if (!small || !large) {
    throw new Error('disk.details listed a disk-size group with no disks in it');
  }

  await openPoolWizard(page, manualPool);
  await selectOption(page, poolWizardLocators.layout, poolWizardLocators.layoutOption('Mirror'));
  await openManualDiskSelection(page, 'data');

  const mixedSizes = page.locator(dialog.vdevMixedSizes(mirror, 1));
  await addManualVdev(page, mirror, [small.name]);
  await expect(mixedSizes).toHaveCount(0);

  await dragDisk(page, dialog.unusedDiskDrag(large.name), dialog.vdevDropzone(mirror, 1));
  await expect(page.locator(dialog.vdevDisk(large.name))).toBeVisible();
  await expect(mixedSizes).toContainText('Mixing disks of different sizes in a vdev is not recommended.');
  // A warning, not an error: the vdev has the disks a mirror needs, so Save is allowed.
  await expect(page.locator(dialog.vdevError(mirror, 1))).toHaveCount(0);
  await expect(page.locator(dialog.save)).toBeEnabled();
  await page.locator(dialog.save).click();
  await expect(page.locator(dialog.title)).toBeHidden();

  await goToReview(page, 'data');
  await submitPool(page);
  await expect(page.locator(poolCardLocators.dataVdevs(manualPool)))
    .toContainText(`1 x MIRROR | 2 wide | ${mixedCapacity}`);

  const topology = await readPoolTopology(api, manualPool);
  const children = new Set(topology.data[0]?.children.map((child) => child.disk));
  expect(children).toEqual(new Set([small.devname, large.devname]));
});
