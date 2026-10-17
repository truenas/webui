/**
 * Stories: a Directory Services save that middleware refuses says why on the
 * form and leaves nothing configured behind — an Active Directory join to a
 * domain that cannot exist, an LDAP bind to a server that cannot be reached, and
 * a disabled Active Directory configuration holding Kerberos user credentials.
 *
 * Middleware checks the credential before its `datastore.update`, so a refused
 * join writes nothing. The form showing an error says nothing about what was
 * stored, so every test asks the appliance afterwards as well.
 *
 * Every name is under `.invalid`, which RFC 2606 reserves and no resolver
 * answers — the CI appliance's qemu DNS included — so each save is refused on
 * any appliance, with no directory server and the nameservers left alone.
 *
 * Where the refusal shows depends on the field middleware files it under. The
 * domain and the server URLs belong to a child form, and `getFieldsMap()` sends
 * both to Configuration Type. The disabled configuration's is filed under
 * `credential.credential_type`, which that map does not name, so the form
 * reports it in the error dialog instead.
 */
import type { Page } from '@playwright/test';
import { ensureDirectoryServicesCleared, readDirectoryServices } from '../fixtures/directory-services';
import {
  discardDirectoryServicesForm,
  openDirectoryServicesForm,
  selectCredentialType,
  selectServiceType,
} from '../flows/directory-services';
import { selectOption } from '../flows/storage';
import { errorDialogLocators } from '../locators/dialogs';
import {
  credentialTypeLabels,
  directoryServicesLocators,
  directoryServiceTypeLabels,
  ldapSchemaLabels,
} from '../locators/directory-services';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData } from '../support/cleanup';
import { errorDialogClose } from '../support/constants';
import { expect, test } from '../support/fixtures';

/**
 * A ceiling on one refusal coming back. The Active Directory one runs `net ads
 * info`, and `get_domain_info` asks a second time after flushing its cache.
 */
const refusalTimeoutMs = 90_000;

const kerberosUser = {
  username: 'e2e-admin',
  password: 'e2e-Passw0rd',
};

const adHostname = 'e2eds';

/** An unresolvable host fails the bind at once, where an address nobody answers would wait out the timeout. */
const ldapServer = {
  url: 'ldap://ldap.e2e.invalid',
  baseDn: 'dc=e2e,dc=invalid',
  bindDn: 'cn=admin,dc=e2e,dc=invalid',
  bindPassword: 'e2e-Passw0rd',
};

/** `validate_ldap_credential()` on `ldap.SERVER_DOWN`, filed under `configuration.server_urls`. */
const ldapUnreachableMessage = 'TrueNAS cannot contact the LDAP server';

/** `common_validation()`, filed under `credential.credential_type`. */
const disabledKerberosUserMessage = 'Kerberos user credentials may not be stored for disabled directory services';

/** The baseline the fixture clears to, which a refused save must leave as it was. */
async function expectNothingConfigured(api: E2eApiClient): Promise<void> {
  const { config, status } = await readDirectoryServices(api);
  expect(config).toMatchObject({ enable: false, service_type: null, configuration: null });
  expect(status.type).toBeNull();
  expect(status.status ?? null).toBeNull();
}

/**
 * Picks Active Directory and fills everything it needs, with Kerberos User
 * credentials.
 *
 * Enable Service is ticked by the type selection after a debounce, so it is
 * waited on: unticking it any sooner would be undone.
 */
async function fillActiveDirectory(page: Page, domain: string): Promise<void> {
  const form = directoryServicesLocators.configForm;
  await selectServiceType(page, directoryServiceTypeLabels.activeDirectory);
  await expect(page.locator(form.enable)).toBeChecked();

  await selectCredentialType(page, credentialTypeLabels.kerberosUser);
  await page.locator(form.username).fill(kerberosUser.username);
  await page.locator(form.password).fill(kerberosUser.password);
  await page.locator(form.activeDirectory.hostname).fill(adHostname);
  await page.locator(form.activeDirectory.domain).fill(domain);
}

/** Picks LDAP and fills everything it needs, with LDAP Plain credentials, at the shortest timeout allowed. */
async function fillLdap(page: Page): Promise<void> {
  const form = directoryServicesLocators.configForm;
  await selectServiceType(page, directoryServiceTypeLabels.ldap);
  await expect(page.locator(form.enable)).toBeChecked();
  await page.locator(form.timeout).fill('5');

  await page.locator(form.ldap.serverUrls).fill(ldapServer.url);
  await page.locator(form.ldap.serverUrls).press('Enter');
  await page.locator(form.ldap.baseDn).fill(ldapServer.baseDn);
  await selectOption(page, form.ldap.schema, form.ldap.schemaOption(ldapSchemaLabels.rfc2307));
  await selectCredentialType(page, credentialTypeLabels.ldapPlain);
  await page.locator(form.bindDn).fill(ldapServer.bindDn);
  await page.locator(form.bindPassword).fill(ldapServer.bindPassword);
}

/**
 * Fills LDAP, saves, and waits for the refusal under Configuration Type.
 *
 * Asserted absent before the save, so the message afterwards is this refusal.
 * Save is disabled by the pinned error rather than by anything left unfilled —
 * it was enabled a moment before — and no error dialog was raised, which is
 * what says the error was mapped onto the form rather than dropped into a modal.
 */
async function refuseLdapBind(page: Page): Promise<void> {
  const form = directoryServicesLocators.configForm;
  const serviceTypeField = page.locator(form.serviceTypeField);
  const save = page.locator(form.save);

  await openDirectoryServicesForm(page);
  await fillLdap(page);
  await expect(serviceTypeField).not.toContainText(ldapUnreachableMessage);
  await expect(save).toBeEnabled();
  await save.click();

  await expect(serviceTypeField).toContainText(ldapUnreachableMessage, { timeout: refusalTimeoutMs });
  await expect(save).toBeDisabled();
  await expect(page.locator(errorDialogLocators.title)).toHaveCount(0);
}

/**
 * Cleared before each test as well as after, and unconditionally, so a save
 * that unexpectedly lands — the defect this spec looks for — is still removed.
 */
test.beforeEach(async ({ api }) => {
  await ensureDirectoryServicesCleared(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData('the directory services configuration')) {
    return;
  }

  await ensureDirectoryServicesCleared(api);
});

test('an Active Directory join to a domain that does not exist is refused on the form, and nothing is stored', async ({
  page,
  api,
}) => {
  const form = directoryServicesLocators.configForm;
  const serviceTypeField = page.locator(form.serviceTypeField);
  const save = page.locator(form.save);

  await openDirectoryServicesForm(page);
  await fillActiveDirectory(page, 'e2e-nonexistent.invalid');
  await page.locator(form.timeout).fill('10');
  await expect(save).toBeEnabled();

  // Middleware's wording depends on how the lookup fails, so only the error's
  // arrival is asserted: the field holds more text than it did before the save.
  const textBefore = (await serviceTypeField.innerText()).length;
  const fieldTextLength = async (): Promise<number> => (await serviceTypeField.innerText()).length;
  await save.click();

  await expect.poll(fieldTextLength, { timeout: refusalTimeoutMs }).toBeGreaterThan(textBefore);
  await expect(save).toBeDisabled();
  await expect(page.locator(errorDialogLocators.title)).toHaveCount(0);

  await discardDirectoryServicesForm(page);
  await expectNothingConfigured(api);
});

test('an LDAP bind to a server that cannot be reached is refused on the form, and nothing is stored', async ({
  page,
  api,
}) => {
  await refuseLdapBind(page);

  await discardDirectoryServicesForm(page);
  await expectNothingConfigured(api);
});

test('editing the credentials after a refused bind clears the error and enables Save again', async ({ page }) => {
  const form = directoryServicesLocators.configForm;
  await refuseLdapBind(page);

  // Any credential edit retires the backend's verdict: it described the payload that was sent, not this one.
  await page.locator(form.bindPassword).fill('e2e-Passw0rd-2');
  await expect(page.locator(form.serviceTypeField)).not.toContainText(ldapUnreachableMessage);
  await expect(page.locator(form.save)).toBeEnabled();

  await discardDirectoryServicesForm(page);
});

test('a disabled Active Directory configuration holding Kerberos user credentials is refused in a dialog', async ({
  page,
  api,
}) => {
  const form = directoryServicesLocators.configForm;
  const save = page.locator(form.save);

  await openDirectoryServicesForm(page);
  await fillActiveDirectory(page, 'e2e.invalid');
  await page.locator(form.enable).click();
  await expect(page.locator(form.enable)).not.toBeChecked();
  await expect(save).toBeEnabled();
  await save.click();

  await expect(page.locator(errorDialogLocators.message)).toContainText(disabledKerberosUserMessage, {
    timeout: refusalTimeoutMs,
  });
  await page.locator(errorDialogClose).click();
  await expect(page.locator(errorDialogLocators.title)).toBeHidden();
  // A refusal leaves the panel open; a save would have closed it.
  await expect(save).toBeVisible();

  await discardDirectoryServicesForm(page);
  await expectNothingConfigured(api);
});
