/**
 * Kerberos realms and keytabs, driven through the UI from Credentials > Directory
 * Services, behind its Advanced Settings.
 *
 * Joining AD, LDAP or IPA needs a directory server the CI appliance does not
 * have. The two Kerberos cards do not, which is why they are what is covered.
 */
import { expect, type Page } from '@playwright/test';
import { goToDirectoryServices } from './navigation';
import type { KerberosRealmSettings } from '../fixtures/kerberos';
import { confirmDialogLocators } from '../locators/dialogs';
import { directoryServicesLocators } from '../locators/directory-services';

/** Saving or deleting either one rewrites `krb5.conf` and restarts a service, not instant. */
const saveTimeoutMs = 60_000;

/**
 * Opens Advanced Settings, starting from the sidebar, and accepts the warning it
 * raises.
 *
 * The panel opens on the click, before the warning is answered, and closes again
 * if it is cancelled — so the cards being on screen says nothing until the
 * warning has gone. The warning is raised with `hideCheckbox: true`, so Continue
 * is live from the start.
 */
export async function openKerberosSettings(page: Page): Promise<void> {
  await goToDirectoryServices(page);
  await page.locator(directoryServicesLocators.showAdvancedSettings).click();

  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeHidden();

  await expect(page.locator(directoryServicesLocators.realms.add)).toBeVisible();
}

/**
 * Saves whichever Kerberos form is open and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded — a refusal
 * leaves it open with the error attached.
 */
export async function saveKerberosForm(page: Page, save: string): Promise<void> {
  await page.locator(save).click();
  await expect(page.locator(save)).toBeHidden({ timeout: saveTimeoutMs });
}

/** Types each value into a chip field and commits it with Enter. */
async function addChips(page: Page, field: string, values: string[]): Promise<void> {
  for (const value of values) {
    await page.locator(field).fill(value);
    await page.locator(field).press('Enter');
  }
}

/** Adds a realm from the card, with every field the form has, and waits for the panel to close. */
export async function addKerberosRealm(page: Page, settings: KerberosRealmSettings): Promise<void> {
  const form = directoryServicesLocators.realmForm;
  await openKerberosSettings(page);
  await page.locator(directoryServicesLocators.realms.add).click();

  await page.locator(form.realm).fill(settings.realm);
  await page.locator(form.primaryKdc).fill(settings.primaryKdc);
  await addChips(page, form.kdc, settings.kdc);
  await addChips(page, form.adminServer, settings.adminServer);
  await addChips(page, form.passwordServer, settings.passwordServer);

  await saveKerberosForm(page, form.save);
}

/**
 * Opens the edit form for a realm from its row.
 *
 * Waits on the realm name having been patched in, which is what says the panel
 * is editing *this* realm rather than showing an empty form.
 */
export async function openEditKerberosRealmForm(page: Page, realm: string): Promise<void> {
  await openKerberosSettings(page);
  await page.locator(directoryServicesLocators.realms.edit(realm)).click();
  await expect(page.locator(directoryServicesLocators.realmForm.realm)).toHaveValue(realm);
}

/**
 * Adds a keytab from the card, uploading `contents` as the file, and waits for
 * the panel to close.
 *
 * The file goes in through the file chooser the Choose File button opens, the way
 * a user picks one. That button has no id of its own — see
 * `directoryServicesLocators.keytabForm.file` — and sits at the left of the
 * field, so the click lands on the field's left edge.
 */
export async function addKerberosKeytab(page: Page, name: string, contents: Buffer): Promise<void> {
  const form = directoryServicesLocators.keytabForm;
  await openKerberosSettings(page);
  await page.locator(directoryServicesLocators.keytabs.add).click();

  await page.locator(form.name).fill(name);

  const field = page.locator(form.file);
  const box = await field.boundingBox();
  expect(box, 'the keytab file field has no box to click').not.toBeNull();

  const chooserOpened = page.waitForEvent('filechooser');
  await field.click({ position: { x: 8, y: (box?.height ?? 0) / 2 } });
  const chooser = await chooserOpened;
  await chooser.setFiles({
    name: `${name}.keytab`,
    mimeType: 'application/octet-stream',
    buffer: contents,
  });

  await saveKerberosForm(page, form.save);
}

/**
 * Accepts webui's shared confirm raised by a row's Delete, and waits for the row
 * to go.
 *
 * `confirmDelete` does not pass `hideCheckbox`, so Delete stays **disabled**
 * until the box is ticked — asserted on the way, so a dialog that lost its gate
 * fails here rather than passing a test that never needed it. The card reloads
 * only once the delete has returned, so the row is what is waited on.
 */
async function confirmRowDelete(page: Page, row: string): Promise<void> {
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();

  const confirm = page.locator(confirmDialogLocators.confirm);
  await expect(confirm).toBeDisabled();
  await page.locator(confirmDialogLocators.checkbox).click();
  await expect(confirm).toBeEnabled();

  await confirm.click();
  await expect(page.locator(row)).toBeHidden({ timeout: saveTimeoutMs });
}

/** Deletes a realm from its row. */
export async function deleteKerberosRealm(page: Page, realm: string): Promise<void> {
  await openKerberosSettings(page);
  await page.locator(directoryServicesLocators.realms.delete(realm)).click();
  await confirmRowDelete(page, directoryServicesLocators.realms.row(realm));
}

/** Deletes a keytab from its row. */
export async function deleteKerberosKeytab(page: Page, name: string): Promise<void> {
  await openKerberosSettings(page);
  await page.locator(directoryServicesLocators.keytabs.delete(name)).click();
  await confirmRowDelete(page, directoryServicesLocators.keytabs.row(name));
}
