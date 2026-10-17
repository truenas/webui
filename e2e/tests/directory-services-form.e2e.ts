/**
 * Stories: with no directory service configured, Credentials > Directory
 * Services shows its disabled state; the configuration form it opens renders the
 * section, credential types and IDMAP fields of whichever type is picked; and it
 * keeps Save disabled until the form is complete and the timeout is in range.
 *
 * Joining needs a domain controller, LDAP or IPA server the CI appliance does
 * not have, so nothing here is saved. Every journey closes the form unsaved, and
 * the last one asks the appliance afterwards whether anything changed. Saving a
 * disabled configuration and Clear Config are their own spec; Advanced Settings
 * belongs to `kerberos.e2e.ts`.
 *
 * Every visibility check that a switch hides or reveals something is paired with
 * the opposite check before the switch, so it cannot pass on a field that was
 * always there or never was.
 */
import type { Page } from '@playwright/test';
import { ensureDirectoryServicesCleared, readDirectoryServices } from '../fixtures/directory-services';
import {
  discardDirectoryServicesForm,
  openDirectoryServicesForm,
  selectCredentialType,
  selectIdmapBackend,
  selectServiceType,
} from '../flows/directory-services';
import { goToDirectoryServices } from '../flows/navigation';
import { selectOption } from '../flows/storage';
import {
  credentialTypeLabels,
  directoryServicesLocators,
  directoryServiceTypeLabels,
  idmapBackendLabels,
  ldapSchemaLabels,
} from '../locators/directory-services';
import { leavingTestData } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Under `.test`, which RFC 2606 reserves, so nothing these name can exist. Never saved. */
const ldapServer = {
  url: 'ldap://ldap.e2e.test',
  baseDn: 'dc=e2e,dc=test',
  bindDn: 'cn=admin,dc=e2e,dc=test',
  bindPassword: 'e2e-bind-password',
};

/** `Validators.min(5)` and `Validators.max(60)` on Timeout, as the app's form-field error resolver words them. */
const timeoutTooLowMessage = 'Minimum value is 5';
const timeoutTooHighMessage = 'Maximum value is 60';

async function expectAllVisible(page: Page, locators: string[]): Promise<void> {
  for (const locator of locators) {
    await expect(page.locator(locator)).toBeVisible();
  }
}

async function expectAllHidden(page: Page, locators: string[]): Promise<void> {
  for (const locator of locators) {
    await expect(page.locator(locator)).toBeHidden();
  }
}

/**
 * Cleared before each test as well as after, so a run that saved something
 * leaves the next one starting from the disabled state, and unconditionally so a
 * failure still cleans up.
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

test('with nothing configured, the page says directory services are disabled and offers to configure them', async ({
  page,
  api,
}) => {
  await goToDirectoryServices(page);

  await expect(page.locator(directoryServicesLocators.disabled)).toContainText('Directory services are disabled.');
  await expect(page.locator(directoryServicesLocators.configure)).toBeVisible();

  const { config, status } = await readDirectoryServices(api);
  expect(config).toMatchObject({ enable: false, service_type: null });
  expect(status.type).toBeNull();
  expect(status.status ?? null).toBeNull();
});

test('switching the Configuration Type swaps the sections and the credential types on offer', async ({ page }) => {
  const form = directoryServicesLocators.configForm;
  const { activeDirectory, ldap, ipa } = form;
  const ldapCredentialTypes = [
    credentialTypeLabels.ldapPlain,
    credentialTypeLabels.ldapAnonymous,
    credentialTypeLabels.ldapMtls,
  ];

  await openDirectoryServicesForm(page);
  // Unticked on a new configuration, so a tick afterwards is the type selection's doing.
  await expect(page.locator(form.enable)).not.toBeChecked();
  await expectAllHidden(page, [form.credentialType, activeDirectory.hostname, ldap.serverUrls, ipa.targetServer]);

  await selectServiceType(page, directoryServiceTypeLabels.activeDirectory);
  await expect(page.locator(form.enable)).toBeChecked();
  await expectAllVisible(page, [
    activeDirectory.hostname,
    activeDirectory.domain,
    activeDirectory.site,
    activeDirectory.computerAccountOu,
    activeDirectory.useDefaultDomain,
    form.idmap.useDefaults,
  ]);

  // Active Directory offers Kerberos credentials and nothing LDAP.
  await page.locator(form.credentialType).click();
  await expect(page.locator(form.credentialTypeOption(credentialTypeLabels.kerberosUser))).toBeVisible();
  await expect(page.locator(form.credentialTypeOption(credentialTypeLabels.kerberosPrincipal))).toBeVisible();
  for (const label of ldapCredentialTypes) {
    await expect(page.locator(form.credentialTypeOption(label))).toHaveCount(0);
  }
  await page.locator(form.credentialTypeOption(credentialTypeLabels.kerberosPrincipal)).click();
  await expect(page.locator(form.principal)).toBeVisible();
  await expectAllHidden(page, [form.username, form.password]);

  await selectCredentialType(page, credentialTypeLabels.kerberosUser);
  await expectAllVisible(page, [form.username, form.password]);
  await expect(page.locator(form.principal)).toBeHidden();

  await selectServiceType(page, directoryServiceTypeLabels.ldap);
  await expectAllVisible(page, [ldap.serverUrls, ldap.baseDn, ldap.startTls, ldap.validateCertificates, ldap.schema]);
  await expectAllHidden(page, [
    activeDirectory.hostname,
    activeDirectory.site,
    activeDirectory.computerAccountOu,
    activeDirectory.useDefaultDomain,
    form.idmap.useDefaults,
  ]);

  await page.locator(form.credentialType).click();
  for (const label of ldapCredentialTypes) {
    await expect(page.locator(form.credentialTypeOption(label))).toBeVisible();
  }
  await page.locator(form.credentialTypeOption(credentialTypeLabels.ldapPlain)).click();
  await expectAllVisible(page, [form.bindDn, form.bindPassword]);
  await expectAllHidden(page, [form.username, form.password]);

  const searchBases = [ldap.baseUser, ldap.baseGroup, ldap.baseNetgroup];
  await expectAllHidden(page, searchBases);
  await page.locator(ldap.useStandardSearchBases).click();
  await expectAllVisible(page, searchBases);

  await selectServiceType(page, directoryServiceTypeLabels.ipa);
  await expectAllVisible(page, [
    ipa.targetServer,
    activeDirectory.hostname,
    activeDirectory.domain,
    ldap.baseDn,
    ldap.validateCertificates,
    ipa.useDefaultSmbDomain,
  ]);
  await expectAllHidden(page, [ldap.serverUrls, ldap.schema, activeDirectory.site]);

  const smbDomain = [
    ipa.smbDomainName,
    ipa.smbDomainDomainName,
    ipa.smbDomainRangeLow,
    ipa.smbDomainRangeHigh,
    ipa.smbDomainSid,
  ];
  await expectAllHidden(page, smbDomain);
  await page.locator(ipa.useDefaultSmbDomain).click();
  await expectAllVisible(page, smbDomain);

  await discardDirectoryServicesForm(page);
});

test('the Active Directory IDMAP section shows the fields of the backend picked', async ({ page }) => {
  const { idmap } = directoryServicesLocators.configForm;
  const domain = [
    idmap.builtinName,
    idmap.builtinRangeLow,
    idmap.builtinRangeHigh,
    idmap.backend,
    idmap.name,
    idmap.rangeLow,
    idmap.rangeHigh,
  ];
  const adOnly = [idmap.schemaMode, idmap.unixPrimaryGroup, idmap.unixNssInfo];
  const rfc2307Only = [
    idmap.ldapUrl,
    idmap.ldapUserDn,
    idmap.ldapUserDnPassword,
    idmap.bindPathUser,
    idmap.bindPathGroup,
  ];

  await openDirectoryServicesForm(page);
  await selectServiceType(page, directoryServiceTypeLabels.activeDirectory);

  // Ticked on a new configuration, which hides everything below it.
  await expect(page.locator(idmap.useDefaults)).toBeChecked();
  await expectAllHidden(page, domain);
  await page.locator(idmap.useDefaults).click();
  await expectAllVisible(page, domain);

  await selectIdmapBackend(page, idmapBackendLabels.ad);
  await expectAllVisible(page, adOnly);
  await expectAllHidden(page, [...rfc2307Only, idmap.sssdCompat]);

  await selectIdmapBackend(page, idmapBackendLabels.rfc2307);
  await expectAllVisible(page, rfc2307Only);
  await expectAllHidden(page, [...adOnly, idmap.sssdCompat]);

  await selectIdmapBackend(page, idmapBackendLabels.rid);
  await expect(page.locator(idmap.sssdCompat)).toBeVisible();
  await expectAllHidden(page, [...adOnly, ...rfc2307Only]);

  await discardDirectoryServicesForm(page);
});

test('Save stays disabled until LDAP is complete and the timeout is in range, and closing saves nothing', async ({
  page,
  api,
}) => {
  const form = directoryServicesLocators.configForm;
  const save = page.locator(form.save);
  const timeoutInput = page.locator(form.timeout);
  const timeoutField = page.locator(form.timeoutField);

  await openDirectoryServicesForm(page);
  await selectServiceType(page, directoryServiceTypeLabels.ldap);
  await expect(save).toBeDisabled();

  await page.locator(form.ldap.serverUrls).fill(ldapServer.url);
  await page.locator(form.ldap.serverUrls).press('Enter');
  await page.locator(form.ldap.baseDn).fill(ldapServer.baseDn);
  await selectOption(page, form.ldap.schema, form.ldap.schemaOption(ldapSchemaLabels.rfc2307));
  await selectCredentialType(page, credentialTypeLabels.ldapPlain);
  await page.locator(form.bindDn).fill(ldapServer.bindDn);
  await page.locator(form.bindPassword).fill(ldapServer.bindPassword);
  // Complete at the default timeout, so the timeout alone is what disables it below.
  await expect(save).toBeEnabled();

  await timeoutInput.fill('4');
  await timeoutInput.blur();
  await expect(timeoutField).toContainText(timeoutTooLowMessage);
  await expect(save).toBeDisabled();

  await timeoutInput.fill('61');
  await timeoutInput.blur();
  await expect(timeoutField).toContainText(timeoutTooHighMessage);
  await expect(save).toBeDisabled();

  await timeoutInput.fill('10');
  await timeoutInput.blur();
  await expect(timeoutField).not.toContainText(timeoutTooLowMessage);
  await expect(timeoutField).not.toContainText(timeoutTooHighMessage);
  await expect(save).toBeEnabled();

  await discardDirectoryServicesForm(page);

  const { config } = await readDirectoryServices(api);
  expect(config).toMatchObject({ enable: false, service_type: null });
});
