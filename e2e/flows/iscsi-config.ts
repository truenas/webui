/**
 * The full iSCSI page's Portals, Initiators and Authorized Access tabs, and its
 * Global Target Configuration panel, driven through the UI.
 */
import { expect, type Page } from '@playwright/test';
import { goToShares } from './navigation';
import { formSettleTimeoutMs } from './smb';
import { selectOption } from './storage';
import { confirmDialogLocators } from '../locators/dialogs';
import { iscsiConfigLocators, type IscsiConfigTab, type IscsiRowLocators } from '../locators/iscsi-config';

/** A side panel or the initiator page closing after Save: one call, and a list reload. */
const saveTimeoutMs = 30_000;

/** Opens the full iSCSI page from the Shares dashboard, the way a user reaches it. It opens on Targets. */
async function goToIscsiPage(page: Page): Promise<void> {
  await goToShares(page);

  const open = page.locator(iscsiConfigLocators.openPage);
  await expect(open).toBeVisible({ timeout: formSettleTimeoutMs });
  await open.click();
  await expect(page).toHaveURL(/\/sharing\/iscsi\/targets\/?$/);
}

/** Opens one tab of the full iSCSI page, through its Targets tab. */
export async function goToIscsiTab(page: Page, tab: IscsiConfigTab): Promise<void> {
  await goToIscsiPage(page);

  await page.locator(iscsiConfigLocators.tab(tab)).click();
  await expect(page).toHaveURL(new RegExp(`/sharing/iscsi/${tab}/?$`));
}

async function openRowMenuItem(page: Page, row: IscsiRowLocators, item: 'edit' | 'delete'): Promise<void> {
  await expect(page.locator(row.row)).toBeVisible({ timeout: formSettleTimeoutMs });
  await page.locator(row.menu).click();
  await page.locator(row[item]).click();
}

/** Deletes a row from its action menu, through the confirmation that has to be ticked first. */
async function deleteRow(page: Page, row: IscsiRowLocators): Promise<void> {
  await openRowMenuItem(page, row, 'delete');
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();

  const confirm = page.locator(confirmDialogLocators.confirm);
  await expect(confirm).toBeDisabled();
  await page.locator(confirmDialogLocators.checkbox).click();
  await expect(confirm).toBeEnabled();
  await confirm.click();

  await expect(page.locator(row.row)).toBeHidden({ timeout: saveTimeoutMs });
}

async function saveSidePanel(page: Page, save: string): Promise<void> {
  await expect(page.locator(save)).toBeEnabled();
  await page.locator(save).click();
  await expect(page.locator(save)).toBeHidden({ timeout: saveTimeoutMs });
}

/** Adds a portal from the Portals tab, with a description and one listen address. */
export async function addIscsiPortal(
  page: Page,
  { comment, address }: { comment: string; address: string },
): Promise<void> {
  const { portals, portalForm } = iscsiConfigLocators;
  await goToIscsiTab(page, 'portals');

  await expect(page.locator(portals.add)).toBeVisible({ timeout: formSettleTimeoutMs });
  await page.locator(portals.add).click();

  await expect(page.locator(portalForm.comment)).toBeVisible({ timeout: formSettleTimeoutMs });
  await page.locator(portalForm.comment).fill(comment);
  await page.locator(portalForm.addListen).click();
  await selectOption(page, portalForm.listen(0), portalForm.listenOption(0, address));
  await saveSidePanel(page, portalForm.save);

  await expect(page.locator(portals.row(comment).row)).toBeVisible({ timeout: saveTimeoutMs });
}

/** Changes a portal's description from its row's Edit, and nothing else. */
export async function editIscsiPortalDescription(page: Page, from: string, to: string): Promise<void> {
  const { portals, portalForm } = iscsiConfigLocators;
  await goToIscsiTab(page, 'portals');

  await openRowMenuItem(page, portals.row(from), 'edit');
  // The panel patches the portal in once it has loaded; typing before that is overwritten.
  await expect(page.locator(portalForm.comment)).toHaveValue(from, { timeout: formSettleTimeoutMs });
  await page.locator(portalForm.comment).fill(to);
  await saveSidePanel(page, portalForm.save);

  await expect(page.locator(portals.row(to).row)).toBeVisible({ timeout: saveTimeoutMs });
}

/** Deletes a portal from its row. */
export async function deleteIscsiPortal(page: Page, comment: string): Promise<void> {
  await goToIscsiTab(page, 'portals');
  await deleteRow(page, iscsiConfigLocators.portals.row(comment));
}

/** Types each IQN into the initiator page and moves it into Allowed Initiators with the plus button. */
async function addAllowedInitiators(page: Page, iqns: string[]): Promise<void> {
  const { initiatorForm } = iscsiConfigLocators;

  for (const iqn of iqns) {
    await page.locator(initiatorForm.newInitiator).fill(iqn);
    await page.locator(initiatorForm.addInitiator).click();
    // The page clears the input once it has taken the IQN.
    await expect(page.locator(initiatorForm.newInitiator)).toHaveValue('');
  }
}

async function saveInitiatorPage(page: Page): Promise<void> {
  const { initiatorForm } = iscsiConfigLocators;

  await expect(page.locator(initiatorForm.save)).toBeEnabled();
  await page.locator(initiatorForm.save).click();
  // A save navigates back to the list.
  await expect(page).toHaveURL(/\/sharing\/iscsi\/initiators\/?$/, { timeout: saveTimeoutMs });
}

/** Adds an initiator group on the routed add page, allowing the given IQNs. */
export async function addIscsiInitiatorGroup(
  page: Page,
  { comment, iqns }: { comment: string; iqns: string[] },
): Promise<void> {
  const { initiators, initiatorForm } = iscsiConfigLocators;
  await goToIscsiTab(page, 'initiators');

  await expect(page.locator(initiators.add)).toBeVisible({ timeout: formSettleTimeoutMs });
  await page.locator(initiators.add).click();
  await expect(page).toHaveURL(/\/sharing\/iscsi\/initiators\/add\/?$/);

  await expect(page.locator(initiatorForm.newInitiator)).toBeVisible({ timeout: formSettleTimeoutMs });
  await addAllowedInitiators(page, iqns);
  await page.locator(initiatorForm.comment).fill(comment);
  await saveInitiatorPage(page);
}

/** An edit to an initiator group: its id, its description before and after, and IQNs to allow as well. */
export interface IscsiInitiatorGroupEdit {
  id: number;
  from: string;
  to: string;
  addIqns: string[];
}

/** Edits an initiator group from its row: a new description, and more allowed IQNs. */
export async function editIscsiInitiatorGroup(page: Page, edit: IscsiInitiatorGroupEdit): Promise<void> {
  const { initiators, initiatorForm } = iscsiConfigLocators;
  await goToIscsiTab(page, 'initiators');

  await openRowMenuItem(page, initiators.row(edit.id), 'edit');
  await expect(page).toHaveURL(new RegExp(`/sharing/iscsi/initiators/edit/${edit.id}/?$`));
  // Loaded once the description is in; changing anything before that is overwritten.
  await expect(page.locator(initiatorForm.comment)).toHaveValue(edit.from, { timeout: formSettleTimeoutMs });

  await addAllowedInitiators(page, edit.addIqns);
  await page.locator(initiatorForm.comment).fill(edit.to);
  await saveInitiatorPage(page);
}

/** What the Add authorized access form is filled with. Discovery Authentication is Mutual CHAP. */
export interface IscsiMutualChapEntry {
  tag: number;
  user: string;
  secret: string;
  peeruser: string;
  peersecret: string;
}

/** Adds an authorized access entry with CHAP and mutual CHAP from the Authorized Access tab. */
export async function addIscsiMutualChapAccess(page: Page, entry: IscsiMutualChapEntry): Promise<void> {
  const { authorizedAccess, authorizedAccessForm: form } = iscsiConfigLocators;
  await goToIscsiTab(page, 'authorized-access');

  await expect(page.locator(authorizedAccess.add)).toBeVisible({ timeout: formSettleTimeoutMs });
  await page.locator(authorizedAccess.add).click();

  await expect(page.locator(form.tag)).toBeVisible({ timeout: formSettleTimeoutMs });
  await page.locator(form.tag).fill(String(entry.tag));
  await selectOption(page, form.discoveryAuth, form.discoveryAuthMutualChap);
  await page.locator(form.user).fill(entry.user);
  await page.locator(form.secret).fill(entry.secret);
  await page.locator(form.secretConfirm).fill(entry.secret);

  await expect(page.locator(form.peeruser)).toBeVisible();
  await page.locator(form.peeruser).fill(entry.peeruser);
  await page.locator(form.peersecret).fill(entry.peersecret);
  await page.locator(form.peersecretConfirm).fill(entry.peersecret);
  await saveSidePanel(page, form.save);

  await expect(page.locator(authorizedAccess.row(entry.user, entry.peeruser).row)).toBeVisible({
    timeout: saveTimeoutMs,
  });
}

/** Deletes an authorized access entry from its row. Pass `''` as `peeruser` for an entry with no peer. */
export async function deleteIscsiAuthorizedAccess(page: Page, user: string, peeruser: string): Promise<void> {
  await goToIscsiTab(page, 'authorized-access');
  await deleteRow(page, iscsiConfigLocators.authorizedAccess.row(user, peeruser));
}

/**
 * Adds an iSNS server and sets the pool available-space threshold from the
 * Global Target Configuration panel, leaving the base name and listen port as
 * they are.
 *
 * `basename` is what the panel should load with, which is how to tell it has
 * loaded before anything is typed.
 */
export async function saveIscsiGlobalConfiguration(
  page: Page,
  { basename, isnsServer, poolAvailThreshold }: { basename: string; isnsServer: string; poolAvailThreshold: number },
): Promise<void> {
  const { globalConfiguration, globalConfigurationForm: form } = iscsiConfigLocators;
  await goToIscsiPage(page);

  await page.locator(globalConfiguration).click();
  await expect(page.locator(form.basename)).toHaveValue(basename, { timeout: formSettleTimeoutMs });

  await page.locator(form.isnsServers).fill(isnsServer);
  await page.locator(form.isnsServers).press('Enter');
  await page.locator(form.poolAvailThreshold).fill(String(poolAvailThreshold));
  // Save checks that middleware can open a connection to the iSNS server.
  await saveSidePanel(page, form.save);
}
