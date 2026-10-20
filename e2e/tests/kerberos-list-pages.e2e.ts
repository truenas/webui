/**
 * Stories: the full Kerberos Realms and Kerberos Keytabs pages, reached from the
 * titles of their cards behind Advanced Settings on Credentials > Directory
 * Services.
 *
 * Each page is its card's component with `inCard` off, so the row ids are the
 * card's. What the page adds is a search: over the realm and its three server
 * lists for realms, over the name alone for keytabs.
 *
 * Every realm and host is under `.test` — see `fixtures/kerberos.ts`. Editing a
 * keytab opens the card's form and is covered on the card; Sync renders only
 * while AD is joined, which the CI appliance never is.
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
import { confirmTaskDelete, searchTaskList } from '../flows/data-protection';
import { openKerberosPage } from '../flows/directory-services';
import { directoryServicesLocators } from '../locators/directory-services';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const targetRealm: KerberosRealmSettings = {
  realm: 'E2E-PAGE-TARGET.TEST',
  primaryKdc: 'kdc0.e2e-page-target.test',
  kdc: ['kdc1.e2e-page-target.test'],
  adminServer: ['admin.e2e-page-target.test'],
  passwordServer: ['kpasswd.e2e-page-target.test'],
};

const bystanderRealm: KerberosRealmSettings = {
  realm: 'E2E-PAGE-BYSTANDER.TEST',
  primaryKdc: 'kdc0.e2e-page-bystander.test',
  kdc: ['kdc1.e2e-page-bystander.test'],
  adminServer: ['admin.e2e-page-bystander.test'],
  passwordServer: ['kpasswd.e2e-page-bystander.test'],
};

const allRealms = [targetRealm.realm, bystanderRealm.realm];

/** The bystander's name contains the target's, so one query matches both and another only the bystander. */
const targetKeytab = 'e2e_page_keytab';
const bystanderKeytab = 'e2e_page_keytab_bystander';

const allKeytabs = [targetKeytab, bystanderKeytab];

const keytabContents = buildKeytab('host/e2e-page.test', targetRealm.realm);

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

test.beforeEach(async ({ api }) => {
  await removeEverything(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the Kerberos realms ${allRealms.join(', ')} and keytabs ${allKeytabs.join(', ')}`)) {
    return;
  }

  await removeEverything(api);
});

test('the Kerberos Realms card title opens the full page, where search narrows and Delete removes the realm that was picked', async ({
  page,
  api,
}) => {
  await ensureKerberosRealmPresent(api, targetRealm);
  await ensureKerberosRealmPresent(api, bystanderRealm);

  const { realms } = directoryServicesLocators;
  await openKerberosPage(page, realms.title, /\/directoryservice\/kerberosrealms\/?$/);

  await expect(page.locator(realms.row(targetRealm.realm))).toBeVisible();
  await expect(page.locator(realms.row(bystanderRealm.realm))).toBeVisible();

  await searchTaskList(page, 'page-target');
  await expect(page.locator(realms.row(targetRealm.realm))).toBeVisible();
  await expect(page.locator(realms.row(bystanderRealm.realm))).toBeHidden();

  await page.locator(realms.delete(targetRealm.realm)).click();
  await confirmTaskDelete(page, realms.row(targetRealm.realm));

  expect(await findKerberosRealm(api, targetRealm.realm)).toBeUndefined();
  expect(await findKerberosRealm(api, bystanderRealm.realm)).toBeDefined();
});

test('the Kerberos Keytabs card title opens the full page, where search narrows by name and Delete removes the keytab that was picked', async ({
  page,
  api,
}) => {
  await ensureKerberosKeytabPresent(api, targetKeytab, keytabContents);
  await ensureKerberosKeytabPresent(api, bystanderKeytab, keytabContents);

  const { keytabs } = directoryServicesLocators;
  await openKerberosPage(page, keytabs.title, /\/directoryservice\/kerberoskeytabs\/?$/);

  // Both names contain the target's, so both stay.
  await searchTaskList(page, targetKeytab);
  await expect(page.locator(keytabs.row(targetKeytab))).toBeVisible();
  await expect(page.locator(keytabs.row(bystanderKeytab))).toBeVisible();

  await searchTaskList(page, 'bystander');
  await expect(page.locator(keytabs.row(bystanderKeytab))).toBeVisible();
  await expect(page.locator(keytabs.row(targetKeytab))).toBeHidden();

  await searchTaskList(page, '');
  await page.locator(keytabs.delete(targetKeytab)).click();
  await confirmTaskDelete(page, keytabs.row(targetKeytab));

  expect(await findKerberosKeytab(api, targetKeytab)).toBeUndefined();
  expect(await findKerberosKeytab(api, bystanderKeytab)).toBeDefined();
});
