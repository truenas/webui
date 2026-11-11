/**
 * Stories: an admin saves an LDAP configuration with Enable Service unticked, stored as entered without contacting
 * a server; reopening the form shows it; and Clear Config removes it. Middleware validates credentials only when
 * enabled, so disabled LDAP Plain is the one config CI can store with no server (AD and IPA refusals are
 * `directory-services-refusals.e2e.ts`). The page stays in its disabled state, so the form is where values show.
 */
import {
  ensureDirectoryServicesCleared,
  readDirectoryServices,
  seedDisabledLdapConfig,
  type DisabledLdapConfig,
} from '../fixtures/directory-services';
import {
  clearDirectoryServicesConfig,
  closeDirectoryServicesForm,
  openDirectoryServicesForm,
  openStoredDirectoryServicesForm,
  saveDirectoryServicesForm,
  selectCredentialType,
  selectServiceType,
} from '../flows/directory-services';
import { selectOption } from '../flows/storage';
import {
  credentialTypeLabels,
  directoryServicesLocators,
  directoryServiceTypeLabels,
  ldapSchemaLabels,
} from '../locators/directory-services';
import { leavingTestData } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

test.use({ recordApiCalls: true });

/**
 * Under `.invalid`, which RFC 2606 reserves, so nothing these name can exist. The
 * bind password is a throwaway: a disabled configuration never reaches a server.
 */
const ldap: DisabledLdapConfig = {
  serverUrl: 'ldaps://ldap.e2e.invalid',
  baseDn: 'dc=e2e,dc=invalid',
  bindDn: 'cn=reader,dc=e2e,dc=invalid',
  bindPassword: 'e2e-Passw0rd',
  timeout: 15,
};

/**
 * Cleared before each test as well as after, and unconditionally, so every run
 * starts from and leaves behind `service_type: null` whatever the outcome.
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

test('a disabled LDAP configuration saved through the form is stored as entered, and the page stays disabled', async ({
  page,
  api,
}) => {
  const form = directoryServicesLocators.configForm;

  await openDirectoryServicesForm(page);
  // Picking a type ticks Enable Service after a debounce, so the tick is waited
  // on before it is undone — unticking any sooner would be overwritten.
  await selectServiceType(page, directoryServiceTypeLabels.ldap);
  await expect(page.locator(form.enable)).toBeChecked();
  await page.locator(form.enable).click();
  await expect(page.locator(form.enable)).not.toBeChecked();

  // Ticked on a new configuration, so `false` in the API afterwards is this click.
  await expect(page.locator(form.enableAccountCache)).toBeChecked();
  await page.locator(form.enableAccountCache).click();
  await expect(page.locator(form.enableAccountCache)).not.toBeChecked();
  await page.locator(form.timeout).fill(String(ldap.timeout));

  await page.locator(form.ldap.serverUrls).fill(ldap.serverUrl);
  await page.locator(form.ldap.serverUrls).press('Enter');
  await page.locator(form.ldap.baseDn).fill(ldap.baseDn);
  await selectOption(page, form.ldap.schema, form.ldap.schemaOption(ldapSchemaLabels.rfc2307));
  await selectCredentialType(page, credentialTypeLabels.ldapPlain);
  await page.locator(form.bindDn).fill(ldap.bindDn);
  await page.locator(form.bindPassword).fill(ldap.bindPassword);

  await saveDirectoryServicesForm(page);

  await expect(page.locator(directoryServicesLocators.disabled)).toBeVisible();

  const { config, status } = await readDirectoryServices(api);
  expect(config).toMatchObject({
    service_type: 'LDAP',
    enable: false,
    enable_account_cache: false,
    timeout: ldap.timeout,
    configuration: {
      server_urls: [ldap.serverUrl],
      basedn: ldap.baseDn,
      schema: 'RFC2307',
    },
    credential: {
      credential_type: 'LDAP_PLAIN',
      binddn: ldap.bindDn,
    },
  });
  // Not pinned to one of the two: nothing has read it off an appliance yet,
  // and either says the service is not running.
  expect([null, 'DISABLED']).toContain(status.status ?? null);
});

test('reopening the form on a stored disabled LDAP configuration shows its values, and closing saves nothing', async ({
  page,
  api,
}) => {
  const form = directoryServicesLocators.configForm;
  await seedDisabledLdapConfig(api, ldap);
  const { config: seeded } = await readDirectoryServices(api);

  await openStoredDirectoryServicesForm(page);

  await expect(page.locator(form.serviceType)).toHaveText(directoryServiceTypeLabels.ldap);
  await expect(page.locator(form.enable)).not.toBeChecked();
  await expect(page.locator(form.enableAccountCache)).not.toBeChecked();
  await expect(page.locator(form.timeout)).toHaveValue(String(ldap.timeout));
  await expect(page.locator(form.ldap.serverUrlChip(ldap.serverUrl))).toContainText(ldap.serverUrl);
  await expect(page.locator(form.ldap.baseDn)).toHaveValue(ldap.baseDn);
  await expect(page.locator(form.credentialType)).toHaveText(credentialTypeLabels.ldapPlain);
  await expect(page.locator(form.bindDn)).toHaveValue(ldap.bindDn);

  await closeDirectoryServicesForm(page);

  const { config } = await readDirectoryServices(api);
  expect(config).toEqual(seeded);
});

test('Clear Config removes a stored disabled LDAP configuration', async ({ page, api }) => {
  await seedDisabledLdapConfig(api, ldap);
  const { config: seeded } = await readDirectoryServices(api);
  // The seed landed, so `null` afterwards is the clear's doing.
  expect(seeded.service_type).toBe('LDAP');

  await openStoredDirectoryServicesForm(page);
  await expect(page.locator(directoryServicesLocators.configForm.serviceType)).toHaveText(
    directoryServiceTypeLabels.ldap,
  );
  await clearDirectoryServicesConfig(page);

  await expect(page.locator(directoryServicesLocators.disabled)).toBeVisible();

  const { config } = await readDirectoryServices(api);
  expect(config).toMatchObject({
    service_type: null,
    enable: false,
    configuration: null,
    credential: null,
  });
});
