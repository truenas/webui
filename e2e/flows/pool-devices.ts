/**
 * A pool's VDEVs page and the wizard that adds devices, driven through the UI
 * from Storage.
 */
import { expect, type Page } from '@playwright/test';
import { goToStorage } from './navigation';
import { configureAutomatedVdevs, confirmDestructiveAction, goToReview } from './storage';
import { confirmDialogLocators } from '../locators/dialogs';
import { raidzExtendDialogLocators, vdevsPageLocators, zfsInfoLocators } from '../locators/pool-devices';
import { poolWizardLocators } from '../locators/storage';

/** The tree loads `pool.query` and `disk.query` before it renders a node. */
const loadTimeoutMs = 30_000;

/** `pool.offline` and `pool.online` answer once ZFS has acted, and the tree reloads after. */
const deviceStateTimeoutMs = 60_000;

/** `pool.update` formats the disks it adds, as a job behind a progress dialog. */
const poolUpdateTimeoutMs = 5 * 60_000;

/**
 * On a RAIDZ vdev, `pool.attach` answers only once ZFS reports the expansion
 * `FINISHED`, and the dialog closes after it. On an empty pool the reflow has
 * almost nothing to move, so this is a ceiling only.
 */
const raidzExtendTimeoutMs = 5 * 60_000;

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
  await page.locator(vdevsPageLocators.node(disk.guid)).click();
  await expect(page).toHaveURL(new RegExp(`/vdevs/${disk.guid}$`));
  await expect(page.locator(vdevsPageLocators.detailsTitle)).toHaveText(disk.name);
}

/**
 * Selects a node that is in view without expanding anything first: a mirror or a
 * RAIDZ vdev, or a cache, log or spare disk, which sit directly under their group.
 */
export async function selectNode(page: Page, guid: string): Promise<void> {
  await page.locator(vdevsPageLocators.node(guid)).click();
  await expect(page).toHaveURL(new RegExp(`/vdevs/${guid}$`));
}

/**
 * Extends the selected RAIDZ vdev by one unused disk, from Extend on its ZFS Info
 * card, and waits for the dialog to close on the job's success.
 *
 * The autocomplete narrows to the device name typed, and clicking its row is what
 * commits the value, not the text.
 */
export async function extendSelectedRaidz(page: Page, newDisk: string): Promise<void> {
  await page.locator(zfsInfoLocators.extend).click();
  await expect(page.locator(raidzExtendDialogLocators.title)).toBeVisible();

  await page.locator(raidzExtendDialogLocators.newDisk).fill(newDisk);
  await page.locator(raidzExtendDialogLocators.newDiskOption(newDisk)).click();
  await page.locator(raidzExtendDialogLocators.submit).click();

  // The dialog stays open on a failure, behind the error the job raised.
  await expect(page.locator(raidzExtendDialogLocators.title)).toBeHidden({ timeout: raidzExtendTimeoutMs });
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
