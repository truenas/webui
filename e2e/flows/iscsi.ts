/**
 * iSCSI shares, driven through the UI.
 *
 * A share here is a target, and the card on the Shares dashboard lists targets by
 * name. The wizard builds the rest around one: a zvol, an extent on it, a portal
 * and an initiator group, all named after the target.
 */
import { expect, type Page } from '@playwright/test';
import { goToShares } from './navigation';
import { formSettleTimeoutMs } from './smb';
import { selectOption } from './storage';
import { iscsiLocators } from '../locators/iscsi';

/** The wizard makes up to six calls in a row, the zvol first, and then asks about the service. */
const saveTimeoutMs = 90_000;

/** What the wizard is told to make. */
export interface IscsiWizardShare {
  /** The extent's name, which the wizard also gives the target and the new zvol. */
  name: string;
  /** The pool or dataset the new zvol goes under, as a `/mnt/…` path. */
  parentPath: string;
  /** As typed into the size input, e.g. `64 MiB`. */
  volsize: string;
  /** The one address the new portal listens on. */
  listenAddress: string;
}

/**
 * Creates a share with the iSCSI Wizard, from the Shares dashboard, as a new
 * target on a new zvol behind a new portal.
 *
 * Declines the offer to start the service at the end: service state is global,
 * and the offer only appears while iSCSI is stopped, which every caller
 * establishes in `beforeEach`.
 */
export async function createIscsiShareWithWizard(page: Page, share: IscsiWizardShare): Promise<void> {
  const { card, wizard } = iscsiLocators;
  await goToShares(page);

  await expect(page.locator(card.wizard)).toBeVisible({ timeout: formSettleTimeoutMs });
  await page.locator(card.wizard).click();

  // Target: the select already reads "Create New".
  await expect(page.locator(wizard.targetNext)).toBeEnabled({ timeout: formSettleTimeoutMs });
  await page.locator(wizard.targetNext).click();

  // Extent.
  await expect(page.locator(wizard.name)).toBeVisible({ timeout: formSettleTimeoutMs });
  await page.locator(wizard.name).fill(share.name);
  await selectOption(page, wizard.disk, wizard.diskCreateNew);
  // Leaving the field is part of the entry: the picker hands its value to the
  // form on blur — see `fillNfsSharePath`.
  await page.locator(wizard.dataset).fill(share.parentPath);
  await page.locator(wizard.dataset).blur();
  await page.locator(wizard.volsize).fill(share.volsize);
  await page.locator(wizard.volsize).blur();
  await expect(page.locator(wizard.extentNext)).toBeEnabled();
  await page.locator(wizard.extentNext).click();

  // Protocol Options. No initiators, so the wizard's initiator group allows all.
  await expect(page.locator(wizard.portal)).toBeVisible({ timeout: formSettleTimeoutMs });
  await selectOption(page, wizard.portal, wizard.portalCreateNew);
  await page.locator(wizard.addListen).click();
  await selectOption(page, wizard.listen(0), wizard.listenOption(0, share.listenAddress));

  const declineStart = page.locator(iscsiLocators.declineStartService);
  await expect(page.locator(wizard.save)).toBeEnabled();
  await page.locator(wizard.save).click();
  await expect(declineStart).toBeVisible({ timeout: saveTimeoutMs });
  await declineStart.click();

  await expect(page.locator(wizard.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Deletes a target from its row menu on the dashboard card, ticking "Delete
 * associated extents", and waits for its row to go.
 *
 * The tick box appears only once the dialog has found the target's extents, so
 * waiting for it is also waiting for that load. Force is left off.
 */
export async function deleteIscsiTargetWithExtents(page: Page, name: string): Promise<void> {
  const { card, deleteDialog } = iscsiLocators;
  await goToShares(page);

  const trigger = page.locator(card.rowMenu(name));
  await expect(trigger).toBeVisible({ timeout: formSettleTimeoutMs });
  await trigger.click();
  await page.locator(card.rowMenuDelete(name)).click();

  await expect(page.locator(deleteDialog.deleteExtents)).toBeVisible({ timeout: formSettleTimeoutMs });
  await page.locator(deleteDialog.deleteExtents).click();
  await page.locator(deleteDialog.delete).click();

  await expect(page.locator(card.row(name))).toBeHidden({ timeout: saveTimeoutMs });
}
