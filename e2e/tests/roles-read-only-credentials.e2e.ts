/**
 * Story: a read-only administrator sees the seeded records on Users, Groups and
 * Backup Credentials, and finds every control that would change one locked. On
 * Users that is Add, Delete on another user, and Save on the edit form; Delete
 * on their own account is not rendered at all. On Groups, Add and the row's
 * Delete. On Backup Credentials, Add and Delete on each of the three cards, and
 * Save on the SSH connection's edit form. Nothing is changed afterwards.
 *
 * One test with a step per page, so the account signs in once: every sign-in
 * spends from the unauthenticated rate limit (see `flows/roles.ts`).
 *
 * Edit carries no role on Users or on the SSH Connections card, so both forms
 * open. `expectLockedByRole` asks for the role-missing wrapper as well as
 * `disabled`, so a Save held down by a pristine or invalid form does not pass.
 * The user form is also made dirty, so it is closed through the unsaved-changes
 * question and nothing is saved.
 */
import type { Page } from '@playwright/test';
import {
  countCloudCredentials, ensureCloudCredentialAbsent, ensureLoopbackCloudCredentialPresent, findCloudCredential,
} from '../fixtures/cloud-credentials';
import { ensureGroupAbsent, ensureGroupPresent, findGroup } from '../fixtures/groups';
import {
  ensureRoleAdminAbsent, ensureRoleAdminPresent, roleAdmins,
} from '../fixtures/role-admins';
import {
  countSshConnections,
  ensureLoopbackSshAccessAbsent,
  ensureLoopbackSshConnectionPresent,
  ensureSshConnectionAbsent,
  findSshConnection,
  loopbackKeypairName,
} from '../fixtures/ssh-connections';
import { countSshKeypairs, findSshKeypair } from '../fixtures/ssh-keypairs';
import { ensureUserAbsent, ensureUserPresent, findUser } from '../fixtures/users';
import { cloudCredentialCardPageSize } from '../flows/cloud-credentials';
import { expandGroupRow } from '../flows/groups';
import { goToBackupCredentials, goToGroups, goToUsers } from '../flows/navigation';
import { expectHiddenByRole, expectLockedByRole, signInAsRoleAdmin } from '../flows/roles';
import { sshConnectionCardPageSize } from '../flows/ssh-connections';
import { sshKeypairCardPageSize } from '../flows/ssh-keypairs';
import { cloudCredentialLocators } from '../locators/cloud-credentials';
import { confirmDialogLocators } from '../locators/dialogs';
import { groupsLocators } from '../locators/groups';
import { servicesLocators } from '../locators/services';
import { sshConnectionLocators } from '../locators/ssh-connections';
import { sshKeypairLocators } from '../locators/ssh-keypairs';
import { usersLocators } from '../locators/users';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const account = roleAdmins.readOnly;

const rolesUser = 'e2e_roles_user';
const rolesGroup = 'e2e_roles_grp';
const cloudCredential = 'e2e-roles-cloud';
const sshConnection = 'e2e-roles-ssh';
const sshKeypair = loopbackKeypairName(sshConnection);

/** The pages and cards load their rows on their own API calls, after the shell. */
const pageLoadTimeoutMs = 30_000;

/**
 * Everything the test seeds, in the order it depends on each other: the
 * credential signs in with the connection's keypair, so it goes before the
 * keypair does.
 */
async function cleanUp(api: E2eApiClient): Promise<void> {
  await runCleanupSteps([
    [`remove user ${account.username}`, () => ensureRoleAdminAbsent(api, account)],
    [`remove user ${rolesUser}`, () => ensureUserAbsent(api, rolesUser)],
    [`remove group ${rolesGroup}`, () => ensureGroupAbsent(api, rolesGroup)],
    [`remove cloud credential ${cloudCredential}`, () => ensureCloudCredentialAbsent(api, cloudCredential)],
    [`remove SSH connection ${sshConnection}`, () => ensureSshConnectionAbsent(api, sshConnection)],
    [`remove root's key and the keypair for ${sshConnection}`, () => ensureLoopbackSshAccessAbsent(api, sshConnection)],
  ]);
}

/**
 * Each Backup Credentials card lists five rows, oldest first, before View All.
 * A fresh appliance holds none of any; failing here says why rather than timing
 * out on a row the card did not list.
 */
function expectCardFits(card: string, existing: number, pageSize: number): void {
  expect(existing <= pageSize, `the ${card} card lists ${pageSize}, the appliance has ${existing}`).toBe(true);
}

/** The full name `user.query` holds for this user, which is what its Edit button is keyed on. */
async function readFullName(api: E2eApiClient, username: string): Promise<string> {
  const fullName = (await findUser(api, username))?.full_name;
  if (!fullName) {
    throw new Error(`user.query returned no full name for "${username}".`);
  }
  return fullName;
}

/**
 * Closes the user form, answering the unsaved-changes question, so nothing is
 * saved. Waits on Save going, not on a field: the open editable has already
 * hidden its readout, so a field's absence would not say the panel had closed.
 */
async function discardUserForm(page: Page): Promise<void> {
  await page.locator(servicesLocators.closePanel).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();
  await expect(page.locator(usersLocators.form.save)).toBeHidden();
}

test.describe('as a read-only administrator', () => {
  test.use({ authenticate: false });

  test.beforeEach(async ({ api }) => {
    await cleanUp(api);

    await ensureUserPresent(api, rolesUser);
    await ensureGroupPresent(api, rolesGroup);
    await ensureLoopbackSshConnectionPresent(api, sshConnection);
    const keypair = await findSshKeypair(api, sshKeypair);
    if (!keypair) {
      throw new Error(`keypair "${sshKeypair}" is missing, so the cloud credential has nothing to sign in with.`);
    }
    await ensureLoopbackCloudCredentialPresent(api, cloudCredential, keypair.id);
    await ensureRoleAdminPresent(api, account);
  });

  test.afterEach(async ({ api }) => {
    if (leavingTestData(`users "${account.username}" and "${rolesUser}", group "${rolesGroup}" and the credentials`)) {
      return;
    }

    await cleanUp(api);
  });

  test('Users, Groups and Backup Credentials lock every control that changes a record', async ({ page, api }) => {
    const userFullName = await readFullName(api, rolesUser);
    const ownFullName = await readFullName(api, account.username);
    expectCardFits('cloud credentials', await countCloudCredentials(api), cloudCredentialCardPageSize);
    expectCardFits('SSH connections', await countSshConnections(api), sshConnectionCardPageSize);
    expectCardFits('SSH keypairs', await countSshKeypairs(api), sshKeypairCardPageSize);

    await signInAsRoleAdmin(page, account);

    await test.step('Users', async () => {
      await goToUsers(page);
      await expect(page.locator(usersLocators.row(rolesUser))).toBeVisible({ timeout: pageLoadTimeoutMs });
      await expectLockedByRole(page, usersLocators.addUser);

      await page.locator(usersLocators.row(rolesUser)).click();
      await expect(page.locator(usersLocators.editUser(userFullName))).toBeVisible();
      await expectLockedByRole(page, usersLocators.deleteUser(rolesUser));

      const { form } = usersLocators;
      await page.locator(usersLocators.editUser(userFullName)).click();
      await expect(page.locator(form.fullNameValue)).toHaveText(userFullName);
      await page.locator(form.fullNameValue).click();
      await page.locator(form.fullName).fill('Changed by the read-only admin');
      await expectLockedByRole(page, form.save);
      await discardUserForm(page);

      // Delete is not rendered for the signed-in user at all, role or no role.
      await page.locator(usersLocators.row(account.username)).click();
      await expectHiddenByRole(page, usersLocators.editUser(ownFullName), usersLocators.deleteUser(account.username));

      expect((await findUser(api, rolesUser))?.full_name).toBe(userFullName);
      expect(await findUser(api, account.username)).toBeDefined();
    });

    await test.step('Groups', async () => {
      await goToGroups(page);
      await expect(page.locator(groupsLocators.row(rolesGroup))).toBeVisible({ timeout: pageLoadTimeoutMs });
      await expectLockedByRole(page, groupsLocators.addGroup);

      // The group has no members and no privileges, so nothing but the role disables its Delete.
      await expandGroupRow(page, rolesGroup);
      await expectLockedByRole(page, groupsLocators.rowAction.delete(rolesGroup));

      expect(await findGroup(api, rolesGroup)).toBeDefined();
    });

    await test.step('Backup Credentials', async () => {
      await goToBackupCredentials(page);

      const cloud = cloudCredentialLocators.card;
      await expect(page.locator(cloud.row(cloudCredential))).toBeVisible({ timeout: pageLoadTimeoutMs });
      await expectLockedByRole(page, cloud.add);
      await expectLockedByRole(page, cloud.delete(cloudCredential));

      const ssh = sshConnectionLocators.card;
      await expect(page.locator(ssh.row(sshConnection))).toBeVisible({ timeout: pageLoadTimeoutMs });
      await expectLockedByRole(page, ssh.add);
      await expectLockedByRole(page, ssh.delete(sshConnection));

      await page.locator(ssh.edit(sshConnection)).click();
      await expect(page.locator(sshConnectionLocators.form.name)).toHaveValue(sshConnection);
      await expectLockedByRole(page, sshConnectionLocators.form.save);
      // Untouched, so the panel closes without asking.
      await page.locator(servicesLocators.closePanel).click();
      await expect(page.locator(sshConnectionLocators.form.name)).toBeHidden();

      const keypairs = sshKeypairLocators.card;
      await expect(page.locator(keypairs.row(sshKeypair))).toBeVisible({ timeout: pageLoadTimeoutMs });
      await expectLockedByRole(page, keypairs.add);
      await page.locator(keypairs.rowMenu(sshKeypair)).click();
      await expect(page.locator(keypairs.rowMenuDelete(sshKeypair))).toBeVisible();
      // A menu item is drawn by `tn-menu`, outside the role-missing wrapper, so
      // `disabled` is all there is to check (see `roleLocators.missing`).
      await expect(page.locator(keypairs.rowMenuDelete(sshKeypair))).toBeDisabled();
      await page.keyboard.press('Escape');
      await expect(page.locator(keypairs.rowMenuDelete(sshKeypair))).toBeHidden();

      expect(await findCloudCredential(api, cloudCredential)).toBeDefined();
      expect(await findSshConnection(api, sshConnection)).toBeDefined();
      expect(await findSshKeypair(api, sshKeypair)).toBeDefined();
    });
  });
});
