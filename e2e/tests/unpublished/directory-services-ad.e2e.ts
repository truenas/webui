/**
 * Stories: joining an Active Directory domain through the Directory Services
 * form, leaving it from the card's Leave dialog, and a join refused because one
 * of the appliance's nameservers cannot resolve the domain. While joined, the
 * domain's accounts in the UI: a domain user found on the Users list and kept
 * or dropped by its Filter by Type, a domain group on the Groups list with
 * nothing offered that would change it, an ACL entry naming a domain group
 * picked in the editor, and Sync on the Kerberos Keytab card, which renders
 * only while joined.
 *
 * The accounts are the one the domain is joined with and `domain users`, which
 * every domain has, listed by the appliance under the domain's NetBIOS name.
 *
 * Needs a real domain (`TN_AD_*`), and skips without one. In CI that is the
 * internal test domain from the `E2EUI_AD_*` repository secrets, so this spec
 * is in `tests/unpublished/`, whose project publishes nothing: its
 * credentials are typed into the form, and a trace would keep them. For the
 * same reason no `TN_AD_*` value goes into a title or a step name, and every
 * hook and test runs inside `withActiveDirectoryRedacted`: JUnit is published,
 * and a failure's message would otherwise name the domain or a controller.
 *
 * The domain is shared and outlives the run. Every join is under a fresh
 * `e2eui-` computer name, with DNS updates off, and teardown leaves the domain
 * — which deletes the computer account — before anything else. The join and
 * leave stories share one join; see `joining and leaving`.
 *
 * The appliance resolves through qemu's DNS, which knows nothing of an internal
 * domain, so each test first points the nameservers at the domain controllers,
 * and teardown puts back what was there.
 */
import type { Page } from '@playwright/test';
import { escapeRegExp } from 'lodash-es';
import { firstValueFrom, timeout } from 'rxjs';
import {
  adComputerName,
  adJoinTimeoutMs,
  domainAccountName,
  domainOf,
  domainPattern,
  ensureActiveDirectoryJoined,
  ensureActiveDirectoryLeft,
  leaveTheDomain,
  withActiveDirectoryRedacted,
} from '../../fixtures/active-directory';
import { readDirectoryServices } from '../../fixtures/directory-services';
import { entitlementFeature, isNotDenied } from '../../fixtures/entitlements';
import { type NetworkSettings, readNetworkConfig, setNameservers } from '../../fixtures/network-config';
import {
  nfs4Entries, readAcl, readOwnership, setOwnership, type Ownership,
} from '../../fixtures/permissions';
import { ensurePrivilegeAbsent, ensurePrivilegePresent, findPrivilege } from '../../fixtures/privileges';
import { listQuotas } from '../../fixtures/quotas';
import {
  ensureSmbShareAbsent, ensureSmbSharePresent, readSmbShareAcl, type SmbShareAce,
} from '../../fixtures/smb';
import {
  datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent, ensureSmbDatasetPresent, type Nfs4Ace,
} from '../../fixtures/storage';
import { expectSignedInAs, signIn, signOut } from '../../flows/auth';
import {
  discardDirectoryServicesForm,
  openDirectoryServicesForm,
  openKerberosSettings,
  saveDirectoryServicesForm,
  selectCredentialType,
  selectServiceType,
} from '../../flows/directory-services';
import { goToDirectoryServices, goToGroups, goToUsers } from '../../flows/navigation';
import {
  addAclGroupEntry, chooseGroup, openAclEditor, openPermissionsEditor, saveAcl, savePermissions,
} from '../../flows/permissions';
import { openAddPrivilegeForm, savePrivilegeForm, toggleRoles } from '../../flows/privileges';
import {
  fillQuotas, openAddQuotaForm, openQuotasPage, saveQuotaForm,
} from '../../flows/quotas';
import { openServiceForm, saveServiceForm } from '../../flows/services';
import { addShareAclGroupEntry, openShareAclForm, saveShareAcl } from '../../flows/smb';
import { confirmDialogLocators, errorDialogLocators } from '../../locators/dialogs';
import {
  credentialTypeLabels,
  directoryServicesLocators,
  directoryServiceTypeLabels,
} from '../../locators/directory-services';
import { jobDialogLocators } from '../../locators/encryption';
import { groupsLocators } from '../../locators/groups';
import { privilegeLocators } from '../../locators/privileges';
import { servicesLocators } from '../../locators/services';
import { usersLocators } from '../../locators/users';
import type { E2eApiClient } from '../../support/api/client';
import { leavingTestData, runCleanupSteps } from '../../support/cleanup';
import type { ActiveDirectoryTarget, TargetConfig } from '../../support/config';
import { expect, test } from '../../support/fixtures';
import { readTimeoutMs, slowCallTimeoutMs } from '../../support/timeouts';

/**
 * An address in TEST-NET-1 (RFC 5737): nothing answers it, so a lookup through
 * it fails on any network.
 */
const deadNameserver = '192.0.2.53';

/**
 * The card after a join or a leave. The page re-reads its state once the panel
 * or dialog has closed, but the status settles a moment after the job does.
 */
const cardTimeoutMs = 60_000;

/**
 * Picks Active Directory and fills it in to join the run's domain as
 * `hostname`, with Kerberos User credentials.
 *
 * Enable Service is ticked by the type selection after a debounce, so it is
 * waited on. Enable DNS Updates is unticked: on, a join would register the
 * appliance's NAT address in the shared domain's DNS. The form starts from the
 * stored configuration, and a cleared one still has it on.
 */
async function fillActiveDirectoryJoin(page: Page, ad: ActiveDirectoryTarget, hostname: string): Promise<void> {
  const form = directoryServicesLocators.configForm;
  await selectServiceType(page, directoryServiceTypeLabels.activeDirectory);
  await expect(page.locator(form.enable)).toBeChecked();
  await page.locator(form.enableDnsUpdates).setChecked(false);

  await selectCredentialType(page, credentialTypeLabels.kerberosUser);
  await page.locator(form.username).fill(ad.username);
  await page.locator(form.password).fill(ad.password);
  await page.locator(form.activeDirectory.hostname).fill(hostname);
  await page.locator(form.activeDirectory.domain).fill(ad.domain);
  if (ad.computerOu) {
    await page.locator(form.activeDirectory.computerAccountOu).fill(ad.computerOu);
  }
}

/**
 * Waits for the Leave dialog to close once Leave is pressed.
 *
 * A refused leave raises the error dialog over it and keeps it open, which on its own reads as a
 * leave still running until the timeout. A leave right after the join test's form join stayed
 * open five minutes on every first attempt, while one over the API just after took seconds. So a
 * refusal fails at once with middleware's message, and a timeout says whether the job dialog was
 * still up. The caller's `withActiveDirectoryRedacted` takes the domain out of either.
 */
async function waitForLeave(page: Page): Promise<void> {
  const { leaveDialog } = directoryServicesLocators;
  const refused = page.locator(errorDialogLocators.title);

  await expect.poll(async () => {
    if (await refused.isVisible()) {
      return 'refused';
    }
    if (!await page.locator(leaveDialog.title).isVisible()) {
      return 'closed';
    }
    return await page.locator(jobDialogLocators.title).isVisible()
      ? 'open, with the job dialog up'
      : 'open, with no job dialog';
  }, {
    message: 'the Leave dialog to close',
    timeout: adJoinTimeoutMs,
    intervals: [1_000],
  }).toMatch(/^(closed|refused)$/);

  if (await refused.isVisible()) {
    const message = await page.locator(errorDialogLocators.message).innerText();
    throw new Error(`Leaving the domain was refused: ${message}`);
  }
}

/**
 * Skips a run with no domain. Otherwise points the nameservers at the domain,
 * leaves anything a previous run left joined — which needs the domain's DNS —
 * and clears the configuration. Returns the nameservers as it found them.
 */
async function startOffTheDomain(api: E2eApiClient, config: TargetConfig): Promise<NetworkSettings> {
  // Every story here joins a real domain, and only a run given one has it.
  test.skip(!config.activeDirectory, 'no Active Directory domain for this run (TN_AD_DOMAIN unset)');
  const ad = domainOf(config);
  return withActiveDirectoryRedacted(ad, async () => {
    const before = await readNetworkConfig(api);
    await setNameservers(api, ad.nameservers);
    await ensureActiveDirectoryLeft(api, ad);
    return before;
  });
}

/**
 * A group every Active Directory domain has, under the name the appliance lists it by after the
 * NetBIOS name. Naming it gives nothing away, unlike the domain's own accounts.
 */
const domainUsersGroup = 'domain users';

/** The keytab a join adds, holding the machine account's keys. */
const machineKeytab = 'AD_MACHINE_ACCOUNT';

/**
 * The Users and Groups lists, over a domain with thousands of accounts. The Groups list loads every
 * group at once.
 */
const accountListTimeoutMs = 60_000;

/**
 * The domain's `name` as the appliance lists it, `NAME\name`, in the case middleware stores it,
 * with its uid or gid. Fails when the appliance has no such non-local account, which would leave
 * every assertion about it vacuous.
 */
async function findDomainAccount(
  api: E2eApiClient,
  kind: 'user' | 'group',
  name: string,
): Promise<{ name: string; id: number }> {
  const pattern = `(?i)^${escapeRegExp(await domainAccountName(api, name))}$`;
  if (kind === 'user') {
    const [user] = await firstValueFrom(
      api.api.query('user.query', [['username', '~', pattern], ['local', '=', false]]).pipe(timeout(readTimeoutMs)),
    );
    if (user?.username && typeof user.uid === 'number') {
      return { name: user.username, id: user.uid };
    }
  } else {
    const [group] = await firstValueFrom(
      api.api.query('group.query', [['group', '~', pattern], ['local', '=', false]]).pipe(timeout(readTimeoutMs)),
    );
    if (group?.group && typeof group.gid === 'number') {
      return { name: group.group, id: group.gid };
    }
  }
  throw new Error(`The appliance lists no domain ${kind} "${name}" (account cache not filled?)`);
}

/**
 * Sets Filter by Type on the Users list to exactly the types asked for. It is a multiple select,
 * where a click toggles an option, so each is clicked only when it is not already as wanted.
 * Local goes first, so the two are never both off on the way.
 */
async function chooseUserTypes(page: Page, wanted: { local: boolean; directory: boolean }): Promise<void> {
  const { search } = usersLocators;
  await page.locator(search.typeFilter).click();
  for (const [label, selected] of [['Local', wanted.local], ['Directory Services', wanted.directory]] as const) {
    const option = page.locator(search.typeOption(label));
    if (await option.getAttribute('aria-selected') !== String(selected)) {
      await option.click();
    }
    await expect(option).toHaveAttribute('aria-selected', String(selected));
  }
  await page.keyboard.press('Escape');
}

/**
 * Turns directory services sign-in on or off, and says what it was. Directory users cannot sign in
 * to the UI while it is off, whatever privilege they hold.
 */
async function setDsAuth(api: E2eApiClient, enabled: boolean): Promise<boolean> {
  const { ds_auth: before } = await firstValueFrom(api.api.call('system.general.config').pipe(timeout(readTimeoutMs)));
  await firstValueFrom(api.api.call('system.general.update', [{ ds_auth: enabled }]).pipe(timeout(slowCallTimeoutMs)));
  return before;
}

/** The newest job's id, so a test can tell the jobs its own click started from any before. */
async function lastJobId(api: E2eApiClient): Promise<number> {
  const [job] = await firstValueFrom(
    api.api.query('core.get_jobs', [], { order_by: ['-id'], limit: 1 }).pipe(timeout(readTimeoutMs)),
  );
  return job?.id ?? 0;
}

/** The states of the `directoryservices.sync_keytab` jobs started after job `after`. */
async function syncKeytabJobsSince(api: E2eApiClient, after: number): Promise<string[]> {
  const jobs = await firstValueFrom(
    api.api.query('core.get_jobs', [['method', '=', 'directoryservices.sync_keytab'], ['id', '>', after]])
      .pipe(timeout(readTimeoutMs)),
  );
  return jobs.map((job) => job.state);
}

/**
 * The join test leaves the appliance in the domain, and the leave test leaves
 * that join: a join takes minutes of middleware time, and both tests paying it
 * once each doubled the spec. So the domain's nameservers, and the join, last
 * from `beforeAll` to `afterAll` rather than one test, and the stories that need
 * the appliance joined run between the two.
 *
 * Serial, so a failure retries the group from the join rather than the one test.
 * Playwright ends the worker on any failure, which runs `afterAll` and leaves the
 * domain, so a retry rejoins either way. One test at a time, each failing test
 * paid its own rejoin, and a run with three of them left the join unhealthy. Each
 * test still joins over the API when it finds the appliance out of the domain, so
 * it can run on its own.
 */
test.describe('joining and leaving', () => {
  test.describe.configure({ mode: 'serial' });

  let networkBefore: NetworkSettings | undefined;

  test.beforeAll(async ({ api, config }) => {
    networkBefore = await startOffTheDomain(api, config);
  });

  test.afterAll(async ({ api, config }) => {
    await leaveTheDomain(api, config.activeDirectory, networkBefore);
  });

  test('joining Active Directory from the form shows the domain healthy on the card', async ({ page, api, config }) => {
    const ad = domainOf(config);
    await withActiveDirectoryRedacted(ad, async () => {
      await openDirectoryServicesForm(page);
      await fillActiveDirectoryJoin(page, ad, adComputerName());
      await saveDirectoryServicesForm(page, adJoinTimeoutMs);

      const { card } = directoryServicesLocators;
      await expect(page.locator(card.status)).toHaveText('HEALTHY', { timeout: cardTimeoutMs });
      await expect(page.locator(card.domainName)).toHaveText(domainPattern(ad));
      await expect(page.locator(card.accountCache)).toHaveText('Enabled');

      const { config: stored, status } = await readDirectoryServices(api);
      expect(status).toMatchObject({ type: 'ACTIVEDIRECTORY', status: 'HEALTHY' });
      expect(stored).toMatchObject({ enable: true, service_type: 'ACTIVEDIRECTORY', enable_dns_updates: false });
      // Middleware swaps the user it joined with for the machine account's principal.
      expect(stored.credential?.credential_type).toBe('KERBEROS_PRINCIPAL');
    });
  });

  test('the Users list finds a domain user, and Filter by Type keeps it only with Directory Services', async ({
    page,
    api,
    config,
  }) => {
    const ad = domainOf(config);
    await withActiveDirectoryRedacted(ad, async () => {
      await ensureActiveDirectoryJoined(api, ad, adComputerName());
      // The account the domain was joined with: the one domain user every run is sure of.
      const { name: account } = await findDomainAccount(api, 'user', ad.username);
      const { search, row } = usersLocators;

      await goToUsers(page);
      await page.locator(search.input).fill(ad.username);
      await page.locator(search.run).click();
      await expect(page.locator(row(account))).toBeVisible({ timeout: accountListTimeoutMs });

      // Both types are ticked to start with. Unticking one runs the search again.
      await chooseUserTypes(page, { local: false, directory: true });
      await expect(page.locator(row(account))).toBeVisible({ timeout: accountListTimeoutMs });

      await chooseUserTypes(page, { local: true, directory: false });
      await expect(page.locator(row(account))).toBeHidden({ timeout: accountListTimeoutMs });
    });
  });

  test('the Groups list shows a domain group, and offers nothing that would change it', async ({
    page,
    api,
    config,
  }) => {
    const ad = domainOf(config);
    await withActiveDirectoryRedacted(ad, async () => {
      await ensureActiveDirectoryJoined(api, ad, adComputerName());
      const { name: group } = await findDomainAccount(api, 'group', domainUsersGroup);
      const { search, row, rowAction } = groupsLocators;

      await goToGroups(page);
      await page.locator(search).fill(domainUsersGroup);
      await page.locator(row(group)).click({ timeout: accountListTimeoutMs });

      // Delete is rendered, disabled, for any group that is not built in: it is the sign the row
      // has opened. Members and Edit are for local groups only.
      await expect(page.locator(rowAction.delete(group))).toBeDisabled();
      await expect(page.locator(rowAction.members(group))).toHaveCount(0);
      await expect(page.locator(rowAction.edit(group))).toHaveCount(0);
    });
  });

  test.describe('on a dataset', () => {
    /** Each under the worker's pool. The SMB preset makes an NFSv4 ACL; a plain dataset is POSIX. */
    const leaves = {
      acl: 'e2e_ad_acl', share: 'e2e_ad_share', permissions: 'e2e_ad_perms', quotas: 'e2e_ad_quotas',
    };
    const share = 'e2e_ad_share';

    test.afterEach(async ({ api, pool }) => {
      const datasets = Object.values(leaves).map((leaf) => `${pool}/${leaf}`);
      if (leavingTestData(`SMB share "${share}" and datasets ${datasets.join(', ')}`)) {
        return;
      }

      // Before the domain is left, so nothing outlives the accounts it names. The share first, so
      // it is not left pointing at a removed path.
      await runCleanupSteps([
        [`remove SMB share ${share}`, () => ensureSmbShareAbsent(api, share)],
        ...datasets.map((dataset): [string, () => Promise<void>] => [
          `remove dataset ${dataset}`, () => ensureDatasetAbsent(api, dataset),
        ]),
      ]);
    });

    test('an NFSv4 ACL entry names a domain group picked in the editor', async ({
      page, api, config, pool,
    }) => {
      const ad = domainOf(config);
      await withActiveDirectoryRedacted(ad, async () => {
        await ensureActiveDirectoryJoined(api, ad, adComputerName());
        const { name: group, id: gid } = await findDomainAccount(api, 'group', domainUsersGroup);
        const dataset = `${pool}/${leaves.acl}`;
        const path = datasetMountPath(dataset);
        const forGroup = (entries: Nfs4Ace[]): Nfs4Ace[] => entries.filter(
          (entry) => entry.tag === 'GROUP' && entry.id === gid,
        );
        await ensureDatasetAbsent(api, dataset);
        await ensureSmbDatasetPresent(api, dataset);
        // On a joined appliance the SMB preset already grants the domain's users Modify, so the
        // new entry is the one after whatever the preset gave the group.
        const before = forGroup(nfs4Entries(await readAcl(api, path)));

        await openAclEditor(page, dataset);
        // Typed as the appliance lists it, `NAME\domain users`: the picker searches every group
        // middleware knows, the domain's included.
        await addAclGroupEntry(page, group, 'Read');
        await saveAcl(page);

        expect(forGroup(nfs4Entries(await readAcl(api, path)))).toEqual([
          ...before,
          expect.objectContaining({ type: 'ALLOW', perms: { BASIC: 'READ' } }),
        ]);
      });
    });

    test('a share ACL entry names a domain group picked in Edit Share ACL', async ({
      page, api, config, pool,
    }) => {
      const ad = domainOf(config);
      await withActiveDirectoryRedacted(ad, async () => {
        await ensureActiveDirectoryJoined(api, ad, adComputerName());
        const { name: group, id: gid } = await findDomainAccount(api, 'group', domainUsersGroup);
        const dataset = `${pool}/${leaves.share}`;
        await ensureSmbShareAbsent(api, share);
        await ensureDatasetAbsent(api, dataset);
        await ensureSmbDatasetPresent(api, dataset);
        await ensureSmbSharePresent(api, { name: share, path: datasetMountPath(dataset) });
        const forGroup = (entries: SmbShareAce[]): SmbShareAce[] => entries.filter(
          (entry) => entry.ae_who_id?.id_type === 'GROUP' && entry.ae_who_id.id === gid,
        );

        await openShareAclForm(page, share);
        // The share ACL picker lists SMB groups through its own query, apart from the others.
        await addShareAclGroupEntry(page, { group, permission: 'READ', type: 'ALLOWED' });
        await saveShareAcl(page);

        expect(forGroup(await readSmbShareAcl(api, share))).toEqual([
          expect.objectContaining({ ae_perm: 'READ', ae_type: 'ALLOWED' }),
        ]);
      });
    });

    test('a POSIX dataset takes a domain group as its owner group from Edit Permissions', async ({
      page, api, config, pool,
    }) => {
      const ad = domainOf(config);
      await withActiveDirectoryRedacted(ad, async () => {
        await ensureActiveDirectoryJoined(api, ad, adComputerName());
        const { name: group } = await findDomainAccount(api, 'group', domainUsersGroup);
        const dataset = `${pool}/${leaves.permissions}`;
        const path = datasetMountPath(dataset);
        const startingPoint: Ownership = { user: 'root', group: 'root', mode: '755' };
        await ensureDatasetAbsent(api, dataset);
        await ensureDatasetPresent(api, dataset);
        // `filesystem.setperm` strips the ACL, so the Unix editor is the one that opens.
        await setOwnership(api, path, startingPoint);

        await openPermissionsEditor(page, dataset);
        await chooseGroup(page, group);
        await savePermissions(page, dataset);

        // `filesystem.stat` names the group as the host resolves it, whose case may differ.
        const ownership = await readOwnership(api, path);
        expect({ ...ownership, group: ownership.group.toLowerCase() })
          .toEqual({ ...startingPoint, group: group.toLowerCase() });
      });
    });

    test('a user quota is set for a domain user from the Add Quota form', async ({
      page, api, config, pool,
    }) => {
      const ad = domainOf(config);
      await withActiveDirectoryRedacted(ad, async () => {
        await ensureActiveDirectoryJoined(api, ad, adComputerName());
        const { name: account } = await findDomainAccount(api, 'user', ad.username);
        const dataset = `${pool}/${leaves.quotas}`;
        await ensureDatasetAbsent(api, dataset);
        await ensureDatasetPresent(api, dataset);

        await openQuotasPage(page, dataset, 'user');
        await openAddQuotaForm(page, 'user', account);
        await fillQuotas(page, { dataQuota: '1 GiB', objectQuota: 1000 });
        await saveQuotaForm(page);

        const quotas = await listQuotas(api, dataset, 'user');
        expect(quotas.find((quota) => quota.name?.toLowerCase() === account.toLowerCase()))
          .toMatchObject({ quota: 1024 ** 3, obj_quota: 1000 });
      });
    });
  });

  test.describe('a privilege', () => {
    const privilege = 'e2e_ad_privilege';

    test.afterEach(async ({ api }) => {
      if (leavingTestData(`privilege "${privilege}"`)) {
        return;
      }
      await runCleanupSteps([[`remove privilege ${privilege}`, () => ensurePrivilegeAbsent(api, privilege)]]);
    });

    test('a privilege grants a role to a domain group picked under Directory Services Groups', async ({
      page, api, config, entitlements,
    }) => {
      // Without `DIRECTORY_SERVICES_AUTH` the form leaves the field out. See `fixtures/entitlements.ts`.
      test.skip(
        !isNotDenied(entitlements, entitlementFeature.directoryServicesAuth),
        'DIRECTORY_SERVICES_AUTH is denied, which hides Directory Services Groups.',
      );
      const ad = domainOf(config);
      await withActiveDirectoryRedacted(ad, async () => {
        await ensureActiveDirectoryJoined(api, ad, adComputerName());
        const { name: group, id: gid } = await findDomainAccount(api, 'group', domainUsersGroup);
        await ensurePrivilegeAbsent(api, privilege);
        const { form } = privilegeLocators;

        await openAddPrivilegeForm(page);
        await page.locator(form.name).fill(privilege);
        await page.locator(form.dsGroups).fill(group);
        await page.locator(form.dsGroupOption(group)).click();
        await toggleRoles(page, ['Readonly Admin']);
        await savePrivilegeForm(page);

        // Stored as the group's record, resolved from the name the form sent.
        expect(await findPrivilege(api, privilege)).toMatchObject({
          roles: ['READONLY_ADMIN'],
          local_groups: [],
          ds_groups: [expect.objectContaining({ gid })],
        });
      });
    });
  });

  test.describe('the SMB service', () => {
    let adminGroupBefore: string | null | undefined;

    test.afterEach(async ({ api }) => {
      if (adminGroupBefore === undefined || leavingTestData('the SMB Administrators Group')) {
        return;
      }
      const restore = adminGroupBefore;
      await runCleanupSteps([['restore the SMB Administrators Group', async () => {
        await firstValueFrom(api.api.call('smb.update', [{ admin_group: restore }]).pipe(timeout(slowCallTimeoutMs)));
      }]]);
    });

    test('a domain group becomes the SMB Administrators Group', async ({ page, api, config }) => {
      const ad = domainOf(config);
      await withActiveDirectoryRedacted(ad, async () => {
        await ensureActiveDirectoryJoined(api, ad, adComputerName());
        const { name: group } = await findDomainAccount(api, 'group', domainUsersGroup);
        const before = await firstValueFrom(api.api.call('smb.config').pipe(timeout(readTimeoutMs)));
        adminGroupBefore = before.admin_group;
        const form = servicesLocators.smbForm;

        await openServiceForm(page, 'cifs', form.netbiosName, before.netbiosname);
        await page.locator(form.advancedToggle).click();
        await page.locator(form.adminGroup).fill(group);
        await page.locator(form.adminGroupOption(group)).click();
        await saveServiceForm(page);

        const after = await firstValueFrom(api.api.call('smb.config').pipe(timeout(readTimeoutMs)));
        expect(after.admin_group?.toLowerCase()).toBe(group.toLowerCase());
      });
    });
  });

  test.describe('signing in as a domain user', () => {
    test.use({ authenticate: false });
    const privilege = 'e2e_ad_sign_in';
    let dsAuthBefore: boolean | undefined;

    test.afterEach(async ({ api }) => {
      if (leavingTestData(`privilege "${privilege}" and directory services sign-in`)) {
        return;
      }
      const restore = dsAuthBefore;
      await runCleanupSteps([
        [`remove privilege ${privilege}`, () => ensurePrivilegeAbsent(api, privilege)],
        ['restore directory services sign-in', async () => {
          if (restore !== undefined) {
            await setDsAuth(api, restore);
          }
        }],
      ]);
    });

    test('a domain user in a privileged domain group signs in to the UI', async ({ page, api, config }) => {
      const ad = domainOf(config);
      await withActiveDirectoryRedacted(ad, async () => {
        await ensureActiveDirectoryJoined(api, ad, adComputerName());
        const { name: account } = await findDomainAccount(api, 'user', ad.username);
        const { id: gid } = await findDomainAccount(api, 'group', domainUsersGroup);
        // Sign-in for directory users is off until turned on, and a privilege is what gives one
        // a role: the account is in its domain's `domain users`.
        dsAuthBefore = await setDsAuth(api, true);
        await ensurePrivilegeAbsent(api, privilege);
        await ensurePrivilegePresent(api, {
          name: privilege, roles: ['READONLY_ADMIN'], webShell: false, localGroupGids: [], dsGroupGids: [gid],
        });

        await signIn(page, account, ad.password);
        await expectSignedInAs(page, account);
        await signOut(page);
      });
    });
  });

  // Last before the leave: middleware warns that a sync may disrupt the join, and the leave after
  // it then shows that it did not.
  test('Sync on the Kerberos Keytab card renews the machine keytab and keeps the domain healthy', async ({
    page,
    api,
    config,
  }) => {
    const ad = domainOf(config);
    await withActiveDirectoryRedacted(ad, async () => {
      await ensureActiveDirectoryJoined(api, ad, adComputerName());
      const lastJobBefore = await lastJobId(api);
      const { keytabs } = directoryServicesLocators;

      await openKerberosSettings(page);
      await expect(page.locator(keytabs.row(machineKeytab))).toBeVisible();
      await page.locator(keytabs.sync).click();

      await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
      await page.locator(confirmDialogLocators.checkbox).check();
      await page.locator(confirmDialogLocators.confirm).click();

      await expect.poll(() => syncKeytabJobsSince(api, lastJobBefore), {
        message: 'directoryservices.sync_keytab to run once and succeed',
        timeout: adJoinTimeoutMs,
      }).toEqual(['SUCCESS']);
      await expect(page.locator(jobDialogLocators.title)).toBeHidden({ timeout: cardTimeoutMs });
      await expect(page.locator(keytabs.row(machineKeytab))).toBeVisible();

      const { status } = await readDirectoryServices(api);
      expect(status).toMatchObject({ type: 'ACTIVEDIRECTORY', status: 'HEALTHY' });
    });
  });

  test('leaving the domain from the card brings back the disabled state', async ({ page, api, config }) => {
    const ad = domainOf(config);
    await withActiveDirectoryRedacted(ad, async () => {
      await ensureActiveDirectoryJoined(api, ad, adComputerName());

      await goToDirectoryServices(page);
      const { card, leaveDialog } = directoryServicesLocators;
      await expect(page.locator(card.status)).toHaveText('HEALTHY', { timeout: cardTimeoutMs });

      await page.locator(card.actionsMenu).click();
      await page.locator(card.leave).click();
      await expect(page.locator(leaveDialog.title)).toBeVisible();

      const leave = page.locator(leaveDialog.leave);
      await expect(leave).toBeDisabled();
      await page.locator(leaveDialog.username).fill(ad.username);
      await page.locator(leaveDialog.password).fill(ad.password);
      await expect(leave).toBeEnabled();
      await leave.click();

      await waitForLeave(page);
      await expect(page.locator(directoryServicesLocators.disabled)).toBeVisible({ timeout: cardTimeoutMs });

      const { config: stored, status } = await readDirectoryServices(api);
      expect(stored.enable).toBe(false);
      expect(status.status ?? null).toBeNull();
    });
  });
});

test.describe('refusing a join', () => {
  let networkBefore: NetworkSettings | undefined;

  test.beforeEach(async ({ api, config }) => {
    networkBefore = await startOffTheDomain(api, config);
  });

  test.afterEach(async ({ api, config }) => {
    await leaveTheDomain(api, config.activeDirectory, networkBefore);
  });

  test('a join through a nameserver that cannot resolve the domain is refused on the form', async ({
    page,
    api,
    config,
  }) => {
    const ad = domainOf(config);
    await withActiveDirectoryRedacted(ad, async () => {
      // The first controller stays: the refusal must be about the second nameserver alone.
      await setNameservers(api, [...ad.nameservers.slice(0, 1), deadNameserver]);

      const form = directoryServicesLocators.configForm;
      const serviceTypeField = page.locator(form.serviceTypeField);
      const save = page.locator(form.save);

      await openDirectoryServicesForm(page);
      await fillActiveDirectoryJoin(page, ad, adComputerName());
      await expect(serviceTypeField).not.toContainText('Forward lookup of');
      await expect(save).toBeEnabled();
      await save.click();

      // `validate_kerberos_dns` checks every nameserver, before anything is joined or stored.
      await expect(serviceTypeField).toContainText('Forward lookup of', { timeout: adJoinTimeoutMs });
      await expect(serviceTypeField).toContainText(`failed with nameserver ${deadNameserver}`);
      await expect(save).toBeDisabled();
      await expect(page.locator(errorDialogLocators.title)).toHaveCount(0);

      await discardDirectoryServicesForm(page);
      const { config: stored } = await readDirectoryServices(api);
      expect(stored.service_type).toBeNull();
    });
  });
});
