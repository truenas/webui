/**
 * Stories: an admin looks through the disks on the Disks page under Storage,
 * edits one, and wipes one that is in no pool.
 *
 * Each change is asserted on the page and through the API. `disk.query` holds
 * what an edit saved. `disk.details` says whether a disk still carries a pool.
 *
 * The wipe needs a result the API can see, and a blank disk has none: a wipe
 * leaves it exactly as it found it. So the disk wiped here carries a pool
 * exported without `destroy`. Such a disk is in no pool, so the page offers Wipe
 * for it, and the dialog warns that the exported pool will be lost. A wipe that
 * really ran leaves `disk.details` reporting no pool on it. Only Quick is used.
 * The other methods write all of a disk.
 *
 * Not covered: the bulk edit, the column picker, the SED password and the SED
 * Unlock and Reset actions, which need a self-encrypting drive.
 */
import {
  diskBaseline,
  ensureDiskWithExportedPool,
  ensureExportedPoolGone,
  findDisksCarryingExportedPool,
  listDisks,
  pickUnusedDisk,
  readDiskSettings,
  resetDiskSettings,
} from '../fixtures/disks';
import { getSelectableDisks } from '../fixtures/storage';
import {
  chooseAdvPowerManagement,
  chooseHddStandby,
  expandDisk,
  openDiskForm,
  openDisksPage,
  openWipeDialog,
  saveDiskForm,
  wipeDisk,
} from '../flows/disks';
import { diskFormLocators, diskListLocators, diskWipeLocators } from '../locators/disks';
import { leavingTestData } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

test('the Disks page lists every disk on the appliance, and search narrows it to one', async ({ page, api }) => {
  const disks = await listDisks(api);
  const unused = new Set((await getSelectableDisks(api)).map(({ name }) => name));
  const target = await pickUnusedDisk(api);
  const other = disks.find(({ name }) => name !== target)?.name;
  expect(other, 'The appliance needs a second disk for the search to leave out.').toBeDefined();

  await openDisksPage(page, target);

  // The page's default page size is 50, and an appliance this suite runs on has
  // a dozen disks, so every one is on page one.
  for (const disk of disks) {
    await expect(page.locator(diskListLocators.cell('Name', disk.name))).toHaveText(disk.name);
    await expect(page.locator(diskListLocators.cell('Serial', disk.name))).toHaveText(disk.serial);
    await expect(page.locator(diskListLocators.cell('Disk Size', disk.name))).not.toBeEmpty();
    if (unused.has(disk.name)) {
      await expect(page.locator(diskListLocators.cell('Pool', disk.name))).toHaveText('N/A');
    }
  }

  // By serial. TrueNAS gives each of CI's disks a random one, and an unused disk
  // never shares its serial with another (`getSelectableDisks`), so this matches
  // the one disk. The search keeps rows whose serial contains the text.
  const targetSerial = disks.find(({ name }) => name === target)?.serial ?? '';
  expect(targetSerial, `Disk "${target}" has no serial to search for.`).not.toBe('');

  await page.locator(diskListLocators.search).fill(targetSerial);
  await expect(page.locator(diskListLocators.row(target))).toBeVisible();
  await expect(page.locator(diskListLocators.row(other ?? ''))).toBeHidden();
});

test.describe('editing a disk', () => {
  let disk: string;

  /** Written before each test as well as after, so an interrupted run leaves the next one able to start. */
  test.beforeEach(async ({ api }) => {
    disk = await pickUnusedDisk(api);
    await resetDiskSettings(api, disk);
  });

  test.afterEach(async ({ api }) => {
    if (leavingTestData(`the settings of disk "${disk}" as the test left them`)) {
      return;
    }

    await resetDiskSettings(api, disk);
  });

  test('an admin edits the description and power settings of a disk, and they are kept', async ({ page, api }) => {
    const description = 'E2E edited disk';

    await openDisksPage(page, disk);
    await openDiskForm(page, disk);
    await expect(page.locator(diskFormLocators.description)).toHaveValue(diskBaseline.description);

    await page.locator(diskFormLocators.description).fill(description);
    await chooseHddStandby(page, '20');
    await chooseAdvPowerManagement(page, '127');
    await saveDiskForm(page);

    expect(await readDiskSettings(api, disk)).toEqual({
      description,
      hddstandby: '20',
      advpowermgmt: '127',
    });

    // Opened again rather than read off the page the save left, which patches the
    // row from what the form sent before it reloads. A fresh page reads the disk
    // back from the appliance. These columns are hidden by default, so they are
    // read from the expanded row. Power management shows the level, not the label.
    await openDisksPage(page, disk);
    await expandDisk(page, disk);
    await expect(page.locator(diskListLocators.cell('Description', disk))).toHaveText(description);
    await expect(page.locator(diskListLocators.cell('HDD Standby', disk))).toHaveText('20');
    await expect(page.locator(diskListLocators.cell('Adv. Power Management', disk))).toHaveText('127');
  });
});

test.describe('wiping a disk', () => {
  /** Built, exported and wiped here. Not a name any other spec looks for. */
  const pool = 'e2e_wipe_tank';

  /**
   * Cleared first and then prepared, so a run left with the pool still imported
   * or still on a disk starts from the same place as a clean one.
   */
  test.beforeEach(async ({ api }) => {
    await ensureExportedPoolGone(api, pool);
  });

  test.afterEach(async ({ api }) => {
    if (leavingTestData(`pool "${pool}" and any disk still carrying it`)) {
      return;
    }

    await ensureExportedPoolGone(api, pool);
  });

  test('an admin wipes a disk carrying an exported pool, and the pool is gone from it', async ({ page, api }) => {
    const disk = await ensureDiskWithExportedPool(api, pool);

    await openDisksPage(page, disk);
    await expect(page.locator(diskListLocators.cell('Pool', disk))).toHaveText(`${pool} (Exported)`);

    await openWipeDialog(page, disk);
    await expect(page.locator(diskWipeLocators.exportedPoolWarning)).toContainText(pool);
    await wipeDisk(page);

    // The page reloads when the dialog reports success.
    await expect(page.locator(diskListLocators.cell('Pool', disk))).toHaveText('N/A');

    expect(await findDisksCarryingExportedPool(api, pool)).toEqual([]);
    // The disk is one the pool wizard offers again.
    expect((await getSelectableDisks(api)).map(({ name }) => name)).toContain(disk);
  });
});
