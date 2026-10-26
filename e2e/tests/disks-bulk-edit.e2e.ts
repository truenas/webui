/**
 * Stories: an admin ticks several disks on the Disks page under Storage and
 * changes their power settings at once through Edit Disks.
 *
 * Three disks that no pool holds: two targets, which are ticked, and a bystander,
 * which is not. The bystander is what shows the save touched only what was
 * ticked. Every change is read back through `disk.query`.
 *
 * The bulk form prefills a select only when every ticked disk holds the same
 * value, and drops an empty select from the `core.bulk` payload. So a setting
 * the disks disagree on opens empty and, left that way, keeps each disk's own
 * value. Description is not on the bulk form at all, so it is never sent.
 *
 * `disks.e2e.ts` edits the first unused disk too, which is one of these. Both
 * specs write that disk's settings before and after each test, and the suite
 * runs serially, so neither sees the other's values.
 *
 * Not covered: the error dialog for a disk `core.bulk` fails on, which nothing in
 * the UI can cause on CI's disks; selections across pages or after a search; and
 * select-all.
 */
import {
  diskBaseline,
  pickUnusedDisks,
  readDiskSettings,
  writeDiskSettings,
  type DiskSettings,
} from '../fixtures/disks';
import {
  chooseAdvPowerManagement,
  chooseHddStandby,
  expandDisk,
  openDisksPage,
  openSelectedDisksForEdit,
  saveDiskForm,
  selectDisks,
} from '../flows/disks';
import { diskBulkEditLocators, diskFormLocators, diskListLocators } from '../locators/disks';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** What a `tn-select` shows with no value: webui's shared placeholder (`provideTnSelectLabels`). */
const emptySelectText = 'Select an option';

let targetA: string;
let targetB: string;
let bystander: string;

/** Each disk's settings as the appliance held them before this file ran, written back after every test. */
const original = new Map<string, DiskSettings>();

test.beforeAll(async ({ api }) => {
  // `pickUnusedDisks` throws unless it returns all three.
  [targetA, targetB, bystander] = await pickUnusedDisks(api, 3) as [string, string, string];

  for (const disk of [targetA, targetB, bystander]) {
    original.set(disk, await readDiskSettings(api, disk));
  }
});

/** Every test starts from the baseline on all three disks. A test wanting other values writes them over it. */
test.beforeEach(async ({ api }) => {
  for (const disk of [targetA, targetB, bystander]) {
    await writeDiskSettings(api, disk, diskBaseline);
  }
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the settings of disks ${targetA}, ${targetB} and ${bystander} as the test left them`)) {
    return;
  }

  await runCleanupSteps([...original].map(([disk, settings]) => [
    `restore the settings of disk "${disk}"`,
    () => writeDiskSettings(api, disk, settings),
  ]));
});

test('an admin sets HDD Standby and power management on two disks at once, and only those two change', async ({ page, api }) => {
  await openDisksPage(page, targetA);
  await selectDisks(page, [targetA, targetB]);
  await expect(page.locator(diskListLocators.selectionCount)).toHaveText('2 disks selected');
  await expect(page.locator(diskListLocators.editSelected)).toHaveText(/Edit Disks$/);

  await openSelectedDisksForEdit(page);
  await expect(page.locator(diskBulkEditLocators.disk(targetA))).toHaveText(targetA);
  await expect(page.locator(diskBulkEditLocators.disk(targetB))).toHaveText(targetB);
  await expect(page.locator(diskBulkEditLocators.disk(bystander))).toBeHidden();
  // Both disks agree on both settings, so both selects open on the shared value.
  await expect(page.locator(diskFormLocators.hddStandby)).toHaveText('Always On');
  await expect(page.locator(diskFormLocators.advPowerManagement)).toHaveText('Disabled');

  await chooseHddStandby(page, '30');
  await chooseAdvPowerManagement(page, '64');
  await saveDiskForm(page);

  expect(await readDiskSettings(api, targetA)).toEqual({ description: '', hddstandby: '30', advpowermgmt: '64' });
  expect(await readDiskSettings(api, targetB)).toEqual({ description: '', hddstandby: '30', advpowermgmt: '64' });
  expect(await readDiskSettings(api, bystander)).toEqual(diskBaseline);

  // Opened again rather than read off the page the save left, which patches the
  // rows from what the form sent. A fresh page reads the disks back from the
  // appliance. These columns are hidden by default, so they are read from each
  // expanded row.
  await openDisksPage(page, targetA);
  for (const disk of [targetA, targetB]) {
    await expandDisk(page, disk);
    await expect(page.locator(diskListLocators.cell('HDD Standby', disk))).toHaveText('30');
    await expect(page.locator(diskListLocators.cell('Adv. Power Management', disk))).toHaveText('64');
  }
  await expandDisk(page, bystander);
  await expect(page.locator(diskListLocators.cell('HDD Standby', bystander))).toHaveText('Always On');
  await expect(page.locator(diskListLocators.cell('Adv. Power Management', bystander))).toHaveText('Disabled');
});

test('a setting the disks disagree on opens empty, and saving keeps each disk\'s own value', async ({ page, api }) => {
  // The descriptions differ too, and are not on the bulk form, so they must
  // come through the save untouched.
  await writeDiskSettings(api, targetA, { description: 'E2E bulk A', hddstandby: '20', advpowermgmt: 'DISABLED' });
  await writeDiskSettings(api, targetB, { description: 'E2E bulk B', hddstandby: '60', advpowermgmt: 'DISABLED' });

  await openDisksPage(page, targetA);
  await selectDisks(page, [targetA, targetB]);
  await openSelectedDisksForEdit(page);

  await expect(page.locator(diskFormLocators.hddStandby)).toHaveText(emptySelectText);
  await expect(page.locator(diskFormLocators.advPowerManagement)).toHaveText('Disabled');

  await chooseAdvPowerManagement(page, '127');
  await saveDiskForm(page);

  expect(await readDiskSettings(api, targetA)).toEqual({
    description: 'E2E bulk A',
    hddstandby: '20',
    advpowermgmt: '127',
  });
  expect(await readDiskSettings(api, targetB)).toEqual({
    description: 'E2E bulk B',
    hddstandby: '60',
    advpowermgmt: '127',
  });
  expect(await readDiskSettings(api, bystander)).toEqual(diskBaseline);
});

test('ticking one disk opens the ordinary Edit Disk form, not the bulk one', async ({ page, api }) => {
  await openDisksPage(page, targetA);
  await selectDisks(page, [targetA]);
  await expect(page.locator(diskListLocators.selectionCount)).toHaveText('1 disk selected');
  await expect(page.locator(diskListLocators.editSelected)).toHaveText(/Edit Disk$/);

  await openSelectedDisksForEdit(page);
  // Name and Description are on the single form only.
  await expect(page.locator(diskFormLocators.name)).toHaveValue(targetA);
  await expect(page.locator(diskFormLocators.description)).toBeVisible();
  await expect(page.locator(diskBulkEditLocators.anyDisk)).toHaveCount(0);

  await page.locator(diskFormLocators.closePanel).click();
  await expect(page.locator(diskFormLocators.save)).toBeHidden();

  expect(await readDiskSettings(api, targetA)).toEqual(diskBaseline);
});
