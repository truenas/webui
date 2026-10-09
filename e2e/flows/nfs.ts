/**
 * NFS shares, driven through the UI.
 *
 * A share is addressed by its path and, on the card, its description as well —
 * see `locators/nfs.ts` for why the description is part of a row's identity.
 */
import { expect, type Page } from '@playwright/test';
import { goToShares } from './navigation';
import { formSettleTimeoutMs } from './smb';
import { confirmDialogLocators } from '../locators/dialogs';
import { nfsLocators } from '../locators/nfs';

/** Saving a share writes to middleware and then asks about the service. */
const saveTimeoutMs = 60_000;

/** Longer where the save also starts the service, which is a job of its own. */
const startServiceSaveTimeoutMs = 90_000;

/** Which share on the card: its path, and its description where it has one. */
export interface NfsShareRow {
  path: string;
  description?: string;
}

/** Opens a share's row menu on the dashboard card, on the Shares page's slow-settle budget. */
async function openShareRowMenu(page: Page, { path, description }: NfsShareRow): Promise<void> {
  const trigger = page.locator(nfsLocators.card.rowMenu(path, description));

  await expect(trigger).toBeVisible({ timeout: formSettleTimeoutMs });
  await trigger.click();
}

/** Flips a share's Enabled switch on the dashboard card, on the same settle budget. */
export async function toggleNfsShareEnabled(page: Page, { path, description }: NfsShareRow): Promise<void> {
  const toggle = page.locator(nfsLocators.card.enabledToggle(path, description));

  await expect(toggle).toBeVisible({ timeout: formSettleTimeoutMs });
  await toggle.click();
}

/** Opens the add-share panel from the Shares dashboard, as a user would. */
export async function openAddNfsShareForm(page: Page): Promise<void> {
  await goToShares(page);

  await expect(page.locator(nfsLocators.addShare)).toBeVisible({ timeout: formSettleTimeoutMs });
  await page.locator(nfsLocators.addShare).click();
  await expect(page.locator(nfsLocators.form.path)).toBeVisible({ timeout: formSettleTimeoutMs });
}

/**
 * Opens the edit panel for a share, from its row menu on the dashboard card.
 *
 * Waits for the path to be filled in rather than for the field to exist: the
 * panel is the same component as the add form, so the field renders either way
 * and only its value says the share that was picked is the one that loaded.
 */
export async function openEditNfsShareForm(page: Page, share: NfsShareRow): Promise<void> {
  await goToShares(page);

  await openShareRowMenu(page, share);
  await page.locator(nfsLocators.card.rowMenuEdit(share.path, share.description)).click();
  await expect(page.locator(nfsLocators.form.path)).toHaveValue(share.path, { timeout: formSettleTimeoutMs });
}

/**
 * Types a path into the form and leaves the field.
 *
 * Leaving it is part of the entry, not tidiness: the picker hands its value to
 * the form when the input loses focus, so until then the path is on screen but
 * the form still holds the old one — and Save answers for the old one.
 */
export async function fillNfsSharePath(page: Page, path: string): Promise<void> {
  const field = page.locator(nfsLocators.form.path);

  await field.fill(path);
  await field.blur();
}

/**
 * Reveals the Access section.
 *
 * Waits on a control inside it rather than on the toggle's own state, since the
 * section is not in the DOM at all until the form is in advanced mode.
 */
export async function showNfsAdvancedOptions(page: Page): Promise<void> {
  await page.locator(nfsLocators.form.advancedToggle).click();
  await expect(page.locator(nfsLocators.form.readOnly)).toBeVisible({ timeout: formSettleTimeoutMs });
}

/**
 * Adds a network to the export's allow-list, as an address and a prefix length.
 *
 * Two controls for one value: the form joins them into `address/bits` on the
 * way out, and a network with no prefix chosen is not a valid one. `index` is
 * the position the new entry lands at — 0 for the first.
 */
export async function addNfsNetwork(
  page: Page,
  { index, address, prefixBits }: { index: number; address: string; prefixBits: number },
): Promise<void> {
  await page.locator(nfsLocators.form.addNetwork).click();
  await page.locator(nfsLocators.form.networkAddress(index)).fill(address);

  await page.locator(nfsLocators.form.networkPrefix(index)).click();
  const option = page.locator(nfsLocators.form.networkPrefixOption(index, prefixBits));
  await expect(option).toBeVisible({ timeout: formSettleTimeoutMs });
  await option.click();
}

/** Adds a host to the export's allow-list, at the position it lands at. */
export async function addNfsHost(page: Page, { index, host }: { index: number; host: string }): Promise<void> {
  await page.locator(nfsLocators.form.addHost).click();
  await page.locator(nfsLocators.form.host(index)).fill(host);
}

/**
 * Saves the form, declines the offer to start NFS, and waits for the panel.
 *
 * Declines because service state is global. The offer only appears while NFS is
 * stopped, which every caller establishes in `beforeEach`; running, the form
 * simply closes and this would wait out a dialog that never renders.
 */
export async function saveNfsShareForm(page: Page): Promise<void> {
  const declineStart = page.locator(nfsLocators.declineStartService);

  await page.locator(nfsLocators.form.save).click();
  await expect(declineStart).toBeVisible({ timeout: saveTimeoutMs });
  await declineStart.click();

  await expect(page.locator(nfsLocators.form.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Saves the form and accepts the offer to start NFS.
 *
 * The counterpart of {@link saveNfsShareForm}. A share on a stopped service is
 * configuration that exports nothing, so the offer is the last step of actually
 * sharing a path. The dialog is left exactly as it opens — including its "start
 * automatically" toggle, which is on.
 */
export async function saveNfsShareFormAndStartService(page: Page): Promise<void> {
  const startService = page.locator(nfsLocators.startService);

  await page.locator(nfsLocators.form.save).click();
  await expect(startService).toBeVisible({ timeout: saveTimeoutMs });
  await startService.click();

  await expect(startService).toBeHidden({ timeout: startServiceSaveTimeoutMs });
  await expect(page.locator(nfsLocators.form.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Opens the delete confirmation for a share, from its row menu on the
 * dashboard card. The menu belongs to one row, and opening the wrong one
 * deletes the wrong share with no other symptom.
 *
 * The dialog it raises is confirmed with `confirmShareDeletion` from
 * `flows/smb.ts` — the same component, tick box and all.
 */
export async function openDeleteNfsShareDialog(page: Page, share: NfsShareRow): Promise<void> {
  await goToShares(page);

  await openShareRowMenu(page, share);
  await page.locator(nfsLocators.card.rowMenuDelete(share.path, share.description)).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
}
