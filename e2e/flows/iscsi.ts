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
import { confirmDialogLocators } from '../locators/dialogs';
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

/** One save in the side panel: a single call, but behind a page that may still be loading its lists. */
const panelSaveTimeoutMs = 30_000;

/**
 * Opens the full iSCSI page on its Targets tab, through the card's title on the
 * Shares dashboard — the way a user reaches it.
 */
export async function goToIscsiTargets(page: Page): Promise<void> {
  await goToShares(page);

  const open = page.locator(iscsiLocators.card.open);
  await expect(open).toBeVisible({ timeout: formSettleTimeoutMs });
  await open.click();
  await expect(page).toHaveURL(/\/sharing\/iscsi\/targets\/?$/);
}

/** Opens the Extents tab of the full iSCSI page, through its Targets tab. */
export async function goToIscsiExtents(page: Page): Promise<void> {
  await goToIscsiTargets(page);

  await page.locator(iscsiLocators.extentsTab).click();
  await expect(page).toHaveURL(/\/sharing\/iscsi\/extents\/?$/);
}

/**
 * Shows a target's cards on the Targets tab.
 *
 * The page opens with one target already selected, and clicking the selected
 * row deselects it, so the row is clicked only when the cards are about another.
 */
export async function selectIscsiTarget(page: Page, name: string): Promise<void> {
  const { targets } = iscsiLocators;
  const detailsFor = page.locator(targets.detailsFor);
  const heading = `Details for ${name}`;

  await expect(page.locator(targets.row(name))).toBeVisible({ timeout: formSettleTimeoutMs });
  await expect(detailsFor).toBeVisible({ timeout: formSettleTimeoutMs });
  if ((await detailsFor.textContent())?.trim() !== heading) {
    await page.locator(targets.row(name)).click();
  }

  await expect(detailsFor).toHaveText(heading);
}

/** What the Add target form is filled with. */
export interface IscsiTargetEntry {
  name: string;
  alias: string;
  /** One authorized network, as an address and a prefix length. */
  network: { address: string; prefix: number };
  /** The portal the target's one group points at, by its id and the comment its option shows. */
  portal: { id: number; comment: string };
  /** The id of an initiator group that allows every initiator. */
  initiatorId: number;
}

/**
 * Adds a target from the Targets tab with one authorized network and one group,
 * and waits for the page to select it.
 *
 * The group's authentication method is left at its default, None.
 */
export async function addIscsiTarget(page: Page, target: IscsiTargetEntry): Promise<void> {
  const { targets, targetForm } = iscsiLocators;
  await goToIscsiTargets(page);

  await expect(page.locator(targets.add)).toBeVisible({ timeout: formSettleTimeoutMs });
  await page.locator(targets.add).click();

  await expect(page.locator(targetForm.name)).toBeVisible({ timeout: formSettleTimeoutMs });
  await page.locator(targetForm.name).fill(target.name);
  await page.locator(targetForm.alias).fill(target.alias);

  await page.locator(targetForm.addNetwork).click();
  await page.locator(targetForm.networkAddress(0)).fill(target.network.address);
  await selectOption(page, targetForm.networkPrefix, targetForm.networkPrefixOption(target.network.prefix));

  await page.locator(targetForm.addGroup).click();
  await selectOption(page, targetForm.portal, targetForm.portalOption(target.portal.id, target.portal.comment));
  await selectOption(page, targetForm.initiator, targetForm.allowAllInitiatorOption(target.initiatorId));

  // Save waits on the name's uniqueness check, which runs against the appliance.
  await expect(page.locator(targetForm.save)).toBeEnabled({ timeout: formSettleTimeoutMs });
  await page.locator(targetForm.save).click();
  await expect(page.locator(targetForm.save)).toBeHidden({ timeout: panelSaveTimeoutMs });

  await expect(page.locator(targets.detailsFor)).toHaveText(`Details for ${target.name}`, {
    timeout: formSettleTimeoutMs,
  });
}

/**
 * Opens the target form for a target from Edit in the Targets tab's detail
 * header, and waits for it to load the target.
 */
export async function openIscsiTargetForEdit(page: Page, name: string): Promise<void> {
  const { targets, targetForm } = iscsiLocators;
  await goToIscsiTargets(page);
  await selectIscsiTarget(page, name);

  await page.locator(targets.edit).click();
  // The form patches the target in once it has opened; typing before that is overwritten.
  await expect(page.locator(targetForm.name)).toHaveValue(name, { timeout: formSettleTimeoutMs });
}

/** What an edit to a target with one authorized network and one group changes. */
export interface IscsiTargetEdit {
  name: string;
  alias: string;
  /** The network's new address. Its prefix length is left as it is. */
  networkAddress: string;
  /** The tag the group's CHAP authentication uses. */
  chapAuthTag: number;
}

/**
 * Edits a target from the Targets tab: a new alias, a new address on its one
 * authorized network, and CHAP on its one group. Waits for the panel to close.
 */
export async function editIscsiTarget(page: Page, edit: IscsiTargetEdit): Promise<void> {
  const { targetForm } = iscsiLocators;
  await openIscsiTargetForEdit(page, edit.name);

  await page.locator(targetForm.alias).fill(edit.alias);
  await page.locator(targetForm.networkAddress(0)).fill(edit.networkAddress);
  await selectOption(page, targetForm.authmethod, targetForm.authmethodChapOption);
  await selectOption(page, targetForm.auth, targetForm.authOption(edit.chapAuthTag));

  await expect(page.locator(targetForm.save)).toBeEnabled({ timeout: formSettleTimeoutMs });
  await page.locator(targetForm.save).click();
  await expect(page.locator(targetForm.save)).toBeHidden({ timeout: panelSaveTimeoutMs });
}

/**
 * Associates an extent with a target as the given LUN, from the target's
 * Extents card, and waits for the association to be listed there.
 */
export async function associateIscsiExtent(
  page: Page,
  { target, extent, lunId }: { target: string; extent: { id: number; name: string }; lunId: number },
): Promise<void> {
  const { targets, associateDialog } = iscsiLocators;
  await goToIscsiTargets(page);
  await selectIscsiTarget(page, target);

  // Enabled once the card has loaded the extents and found one not yet associated.
  await expect(page.locator(targets.associate(target))).toBeEnabled({ timeout: formSettleTimeoutMs });
  await page.locator(targets.associate(target)).click();

  await expect(page.locator(associateDialog.lunId)).toBeVisible({ timeout: formSettleTimeoutMs });
  await page.locator(associateDialog.lunId).fill(String(lunId));
  await selectOption(page, associateDialog.extent, associateDialog.extentOption(extent.name));
  await expect(page.locator(associateDialog.associate)).toBeEnabled();
  await page.locator(associateDialog.associate).click();

  await expect(page.locator(targets.associatedExtent(extent.id))).toBeVisible({ timeout: panelSaveTimeoutMs });
}

/**
 * Removes an extent's association with the selected target, from the unlink
 * button beside it on the target's Extents card, and waits for its line to go.
 */
export async function removeIscsiExtentAssociation(page: Page, extentId: number): Promise<void> {
  const { targets } = iscsiLocators;

  await page.locator(targets.removeAssociation(extentId)).click();
  // Raised with `hideCheckbox: true`, so there is nothing to tick first.
  await expect(page.locator(confirmDialogLocators.confirm)).toBeVisible({ timeout: formSettleTimeoutMs });
  await page.locator(confirmDialogLocators.confirm).click();

  await expect(page.locator(targets.associatedExtent(extentId))).toBeHidden({ timeout: panelSaveTimeoutMs });
}

/**
 * Opens the Add extent form from the Extents tab.
 *
 * Its Add button shares an id with the Targets tab's, so the form is confirmed
 * by Extent Type, which the Add target form does not have.
 */
async function openAddIscsiExtentForm(page: Page): Promise<void> {
  const { extents, extentForm } = iscsiLocators;
  await goToIscsiExtents(page);

  await expect(page.locator(extents.add)).toBeVisible({ timeout: formSettleTimeoutMs });
  await page.locator(extents.add).click();
  await expect(page.locator(extentForm.type)).toBeVisible({ timeout: formSettleTimeoutMs });
}

async function saveIscsiExtentForm(page: Page): Promise<void> {
  const { extentForm } = iscsiLocators;

  await expect(page.locator(extentForm.save)).toBeEnabled();
  await page.locator(extentForm.save).click();
  await expect(page.locator(extentForm.save)).toBeHidden({ timeout: panelSaveTimeoutMs });
}

/** Adds a Device extent on an existing zvol (`pool/child`) from the Extents tab, at the given logical block size. */
export async function addIscsiZvolExtent(
  page: Page,
  extent: {
    name: string;
    comment: string;
    zvol: string;
    blocksize: number;
  },
): Promise<void> {
  const { extentForm } = iscsiLocators;
  await openAddIscsiExtentForm(page);

  await page.locator(extentForm.name).fill(extent.name);
  await page.locator(extentForm.comment).fill(extent.comment);
  // The type opens on Device, so only the device itself is picked.
  await selectOption(page, extentForm.disk, extentForm.diskZvolOption(extent.zvol));
  await selectOption(page, extentForm.blocksize, extentForm.blocksizeOption(extent.blocksize));

  await saveIscsiExtentForm(page);
}

/**
 * Adds a File extent from the Extents tab, at a `/mnt/…` path that does not
 * exist yet — middleware makes the file at the size given.
 */
export async function addIscsiFileExtent(
  page: Page,
  extent: { name: string; path: string; filesize: string },
): Promise<void> {
  const { extentForm } = iscsiLocators;
  await openAddIscsiExtentForm(page);

  await page.locator(extentForm.name).fill(extent.name);
  await selectOption(page, extentForm.type, extentForm.typeFile);
  // Leaving the field is part of the entry: the picker hands its value to the
  // form on blur — see `fillNfsSharePath`.
  await expect(page.locator(extentForm.path)).toBeVisible();
  await page.locator(extentForm.path).fill(extent.path);
  await page.locator(extentForm.path).blur();
  await page.locator(extentForm.filesize).fill(extent.filesize);
  await page.locator(extentForm.filesize).blur();

  await saveIscsiExtentForm(page);
}

async function openIscsiExtentRowMenu(page: Page, name: string): Promise<void> {
  const trigger = page.locator(iscsiLocators.extents.rowMenu(name));

  await expect(trigger).toBeVisible({ timeout: formSettleTimeoutMs });
  await trigger.click();
}

/** Changes an extent's description from Edit in its row's menu on the Extents tab. */
export async function editIscsiExtentDescription(page: Page, name: string, comment: string): Promise<void> {
  const { extents, extentForm } = iscsiLocators;
  await goToIscsiExtents(page);

  await openIscsiExtentRowMenu(page, name);
  await page.locator(extents.rowMenuEdit(name)).click();

  // The form opens filled in from the extent, so wait for its name to arrive
  // before replacing anything.
  await expect(page.locator(extentForm.name)).toHaveValue(name, { timeout: formSettleTimeoutMs });
  await page.locator(extentForm.comment).fill(comment);

  await saveIscsiExtentForm(page);
}

/**
 * Deletes a File extent from Delete in its row's menu on the Extents tab,
 * ticking "Remove file?", and waits for its row to go. Force is left off.
 */
export async function deleteIscsiFileExtentAndFile(page: Page, name: string): Promise<void> {
  const { extents, deleteExtentDialog } = iscsiLocators;
  await goToIscsiExtents(page);

  await openIscsiExtentRowMenu(page, name);
  await page.locator(extents.rowMenuDelete(name)).click();

  await expect(page.locator(deleteExtentDialog.removeFile)).toBeVisible({ timeout: formSettleTimeoutMs });
  await page.locator(deleteExtentDialog.removeFile).click();
  await page.locator(deleteExtentDialog.delete).click();

  await expect(page.locator(extents.row(name))).toBeHidden({ timeout: panelSaveTimeoutMs });
}
