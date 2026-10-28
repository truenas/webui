/**
 * Story: with the appliance joined to Active Directory, the read-only
 * administrator opens Directory Services, sees the domain healthy on its card,
 * the Kerberos realm and the machine account's keytab, and finds every control
 * that would change them locked. The sharing administrator, who holds no more
 * here, finds the card locked the same way.
 *
 * Saving the configuration, leaving the domain and editing a realm or keytab
 * all need `DIRECTORY_SERVICE_WRITE`, which neither account holds. Leave and
 * Rebuild Directory Service Cache are the card menu's only items and are left
 * out of it without that role, so the card draws no menu at all; that absence is
 * what is asserted, since there is nothing to find locked. The card's Settings
 * and a row's Edit carry no role, so their forms open, with Save locked.
 *
 * Needs a real domain (`TN_AD_*`), and skips without one. It is in
 * `tests/unpublished/` because the domain's name is on the card and in the
 * form, and a published trace would keep it; for the same reason every hook and
 * test runs inside `withActiveDirectoryRedacted`. The appliance joins once, over
 * the API, for the whole file, under a fresh `e2eui-` computer name with DNS
 * updates off, and leaves before the nameservers are put back.
 *
 * Each test signs in once: every sign-in spends from the unauthenticated rate
 * limit. Nothing locked is ever clicked, so what each page would change is read
 * back over the API only as a guard that nothing got through.
 */
import type { Page } from '@playwright/test';
import { firstValueFrom, timeout } from 'rxjs';
import {
  adComputerName,
  domainOf,
  domainPattern,
  ensureActiveDirectoryJoined,
  leaveTheDomain,
  withActiveDirectoryRedacted,
} from '../../fixtures/active-directory';
import { type DirectoryServicesState, readDirectoryServices } from '../../fixtures/directory-services';
import { type NetworkSettings, readNetworkConfig, setNameservers } from '../../fixtures/network-config';
import {
  ensureRoleAdminAbsent, ensureRoleAdminPresent, type RoleAdmin, roleAdmins,
} from '../../fixtures/role-admins';
import { closeDirectoryServicesForm, openKerberosSettings } from '../../flows/directory-services';
import { goToDirectoryServices } from '../../flows/navigation';
import { expectHiddenByRole, expectLockedByRole, signInAsRoleAdmin } from '../../flows/roles';
import { directoryServicesLocators } from '../../locators/directory-services';
import type { E2eApiClient } from '../../support/api/client';
import { type CleanupStep, leavingTestData, runCleanupSteps } from '../../support/cleanup';
import type { ActiveDirectoryTarget } from '../../support/config';
import { expect, test } from '../../support/fixtures';
import { readTimeoutMs } from '../../support/timeouts';

const accounts = [roleAdmins.readOnly, roleAdmins.sharing];

/** The keytab a join adds, holding the machine account's keys. */
const machineKeytab = 'AD_MACHINE_ACCOUNT';

/** The card and both Kerberos lists load on their own API calls, after the shell. */
const pageSettleTimeoutMs = 60_000;

/** Every realm, in full. */
async function listRealms(api: E2eApiClient): Promise<unknown[]> {
  return firstValueFrom(api.api.query('kerberos.realm.query').pipe(timeout(readTimeoutMs)));
}

/**
 * Every keytab by id and name. The file is left out, so a failed comparison
 * never prints the machine account's keys.
 */
async function listKeytabs(api: E2eApiClient): Promise<{ id: number; name: string }[]> {
  const keytabs = await firstValueFrom(api.api.query('kerberos.keytab.query').pipe(timeout(readTimeoutMs)));
  return keytabs.map(({ id, name }) => ({ id: Number(id), name }));
}

/** The joined domain as the comparison after a test needs it: the stored service and the live status. */
function joinedState({ config, status }: DirectoryServicesState): Record<string, unknown> {
  return {
    service_type: config.service_type,
    enable: config.enable,
    domain: config.configuration && 'domain' in config.configuration ? config.configuration.domain : undefined,
    status: status.status,
  };
}

/**
 * Signs in as `account`, then checks the card shows the domain healthy, offers
 * no menu, and opens the configuration form with Save locked. Closes the form
 * unedited, so nothing is asked and nothing is saved.
 */
async function expectDomainSeenAndLocked(page: Page, account: RoleAdmin, ad: ActiveDirectoryTarget): Promise<void> {
  const { card, configForm } = directoryServicesLocators;

  await signInAsRoleAdmin(page, account);
  await goToDirectoryServices(page);
  await expect(page.locator(card.status)).toHaveText('HEALTHY', { timeout: pageSettleTimeoutMs });
  await expect(page.locator(card.domainName)).toHaveText(domainPattern(ad));

  // Leave is in the card's menu, which is not drawn at all without the role.
  await expectHiddenByRole(page, card.settings, card.actionsMenu);
  await expect(page.locator(card.leave)).toHaveCount(0);

  await page.locator(card.settings).click();
  await expect(page.locator(configForm.activeDirectory.domain)).toHaveValue(domainPattern(ad));
  await expectLockedByRole(page, configForm.save);
  await closeDirectoryServicesForm(page);
}

/** Closes a Kerberos form nothing was changed in, and waits for its Save to go. */
async function closeKerberosForm(page: Page, save: string): Promise<void> {
  await page.locator(directoryServicesLocators.configForm.closePanel).click();
  await expect(page.locator(save)).toBeHidden();
}

test.describe('restricted administrators on a joined Active Directory domain', () => {
  test.use({ authenticate: false });

  let networkBefore: NetworkSettings | undefined;

  // One join for the file: it costs minutes of middleware time, and no test here changes it. The
  // accounts are made here too, for the same reason. A failed test restarts the worker, which runs
  // afterAll and then beforeAll again, so a retry still starts clean.
  test.beforeAll(async ({ api, config }) => {
    // Every story here needs the appliance in a real domain, and only a run given one has it.
    test.skip(!config.activeDirectory, 'no Active Directory domain for this run (TN_AD_DOMAIN unset)');
    const ad = domainOf(config);

    for (const account of accounts) {
      await ensureRoleAdminAbsent(api, account);
      await ensureRoleAdminPresent(api, account);
    }

    await withActiveDirectoryRedacted(ad, async () => {
      networkBefore = await readNetworkConfig(api);
      await setNameservers(api, ad.nameservers);
      await ensureActiveDirectoryJoined(api, ad, adComputerName());
    });
  });

  test.afterAll(async ({ api, config }) => {
    const steps: CleanupStep[] = [];
    if (!leavingTestData(`users ${accounts.map((account) => account.username).join(', ')}`)) {
      steps.push(...accounts.map((account): CleanupStep => [
        `remove user ${account.username}`, () => ensureRoleAdminAbsent(api, account),
      ]));
    }
    // `leaveTheDomain` answers to TN_KEEP_TEST_DATA on its own.
    steps.push([
      'leave the domain and restore the nameservers',
      () => leaveTheDomain(api, config.activeDirectory, networkBefore),
    ]);

    await runCleanupSteps(steps);
  });

  test('the read-only administrator sees the joined domain, and cannot save it or leave it', async ({
    page, api, config,
  }) => {
    const ad = domainOf(config);
    await withActiveDirectoryRedacted(ad, async () => {
      const before = joinedState(await readDirectoryServices(api));
      expect(before).toMatchObject({ service_type: 'ACTIVEDIRECTORY', enable: true, status: 'HEALTHY' });

      await expectDomainSeenAndLocked(page, roleAdmins.readOnly, ad);

      expect(joinedState(await readDirectoryServices(api))).toEqual(before);
    });
  });

  test('the read-only administrator sees the Kerberos realm and keytab, and cannot change them', async ({
    page, api, config,
  }) => {
    const ad = domainOf(config);
    await withActiveDirectoryRedacted(ad, async () => {
      const realm = (await readDirectoryServices(api)).config.kerberos_realm;
      if (!realm) {
        throw new Error('The joined configuration names no Kerberos realm, so there is no realm row to check.');
      }
      const realmsBefore = await listRealms(api);
      const keytabsBefore = await listKeytabs(api);
      const {
        realms, keytabs, realmForm, keytabForm,
      } = directoryServicesLocators;

      await signInAsRoleAdmin(page, roleAdmins.readOnly);
      await openKerberosSettings(page);
      await expect(page.locator(realms.row(realm))).toBeVisible({ timeout: pageSettleTimeoutMs });
      await expect(page.locator(keytabs.row(machineKeytab))).toBeVisible({ timeout: pageSettleTimeoutMs });

      await expectLockedByRole(page, realms.add);
      await expectLockedByRole(page, realms.delete(realm));
      await expectLockedByRole(page, keytabs.add);
      await expectLockedByRole(page, keytabs.sync);
      await expectLockedByRole(page, keytabs.delete(machineKeytab));

      // Edit carries no role, so each form opens on its row, and only Save is held.
      await page.locator(realms.edit(realm)).click();
      await expect(page.locator(realmForm.realm)).toHaveValue(realm);
      await expectLockedByRole(page, realmForm.save);
      await closeKerberosForm(page, realmForm.save);

      await page.locator(keytabs.edit(machineKeytab)).click();
      await expect(page.locator(keytabForm.name)).toHaveValue(machineKeytab);
      await expectLockedByRole(page, keytabForm.save);
      await closeKerberosForm(page, keytabForm.save);

      expect(await listRealms(api)).toEqual(realmsBefore);
      expect(await listKeytabs(api)).toEqual(keytabsBefore);
    });
  });

  test('the sharing administrator sees the joined domain, and cannot save it or leave it', async ({
    page, api, config,
  }) => {
    const ad = domainOf(config);
    await withActiveDirectoryRedacted(ad, async () => {
      const before = joinedState(await readDirectoryServices(api));
      expect(before).toMatchObject({ service_type: 'ACTIVEDIRECTORY', enable: true, status: 'HEALTHY' });

      await expectDomainSeenAndLocked(page, roleAdmins.sharing, ad);

      expect(joinedState(await readDirectoryServices(api))).toEqual(before);
    });
  });
});
