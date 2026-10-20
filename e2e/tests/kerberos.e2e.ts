/**
 * Stories: an admin opens Advanced Settings on Credentials > Directory Services,
 * past its warning, and adds, edits and deletes a Kerberos realm and adds, edits
 * and deletes a keytab — and the appliance holds what they did.
 *
 * Joining AD, LDAP or IPA needs a directory server the CI appliance does not
 * have; these two cards do not, which is why they are what is covered. The
 * AD-only Sync button is left alone: it renders only while AD is joined.
 *
 * Each save is asserted twice: the card's row says the screen believed it,
 * `kerberos.*.query` says the appliance did it. Edit and delete each run beside
 * a second realm that must come through untouched, since an action belongs to
 * whichever row's button was pressed and a row-targeting bug changes the wrong
 * realm without failing anything else.
 *
 * Every realm and host is under `.test` — see `fixtures/kerberos.ts`.
 */
import {
  buildKeytab,
  ensureKerberosKeytabAbsent,
  ensureKerberosKeytabPresent,
  ensureKerberosRealmAbsent,
  ensureKerberosRealmPresent,
  findKerberosKeytab,
  findKerberosRealm,
  type KerberosRealmSettings,
} from '../fixtures/kerberos';
import {
  addKerberosKeytab,
  addKerberosRealm,
  chooseKerberosKeytabFile,
  deleteKerberosKeytab,
  deleteKerberosRealm,
  openEditKerberosKeytabForm,
  openEditKerberosRealmForm,
  saveKerberosForm,
} from '../flows/directory-services';
import { directoryServicesLocators } from '../locators/directory-services';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Created through the form, never over the API — that is the thing under test. */
const created: KerberosRealmSettings = {
  realm: 'E2E-CREATED.TEST',
  primaryKdc: 'kdc0.e2e-created.test',
  kdc: ['kdc1.e2e-created.test', 'kdc2.e2e-created.test'],
  adminServer: ['admin.e2e-created.test'],
  passwordServer: ['kpasswd.e2e-created.test'],
};

/** Provisioned over the API so there is something to edit or delete. */
const target: KerberosRealmSettings = {
  realm: 'E2E-TARGET.TEST',
  primaryKdc: 'kdc0.e2e-target.test',
  kdc: ['kdc1.e2e-target.test'],
  adminServer: ['admin.e2e-target.test'],
  passwordServer: ['kpasswd.e2e-target.test'],
};

/** The realm that must survive whatever is done to the target. */
const bystander: KerberosRealmSettings = {
  realm: 'E2E-BYSTANDER.TEST',
  primaryKdc: 'kdc0.e2e-bystander.test',
  kdc: ['kdc1.e2e-bystander.test'],
  adminServer: ['admin.e2e-bystander.test'],
  passwordServer: ['kpasswd.e2e-bystander.test'],
};

const allRealms = [created.realm, target.realm, bystander.realm];

/** One name for both keytab tests: they never need two at once. */
const keytabName = 'e2e-keytab';

/** Seeded over the API for the edit and the delete, and uploaded through the form for the add. */
const keytabContents = buildKeytab('host/e2e.test', target.realm);

/** What the edit renames {@link keytabName} to, and the different file it uploads with it. */
const editedKeytabName = 'e2e-keytab-edited';
const editedKeytabContents = buildKeytab('host/e2e-edited.test', target.realm);

const allKeytabs = [keytabName, editedKeytabName];

async function removeEverything(api: E2eApiClient): Promise<void> {
  await runCleanupSteps([
    ...allRealms.map((realm): [string, () => Promise<void>] => [
      `remove the Kerberos realm ${realm}`, () => ensureKerberosRealmAbsent(api, realm),
    ]),
    ...allKeytabs.map((name): [string, () => Promise<void>] => [
      `remove the Kerberos keytab ${name}`, () => ensureKerberosKeytabAbsent(api, name),
    ]),
  ]);
}

/** Both realms over the API: acting on one from the card is the thing under test. */
async function seedTargetAndBystander(api: E2eApiClient): Promise<void> {
  await ensureKerberosRealmPresent(api, target);
  await ensureKerberosRealmPresent(api, bystander);
}

/**
 * Removed before each test as well as after, so an interrupted run leaves the
 * next one able to start, and unconditionally so a failure still cleans up.
 */
test.beforeEach(async ({ api }) => {
  await removeEverything(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the Kerberos realms ${allRealms.join(', ')} and keytabs ${allKeytabs.join(', ')}`)) {
    return;
  }

  await removeEverything(api);
});

test('an admin adds a Kerberos realm, and the appliance really has one', async ({ page, api }) => {
  const { realms } = directoryServicesLocators;

  await addKerberosRealm(page, created);

  await expect(page.locator(realms.realm(created.realm))).toHaveText(created.realm);
  await expect(page.locator(realms.kdc(created.realm))).toHaveText(created.kdc.join(', '));
  await expect(page.locator(realms.adminServer(created.realm))).toHaveText(created.adminServer.join(', '));
  await expect(page.locator(realms.passwordServer(created.realm))).toHaveText(created.passwordServer.join(', '));

  expect(await findKerberosRealm(api, created.realm)).toMatchObject({
    realm: created.realm,
    primary_kdc: created.primaryKdc,
    kdc: created.kdc,
    admin_server: created.adminServer,
    kpasswd_server: created.passwordServer,
  });
});

test('editing a Kerberos realm from the card changes the realm that was picked', async ({ page, api }) => {
  await seedTargetAndBystander(api);
  const before = await findKerberosRealm(api, target.realm);
  const addedKdc = 'kdc9.e2e-target.test';
  const editedPrimaryKdc = 'kdc8.e2e-target.test';

  await openEditKerberosRealmForm(page, target.realm);
  await page.locator(directoryServicesLocators.realmForm.primaryKdc).fill(editedPrimaryKdc);
  await page.locator(directoryServicesLocators.realmForm.kdc).fill(addedKdc);
  await page.locator(directoryServicesLocators.realmForm.kdc).press('Enter');
  await saveKerberosForm(page, directoryServicesLocators.realmForm.save);

  const editedKdc = [...target.kdc, addedKdc];
  await expect(page.locator(directoryServicesLocators.realms.kdc(target.realm))).toHaveText(editedKdc.join(', '));

  // The same record, by id: an update, not a delete and a create that happen to
  // leave the card looking the same.
  expect(await findKerberosRealm(api, target.realm)).toMatchObject({
    id: before?.id,
    primary_kdc: editedPrimaryKdc,
    kdc: editedKdc,
    // Left alone on edit, so they have to come back out the way they went in.
    admin_server: target.adminServer,
    kpasswd_server: target.passwordServer,
  });

  expect(await findKerberosRealm(api, bystander.realm)).toMatchObject({
    primary_kdc: bystander.primaryKdc,
    kdc: bystander.kdc,
    admin_server: bystander.adminServer,
    kpasswd_server: bystander.passwordServer,
  });
});

test('deleting a Kerberos realm from the card removes the realm that was picked', async ({ page, api }) => {
  await seedTargetAndBystander(api);

  await deleteKerberosRealm(page, target.realm);

  // Polled rather than read once: a row can also be hidden while the table is
  // between loads, which proves nothing.
  await expect.poll(() => findKerberosRealm(api, target.realm)).toBeUndefined();

  // The whole point of the second realm: the card looks right either way.
  await expect(page.locator(directoryServicesLocators.realms.row(bystander.realm))).toBeVisible();
  expect(await findKerberosRealm(api, bystander.realm)).toMatchObject({ kdc: bystander.kdc });
});

test('an admin uploads a Kerberos keytab, and the appliance really has it', async ({ page, api }) => {
  await addKerberosKeytab(page, keytabName, keytabContents);

  await expect(page.locator(directoryServicesLocators.keytabs.name(keytabName))).toHaveText(keytabName);

  // The bytes that were picked, as middleware stored them — not just a record
  // by the right name.
  expect(await findKerberosKeytab(api, keytabName)).toMatchObject({
    name: keytabName,
    file: keytabContents.toString('base64'),
  });
});

test('an admin edits a keytab, renaming it and uploading a new file', async ({ page, api }) => {
  const { keytabs, keytabForm } = directoryServicesLocators;
  await ensureKerberosKeytabPresent(api, keytabName, keytabContents);
  const before = await findKerberosKeytab(api, keytabName);

  await openEditKerberosKeytabForm(page, keytabName);

  // The file is required and is never patched back in, so even a rename alone
  // cannot be saved until one is chosen again.
  await expect(page.locator(keytabForm.save)).toBeDisabled();

  await page.locator(keytabForm.name).fill(editedKeytabName);
  await chooseKerberosKeytabFile(page, editedKeytabName, editedKeytabContents);
  await saveKerberosForm(page, keytabForm.save);

  await expect(page.locator(keytabs.name(editedKeytabName))).toHaveText(editedKeytabName);
  await expect(page.locator(keytabs.row(keytabName))).toBeHidden();

  // The same record, by id, now holding the new bytes: an update, not a second keytab.
  expect(await findKerberosKeytab(api, editedKeytabName)).toMatchObject({
    id: before?.id,
    file: editedKeytabContents.toString('base64'),
  });
  expect(await findKerberosKeytab(api, keytabName)).toBeUndefined();
});

test('deleting a Kerberos keytab from the card removes it', async ({ page, api }) => {
  await ensureKerberosKeytabPresent(api, keytabName, keytabContents);

  await deleteKerberosKeytab(page, keytabName);

  await expect.poll(() => findKerberosKeytab(api, keytabName)).toBeUndefined();
});
