/**
 * The Disks page, driven through the UI from Storage.
 */
import { expect, type Page } from '@playwright/test';
import { goToStorage } from './navigation';
import { selectOption } from './storage';
import { confirmDialogLocators, generalDialogLocators } from '../locators/dialogs';
import {
  diskFormLocators, diskListLocators, diskWipeLocators, type DiskPowerLevel, type DiskStandby,
} from '../locators/disks';

/** `disk.update` applies power settings to the device before it answers. */
const saveTimeoutMs = 60_000;

/** A Quick wipe of one disk, run as a job behind a progress dialog. */
const wipeTimeoutMs = 3 * 60_000;

/**
 * Opens the Disks page from the Storage dashboard's header, starting from the
 * sidebar, and waits for the given disk's row.
 *
 * The list loads `disk.details` and `disk.query` before it renders any row, so a
 * row is what says it has loaded.
 */
export async function openDisksPage(page: Page, disk: string): Promise<void> {
  await goToStorage(page);
  await page.locator(diskListLocators.entry).click();
  await expect(page).toHaveURL(/\/storage\/disks\/?$/);
  await expect(page.locator(diskListLocators.row(disk))).toBeVisible({ timeout: saveTimeoutMs });
}

/**
 * Expands a disk's row by clicking its name, which is how the row's actions and
 * its hidden columns are reached. Waits on the row's Edit.
 */
export async function expandDisk(page: Page, disk: string): Promise<void> {
  await page.locator(diskListLocators.cell('Name', disk)).click();
  await expect(page.locator(diskListLocators.edit(disk))).toBeVisible();
}

/**
 * Opens the Edit Disk panel from the disk's row. The read-only Name holding the
 * disk's name says the panel is editing that disk.
 */
export async function openDiskForm(page: Page, disk: string): Promise<void> {
  await expandDisk(page, disk);
  await page.locator(diskListLocators.edit(disk)).click();
  await expect(page.locator(diskFormLocators.name)).toHaveValue(disk);
}

export async function chooseHddStandby(page: Page, standby: DiskStandby): Promise<void> {
  await selectOption(page, diskFormLocators.hddStandby, diskFormLocators.hddStandbyOption(standby));
}

export async function chooseAdvPowerManagement(page: Page, level: DiskPowerLevel): Promise<void> {
  await selectOption(page, diskFormLocators.advPowerManagement, diskFormLocators.advPowerManagementOption(level));
}

/**
 * Saves the form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded. A refusal
 * leaves it open with the error attached.
 */
export async function saveDiskForm(page: Page): Promise<void> {
  await page.locator(diskFormLocators.save).click();
  await expect(page.locator(diskFormLocators.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/** Opens the Wipe Disk dialog from the disk's row. */
export async function openWipeDialog(page: Page, disk: string): Promise<void> {
  await expandDisk(page, disk);
  await page.locator(diskListLocators.wipe(disk)).click();
  await expect(page.locator(diskWipeLocators.title)).toBeVisible();
}

/**
 * Wipes the disk in the open dialog with the Quick method and dismisses the
 * result.
 *
 * Wipe raises the shared confirm without `hideCheckbox`, so its button stays
 * disabled until the box is ticked, which is asserted on the way. The job then
 * runs behind a progress dialog. When it ends, the wipe dialog closes itself and
 * a general dialog says the disk was wiped. That dialog's only button is Close,
 * under `button-cancel`. The wipe dialog has a Cancel under the same id, so the
 * wipe dialog has to be gone before it is pressed.
 */
export async function wipeDisk(page: Page): Promise<void> {
  await page.locator(diskWipeLocators.submit).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();

  const confirm = page.locator(confirmDialogLocators.confirm);
  await expect(confirm).toBeDisabled();
  await page.locator(confirmDialogLocators.checkbox).click();
  await expect(confirm).toBeEnabled();
  await confirm.click();

  await expect(page.locator(generalDialogLocators.title)).toBeVisible({ timeout: wipeTimeoutMs });
  await expect(page.locator(diskWipeLocators.title)).toBeHidden();
  await page.locator(generalDialogLocators.cancel).click();
  await expect(page.locator(generalDialogLocators.title)).toBeHidden();
}
