/**
 * Credentials > Directory Services, driven through the UI: the Directory Services
 * Configuration form, and the Kerberos realms and keytabs behind the page's
 * Advanced Settings.
 *
 * Joining AD, LDAP or IPA needs a directory server the CI appliance does not
 * have, so the configuration form is only ever saved disabled, which binds to
 * nothing. The two Kerberos cards need no server, which is why they are saved.
 */
import { expect, type Page } from '@playwright/test';
import { goToDirectoryServices } from './navigation';
import { selectOption } from './storage';
import type { KerberosRealmSettings } from '../fixtures/kerberos';
import { confirmDialogLocators } from '../locators/dialogs';
import { directoryServicesLocators } from '../locators/directory-services';
import { apiCallsTo } from '../support/api-calls';

/**
 * Saving or deleting a Kerberos realm or keytab rewrites `krb5.conf` and
 * restarts a service; saving or clearing the configuration runs a job. None of
 * them is instant.
 */
const saveTimeoutMs = 60_000;

/** Long enough for the page's first reads to come back over a fresh socket. */
const pageLoadTimeoutMs = 30_000;

/**
 * Opens the Directory Services Configuration form from the disabled state's
 * button, starting from the sidebar, and waits for it to be ready to fill.
 */
export async function openDirectoryServicesForm(page: Page): Promise<void> {
  await goToDirectoryServices(page);
  await page.locator(directoryServicesLocators.configure).click();
  await expect(page.locator(directoryServicesLocators.configForm.serviceType)).toBeVisible();
}

/**
 * Opens the configuration form on what is already stored, starting from the
 * sidebar.
 *
 * The page shows its disabled state — and so the Configure button — before its
 * config has loaded, and the form takes whatever the page holds when the button
 * is pressed. So the page's own `directoryservices.status` and
 * `directoryservices.config` are waited on first, or the form could open empty on
 * a stored configuration. Needs `test.use({ recordApiCalls: true })`.
 */
export async function openStoredDirectoryServicesForm(page: Page): Promise<void> {
  await goToDirectoryServices(page);
  for (const method of ['directoryservices.status', 'directoryservices.config']) {
    const answers = (): (string | undefined)[] => apiCallsTo(page, method).map((call) => call.answer);
    await expect.poll(answers, { timeout: pageLoadTimeoutMs }).toContain('result');
  }

  await page.locator(directoryServicesLocators.configure).click();
  await expect(page.locator(directoryServicesLocators.configForm.serviceType)).toBeVisible();
}

/**
 * Saves the configuration form and waits for the panel to close.
 *
 * The save runs as a job behind a progress dialog; the panel closing is the
 * app's own signal that it succeeded — a refusal leaves it open.
 */
export async function saveDirectoryServicesForm(page: Page): Promise<void> {
  const { save } = directoryServicesLocators.configForm;
  await expect(page.locator(save)).toBeEnabled();
  await page.locator(save).click();
  await expect(page.locator(save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Presses the form's Clear Config, accepts the confirm, and waits for the panel
 * to close once the clearing job has finished.
 *
 * The confirm is raised without `hideCheckbox`, so Clear stays disabled until
 * the box is ticked — asserted on the way, as {@link confirmRowDelete} does.
 */
export async function clearDirectoryServicesConfig(page: Page): Promise<void> {
  const form = directoryServicesLocators.configForm;
  await page.locator(form.clearConfig).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();

  const confirm = page.locator(confirmDialogLocators.confirm);
  await expect(confirm).toBeDisabled();
  await page.locator(confirmDialogLocators.checkbox).click();
  await expect(confirm).toBeEnabled();

  await confirm.click();
  await expect(page.locator(form.serviceType)).toBeHidden({ timeout: saveTimeoutMs });
}

/** Closes a configuration form nothing was changed in. Unedited, the panel closes without asking. */
export async function closeDirectoryServicesForm(page: Page): Promise<void> {
  const form = directoryServicesLocators.configForm;
  await page.locator(form.closePanel).click();
  await expect(page.locator(form.serviceType)).toBeHidden();
}

/** Picks a Configuration Type by its label. */
export async function selectServiceType(page: Page, label: string): Promise<void> {
  const form = directoryServicesLocators.configForm;
  await selectOption(page, form.serviceType, form.serviceTypeOption(label));
}

/** Picks a Credential Type by its label. */
export async function selectCredentialType(page: Page, label: string): Promise<void> {
  const form = directoryServicesLocators.configForm;
  await selectOption(page, form.credentialType, form.credentialTypeOption(label));
}

/** Picks an IDMAP Backend by its label. Rendered only once Use TrueNAS Server IDMAP Defaults is unticked. */
export async function selectIdmapBackend(page: Page, label: string): Promise<void> {
  const { idmap } = directoryServicesLocators.configForm;
  await selectOption(page, idmap.backend, idmap.backendOption(label));
}

/**
 * Closes the configuration form without saving, and waits for it to go.
 *
 * Only for a form that has been edited: the panel then asks whether to discard
 * the changes, and that question is asserted rather than looked for.
 */
export async function discardDirectoryServicesForm(page: Page): Promise<void> {
  const form = directoryServicesLocators.configForm;
  await page.locator(form.closePanel).click();

  const discard = page.locator(confirmDialogLocators.confirm);
  await expect(discard).toBeVisible();
  await discard.click();
  await expect(page.locator(form.serviceType)).toBeHidden();
}

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
 * Follows a Kerberos card's title to its full page, starting from the sidebar and
 * going past the Advanced Settings warning. `title` is `realms.title` or
 * `keytabs.title`. The page's rows load after the route changes, so the caller
 * waits on a row it expects.
 */
export async function openKerberosPage(page: Page, title: string, route: RegExp): Promise<void> {
  await openKerberosSettings(page);
  await page.locator(title).click();
  await expect(page).toHaveURL(route);
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
 * In the open keytab form: picks `contents` as the file, named `<name>.keytab`.
 *
 * The file goes in through the file chooser the Choose File button opens, the way
 * a user picks one. That button has no id of its own — see
 * `directoryServicesLocators.keytabForm.file` — and sits at the left of the
 * field, so the click lands on the field's left edge.
 */
export async function chooseKerberosKeytabFile(page: Page, name: string, contents: Buffer): Promise<void> {
  const field = page.locator(directoryServicesLocators.keytabForm.file);
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
}

/** Adds a keytab from the card, uploading `contents` as the file, and waits for the panel to close. */
export async function addKerberosKeytab(page: Page, name: string, contents: Buffer): Promise<void> {
  const form = directoryServicesLocators.keytabForm;
  await openKerberosSettings(page);
  await page.locator(directoryServicesLocators.keytabs.add).click();

  await page.locator(form.name).fill(name);
  await chooseKerberosKeytabFile(page, name, contents);

  await saveKerberosForm(page, form.save);
}

/**
 * Opens the edit form for a keytab from its row.
 *
 * Waits on the name having been patched in, which is what says the panel is
 * editing *this* keytab. The name is all it patches: the file is never sent back.
 */
export async function openEditKerberosKeytabForm(page: Page, name: string): Promise<void> {
  await openKerberosSettings(page);
  await page.locator(directoryServicesLocators.keytabs.edit(name)).click();
  await expect(page.locator(directoryServicesLocators.keytabForm.name)).toHaveValue(name);
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
