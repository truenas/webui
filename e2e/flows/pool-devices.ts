/**
 * A pool's VDEVs page and the wizard that adds devices, driven through the UI
 * from Storage.
 */
import { expect, type Page } from '@playwright/test';
import { goToStorage } from './navigation';
import { configureAutomatedVdevs, confirmDestructiveAction, goToReview } from './storage';
import { confirmDialogLocators } from '../locators/dialogs';
import { jobDialogLocators } from '../locators/encryption';
import {
  diskInfoLocators, extendDialogLocators, replaceDiskLocators, vdevsPageLocators, zfsInfoLocators,
} from '../locators/pool-devices';
import { poolWizardLocators } from '../locators/storage';

/** The tree loads `pool.query` and `disk.query` before it renders a node. */
const loadTimeoutMs = 30_000;

/**
 * `pool.offline`, `pool.online` and `pool.detach` answer once ZFS has acted, and
 * the tree reloads after.
 */
const deviceStateTimeoutMs = 60_000;

/** `pool.update` formats the disks it adds, as a job behind a progress dialog. */
const poolUpdateTimeoutMs = 5 * 60_000;

/**
 * `pool.remove` copies a data vdev's blocks onto the rest of the pool before it
 * answers. On an empty pool that is quick, so this is a ceiling only.
 */
const removeTimeoutMs = 5 * 60_000;

/**
 * `pool.replace` formats the new disk and attaches it, as a job behind a progress
 * dialog. The dialog closes when the job ends, before the resilver has.
 */
const poolReplaceTimeoutMs = 5 * 60_000;

/**
 * `pool.attach` formats the new disk and attaches it, as a job behind a progress
 * dialog. The dialog closes when the job ends, which may be before the resilver has.
 */
const poolAttachTimeoutMs = 5 * 60_000;

/**
 * Opens the pool's VDEVs page from its card on the Storage dashboard, starting
 * from the sidebar. The Data VDEVs group is what says the tree has loaded.
 */
export async function openVdevsPage(page: Page, pool: string): Promise<void> {
  await goToStorage(page);
  await page.locator(vdevsPageLocators.entry(pool)).click();
  await expect(page).toHaveURL(/\/storage\/\d+\/vdevs\/?$/);
  await expect(page.locator(vdevsPageLocators.group('data'))).toBeVisible({ timeout: loadTimeoutMs });
}

/**
 * Selects a disk in a mirror: the mirror first, which expands it, then the disk.
 * The details title holding the disk's name says the card beside the tree is
 * that disk's.
 */
export async function selectMirrorDisk(
  page: Page,
  mirrorGuid: string,
  disk: { guid: string; name: string },
): Promise<void> {
  await page.locator(vdevsPageLocators.node(mirrorGuid)).click();
  await selectDisk(page, disk);
}

/**
 * Selects a disk the tree already shows: one in an expanded vdev, or one that is
 * a data vdev of its own. The details title holding the disk's name says the card
 * beside the tree is that disk's.
 */
export async function selectDisk(page: Page, disk: { guid: string; name: string }): Promise<void> {
  await page.locator(vdevsPageLocators.node(disk.guid)).click();
  await expect(page).toHaveURL(new RegExp(`/vdevs/${disk.guid}$`));
  await expect(page.locator(vdevsPageLocators.detailsTitle)).toHaveText(disk.name);
}

/**
 * Selects a node that is in view without expanding anything first: a mirror, or a
 * cache, log or spare disk, which sit directly under their group.
 */
export async function selectNode(page: Page, guid: string): Promise<void> {
  await page.locator(vdevsPageLocators.node(guid)).click();
  await expect(page).toHaveURL(new RegExp(`/vdevs/${guid}$`));
}

/**
 * Removes the selected disk or vdev from the ZFS Info card, waits for the tree to
 * be read back, and checks the node is not in it.
 *
 * The tree reloads only once the job dialog has closed, so the node going is what
 * says `pool.remove` is done. A reload empties the whole tree before it refills,
 * though, so that alone would pass on the empty moment: the Data VDEVs group,
 * which every pool has, coming back is what says the tree was read again.
 */
export async function removeSelectedDevice(page: Page, guid: string): Promise<void> {
  await page.locator(zfsInfoLocators.remove).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await confirmDestructiveAction(page);

  await expect(page.locator(vdevsPageLocators.node(guid))).toBeHidden({ timeout: removeTimeoutMs });
  await expect(page.locator(jobDialogLocators.title)).toBeHidden();
  await expect(page.locator(vdevsPageLocators.group('data'))).toBeVisible({ timeout: loadTimeoutMs });
  await expect(page.locator(vdevsPageLocators.node(guid))).toBeHidden();
}

/**
 * Takes the selected disk offline, or brings it back, from the ZFS Info card's
 * menu, and waits for its row to show the new status.
 *
 * The confirm is the shared one, tick box and all.
 */
export async function setSelectedDiskState(
  page: Page,
  disk: { guid: string },
  state: 'OFFLINE' | 'ONLINE',
): Promise<void> {
  await page.locator(zfsInfoLocators.menu).click();
  await page.locator(state === 'OFFLINE' ? zfsInfoLocators.offline : zfsInfoLocators.online).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await confirmDestructiveAction(page);

  await expect(page.locator(vdevsPageLocators.nodeStatus(disk.guid))).toHaveText(state, {
    timeout: deviceStateTimeoutMs,
  });
}

/**
 * Replaces the selected disk with an unused one, from Replace on its Disk Info
 * card, and waits for the dialog to close on the job's success. The tick boxes
 * are left as the dialog opens them, which is checked first: both Preserve boxes
 * ticked and Force not.
 *
 * The autocomplete narrows to the device name typed, and clicking its row is what
 * commits the value, not the text.
 */
export async function replaceSelectedDisk(page: Page, replacement: string): Promise<void> {
  await page.locator(diskInfoLocators.replace).click();
  await expect(page.locator(replaceDiskLocators.title)).toBeVisible();

  await page.locator(replaceDiskLocators.replacement).fill(replacement);
  await page.locator(replaceDiskLocators.replacementOption(replacement)).click();

  await expect(page.locator(replaceDiskLocators.preserveSettings)).toBeChecked();
  await expect(page.locator(replaceDiskLocators.preserveDescription)).toBeChecked();
  await expect(page.locator(replaceDiskLocators.force)).not.toBeChecked();
  await page.locator(replaceDiskLocators.submit).click();

  // The dialog stays open on a failure, behind the error the job raised.
  await expect(page.locator(replaceDiskLocators.title)).toBeHidden({ timeout: poolReplaceTimeoutMs });
}

/**
 * Extends the selected disk with an unused one, from Extend on its ZFS Info card,
 * and waits for the dialog to close on the job's success.
 *
 * The autocomplete narrows to the device name typed, and clicking its row is what
 * commits the value, not the text.
 */
export async function extendSelectedDisk(page: Page, newDisk: string): Promise<void> {
  await page.locator(zfsInfoLocators.extend).click();
  await expect(page.locator(extendDialogLocators.title)).toBeVisible();

  await page.locator(extendDialogLocators.newDisk).fill(newDisk);
  await page.locator(extendDialogLocators.newDiskOption(newDisk)).click();
  await page.locator(extendDialogLocators.submit).click();

  // The dialog stays open on a failure, behind the error the job raised.
  await expect(page.locator(extendDialogLocators.title)).toBeHidden({ timeout: poolAttachTimeoutMs });
}

/**
 * Detaches the selected disk from its mirror, from the ZFS Info card's menu, and
 * waits for the tree to stop listing it.
 *
 * The confirm is the shared one, tick box and all.
 */
export async function detachSelectedDisk(page: Page, disk: { guid: string }): Promise<void> {
  await page.locator(zfsInfoLocators.menu).click();
  await page.locator(zfsInfoLocators.detach).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await confirmDestructiveAction(page);

  await expect(page.locator(vdevsPageLocators.node(disk.guid))).toHaveCount(0, { timeout: deviceStateTimeoutMs });
}

/**
 * Adds one spare to the pool from "Add VDEV" on its VDEVs page, and waits for
 * the wizard to land back on the Storage dashboard.
 *
 * The wizard opens on General, with the pool's name fixed, and crosses Data and
 * Log untouched: neither is required when adding to a pool. The disk size is the
 * first the Spare step offers, for the reason given on `selectFirstOption`.
 */
export async function addOneSpare(page: Page): Promise<void> {
  await page.locator(vdevsPageLocators.addVdev).click();
  await expect(page).toHaveURL(/\/storage\/\d+\/add-vdevs\/?$/);

  await page.locator(poolWizardLocators.next).click();
  await page.locator(poolWizardLocators.nextStep('data')).click();
  await page.locator(poolWizardLocators.nextStep('log')).click();

  await configureAutomatedVdevs(page, 'spare', { width: 1 });
  await goToReview(page, 'spare');

  await expect(page.locator(poolWizardLocators.reviewCategory('spare'))).toBeVisible();
  // "Update Pool" here: the button the creation wizard labels "Create Pool".
  await page.locator(poolWizardLocators.createPool).click();

  // Adding a disk erases it, so the wizard asks first.
  await confirmDestructiveAction(page);

  // The wizard leaves for the dashboard once the job has finished, and stays put
  // on a failure.
  await expect(page).toHaveURL(/\/storage\/?$/, { timeout: poolUpdateTimeoutMs });
}
