/**
 * SMB shares, driven through the UI.
 */
import { expect, type Page } from '@playwright/test';
import { goToShares } from './navigation';
import { confirmDialogLocators } from '../locators/dialogs';
import { smbLocators } from '../locators/smb';

/** Creating a share writes to middleware and then asks two follow-up questions. */
const saveTimeoutMs = 60_000;

/** Longer where the save also starts the service, which is a job of its own. */
const startServiceSaveTimeoutMs = 90_000;

/**
 * How long a control on this form may take to appear.
 *
 * Generous because of the screen, not the form: the Shares dashboard is the
 * chattiest page the suite drives, and the development build queues calls past
 * twenty, so the form settles slowly while the page catches up. The ids are
 * verified against a running appliance, so a long wait here is a busy page
 * rather than a wrong selector.
 */
export const formSettleTimeoutMs = 60_000;

/**
 * Opens a share's row menu on the dashboard card.
 *
 * Waits for the trigger on the same budget as the add form, and for the same
 * reason: the rows arrive with the rest of a slow-settling page.
 */
async function openShareRowMenu(page: Page, name: string): Promise<void> {
  const trigger = page.locator(smbLocators.card.rowMenu(name));

  await expect(trigger).toBeVisible({ timeout: formSettleTimeoutMs });
  await trigger.click();
}

/** Flips a share's Enabled switch on the dashboard card, on the same settle budget. */
export async function toggleShareEnabled(page: Page, name: string): Promise<void> {
  const toggle = page.locator(smbLocators.card.enabledToggle(name));

  await expect(toggle).toBeVisible({ timeout: formSettleTimeoutMs });
  await toggle.click();
}

/** Opens the add-share panel from the Shares dashboard, as a user would. */
export async function openAddShareForm(page: Page): Promise<void> {
  await goToShares(page);

  await expect(page.locator(smbLocators.addShare)).toBeVisible({ timeout: formSettleTimeoutMs });
  await page.locator(smbLocators.addShare).click();
  await expect(page.locator(smbLocators.form.name)).toBeVisible({ timeout: formSettleTimeoutMs });
}

/**
 * Opens the edit panel for a share, from its row menu on the dashboard card.
 *
 * Waits for the name to be filled in rather than for the field to exist: the
 * panel is the same component as the add form, so the field renders either way
 * and only its value says the share that was picked is the one that loaded.
 */
export async function openEditShareForm(page: Page, name: string): Promise<void> {
  await goToShares(page);

  await openShareRowMenu(page, name);
  await page.locator(smbLocators.card.rowMenuEdit(name)).click();
  await expect(page.locator(smbLocators.form.name)).toHaveValue(name, { timeout: formSettleTimeoutMs });
}

/** Picks a share purpose by the label shown in the select. */
export async function choosePurpose(page: Page, label: string): Promise<void> {
  await page.locator(smbLocators.form.purpose).click();

  const option = page.locator(smbLocators.form.purposeOption(label));
  await expect(option).toBeVisible({ timeout: formSettleTimeoutMs });
  await option.click();
}

/**
 * Expands the advanced options.
 *
 * The controls a purpose enables are not in the DOM until this is open, so any
 * assertion about the preset engine has to come after it. Waits on a control
 * nearly every purpose renders rather than on the toggle's own state — not for
 * an External Share, which has no host list.
 */
export async function showAdvancedOptions(page: Page): Promise<void> {
  await page.locator(smbLocators.form.advancedToggle).click();
  await expect(page.locator(smbLocators.form.hostsAllow)).toBeVisible({ timeout: formSettleTimeoutMs });
}

/**
 * Saves the form, declines the offer to start SMB, and waits for the panel.
 *
 * Declines because service state is global. The offer only appears while SMB
 * is stopped, which every caller establishes in `beforeEach`.
 *
 * Not handled, because no caller needs them: "Restart SMB Service" (raised
 * instead while the service is running) and "Configure ACL" (only when the
 * path already has an ACL). The form raises them in that order.
 */
export async function saveShareForm(page: Page): Promise<void> {
  const declineStart = page.locator(smbLocators.declineStartService);

  await page.locator(smbLocators.form.save).click();
  await expect(declineStart).toBeVisible({ timeout: saveTimeoutMs });
  await declineStart.click();

  await expect(page.locator(smbLocators.form.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Creates an SMB share pointing at a dataset's mountpoint, and starts the SMB
 * service when the app offers to. The counterpart of {@link saveShareForm},
 * which declines; this one is `fresh-install`'s, where a served share is the point.
 *
 * Starting the service matters: a share on a stopped service exists in the
 * configuration but serves nothing, so a journey that stops at "share created"
 * would report success on a NAS that is not actually sharing anything.
 */
export async function createSmbShareAndStartService(page: Page, path: string, name: string): Promise<void> {
  await goToShares(page);

  await page.locator(smbLocators.addShare).click();
  await expect(page.locator(smbLocators.form.path)).toBeVisible();

  await page.locator(smbLocators.form.path).fill(path);
  await page.locator(smbLocators.form.name).fill(name);

  await page.locator(smbLocators.form.save).click();

  // Creating a share prompts to configure its ACL. Decline: accepting navigates
  // away to the ACL editor, which is a separate journey. Asserted rather than
  // probed — if this prompt ever stops appearing, that is a flow change worth
  // failing on rather than silently tolerating.
  const declineAcl = page.locator(smbLocators.declineAclPrompt);
  await expect(declineAcl).toBeVisible({ timeout: startServiceSaveTimeoutMs });
  await declineAcl.click();

  // With the ACL prompt dismissed, the app notices the SMB service is stopped
  // and offers to start it. This dialog appears only when the service is not
  // already running (`checkIfServiceIsEnabled` -> `dialogService.startService`).
  const startService = page.locator(smbLocators.startService);
  await expect(startService).toBeVisible({ timeout: startServiceSaveTimeoutMs });
  await startService.click();

  await expect(page.locator(smbLocators.form.save)).toBeHidden({ timeout: startServiceSaveTimeoutMs });
}

/**
 * Opens the delete confirmation for a share, from its row menu on the
 * dashboard card.
 *
 * Two clicks, because four actions collapse into a kebab menu — which is also
 * what makes this a row-targeting test: the menu belongs to one row, and
 * opening the wrong one deletes the wrong share with no other symptom.
 */
export async function openDeleteShareDialog(page: Page, name: string): Promise<void> {
  await goToShares(page);

  await openShareRowMenu(page, name);
  await page.locator(smbLocators.card.rowMenuDelete(name)).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
}

/**
 * Confirms the open delete dialog and waits for it to go.
 *
 * Two steps, because this one carries the destructive-action tick box:
 * `confirmDelete` does not pass `hideCheckbox`, so Unshare stays **disabled**
 * until the box is ticked. Asserting that in between is the cheap way to keep
 * the guard honest — a dialog that stopped requiring it would still let this
 * flow through, and nothing else would notice.
 */
export async function confirmShareDeletion(page: Page): Promise<void> {
  const confirm = page.locator(confirmDialogLocators.confirm);

  await expect(confirm).toBeDisabled();
  await page.locator(confirmDialogLocators.checkbox).click();
  await expect(confirm).toBeEnabled();

  await confirm.click();
  await expect(page.locator(confirmDialogLocators.title)).toBeHidden({ timeout: saveTimeoutMs });
}
