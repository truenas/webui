/**
 * Stories: editing a user under Credentials > Users — changing profile and
 * access fields, moving the home directory, and the edit form's refusals.
 *
 * The form drops every home key from `user.update` when the home was left alone,
 * because middleware acts on each one it is given: a different `home` relocates
 * the account and copies the old directory over, and a `home_mode` re-applies
 * permissions. The payload itself is not observable here, so the first test reads
 * the evidence instead — no warning raised, and the home's path and seeded mode
 * unchanged afterwards.
 *
 * Lock and Unlock are covered by `unauthenticated/user-sign-in-controls.e2e.ts`.
 */
import { ensureGroupAbsent, ensureGroupPresent, findGroup } from '../fixtures/groups';
import { readOwnership, setOwnership } from '../fixtures/permissions';
import { datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import {
  ensureSignInCapableUser, ensureUserAbsent, findUser, giveUserHome, setUserEmailAndShell,
} from '../fixtures/users';
import { fillPassword, openEditUserForm, saveUserForm } from '../flows/users';
import { confirmDialogLocators } from '../locators/dialogs';
import { usersLocators } from '../locators/users';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';
import { slowCallTimeoutMs } from '../support/timeouts';

/**
 * The account under test, never the signed-in admin.
 *
 * No letter-digit boundary, so the row id (lodash) and the card ids (the
 * library's normalizer) spell it the same way.
 */
const username = 'edittarget';
/** What `ensureSignInCapableUser` names the account, and so what Edit is keyed on. */
const seededFullName = `E2E ${username}`;
const seededPassword = 'Edit-E2E-Passw0rd!';
const seededEmail = 'edittarget-before@example.com';
/** The seeded shell. The first test picks bash, so the save has to change it. */
const seededShell = '/usr/bin/zsh';

/** An auxiliary group the first test adds through the form. */
const extraGroup = 'e2e_edit_extra';

/** Dataset A holds the seeded home; B is where the home tests move it. */
const homeLeafA = 'e2e-edit-home-a';
const homeLeafB = 'e2e-edit-home-b';

/**
 * The seeded home's mode. Not the form's default of `700`, so a save that sent
 * the home keys before the form had read the real mode would change it.
 */
const seededHomeMode = '750';

/**
 * The user first, so no account is left pointing at a home that no longer
 * exists, then the group it was put in, then both home datasets.
 */
async function cleanUp(api: E2eApiClient, pool: string): Promise<void> {
  await runCleanupSteps([
    [`delete the user "${username}"`, () => ensureUserAbsent(api, username)],
    [`delete the group "${extraGroup}"`, () => ensureGroupAbsent(api, extraGroup)],
    [`remove the dataset "${pool}/${homeLeafA}"`, () => ensureDatasetAbsent(api, `${pool}/${homeLeafA}`)],
    [`remove the dataset "${pool}/${homeLeafB}"`, () => ensureDatasetAbsent(api, `${pool}/${homeLeafB}`)],
  ]);
}

/**
 * Gives the user a home on dataset A with the seeded mode, and returns its path.
 *
 * `group_create` gave the account a primary group of its own name, which is
 * what owns the home alongside it.
 */
async function seedHome(api: E2eApiClient, pool: string): Promise<string> {
  await ensureDatasetPresent(api, `${pool}/${homeLeafA}`);
  const home = await giveUserHome(api, username, datasetMountPath(`${pool}/${homeLeafA}`));
  await setOwnership(api, home, { user: username, group: username, mode: seededHomeMode });

  return home;
}

test.beforeEach(async ({ api, pool }) => {
  await cleanUp(api, pool);
  await ensureSignInCapableUser(api, username, { password: seededPassword, groups: [] });
});

test.afterEach(async ({ api, pool }) => {
  const what = `user "${username}", group "${extraGroup}" and datasets "${pool}/${homeLeafA}", "${pool}/${homeLeafB}"`;
  if (leavingTestData(what)) {
    return;
  }
  await cleanUp(api, pool);
});

test('Editing profile and access fields leaves the home directory alone', async ({ page, api, pool }) => {
  const home = await seedHome(api, pool);
  await ensureGroupPresent(api, extraGroup);
  // The Email readout is an empty `<div>` while there is no email, which cannot
  // be clicked, so the account starts with one.
  await setUserEmailAndShell(api, username, { email: seededEmail, shell: seededShell });
  const { form } = usersLocators;

  const newFullName = 'E2E Edited Target';
  const newEmail = 'edittarget-after@example.com';

  await openEditUserForm(page, { username, fullName: seededFullName });

  await page.locator(form.fullNameValue).click();
  await page.locator(form.fullName).fill(newFullName);

  await page.locator(form.emailValue).click();
  await page.locator(form.email).fill(newEmail);

  await page.locator(form.primaryGroupValue).click();
  await page.locator(form.groups).fill(extraGroup);
  await page.locator(form.groupsOption(extraGroup)).click();

  await page.locator(form.shellValue).click();
  await page.locator(form.shell).click();
  await page.locator(form.shellOption('bash')).click();

  await saveUserForm(page);

  // An untouched home raises no warning. Had one been raised, the panel would
  // not have closed above.
  await expect(page.locator(confirmDialogLocators.title)).toBeHidden();
  await expect(page.locator(usersLocators.profileFullName(username))).toHaveText(newFullName);
  await expect(page.locator(usersLocators.profileEmail(username))).toHaveText(newEmail);
  await expect(page.locator(usersLocators.shellAccess(username))).toContainText('/usr/bin/bash');

  const group = await findGroup(api, extraGroup);
  expect(group).toBeDefined();
  const user = await findUser(api, username);
  expect(user).toMatchObject({
    full_name: newFullName,
    email: newEmail,
    shell: '/usr/bin/bash',
    home,
  });
  expect(user?.groups).toContain(group?.id);

  // Mode and owner as seeded: no `home_mode` reached middleware to re-apply them.
  expect(await readOwnership(api, home)).toMatchObject({ user: username, mode: seededHomeMode });
});

test('Creating a home under another dataset moves the user there without a warning', async ({ page, api, pool }) => {
  await seedHome(api, pool);
  await ensureDatasetPresent(api, `${pool}/${homeLeafB}`);
  const parentB = datasetMountPath(`${pool}/${homeLeafB}`);
  const newHome = `${parentB}/${username}`;
  const { form } = usersLocators;

  await openEditUserForm(page, { username, fullName: seededFullName });

  await page.locator(form.homeValue).click();
  await page.locator(form.homeCreate).click();
  await page.locator(form.home).fill(parentB);

  await saveUserForm(page);

  await expect(page.locator(confirmDialogLocators.title)).toBeHidden();
  await expect(page.locator(usersLocators.profileHomeDirectory(username))).toHaveText(newHome);

  expect((await findUser(api, username))?.home).toBe(newHome);
  // Default Permissions is ticked along with Create, which is mode 700.
  expect(await readOwnership(api, newHome)).toMatchObject({ user: username, mode: '700' });
});

test('Pointing the home at an existing path asks first; declining changes nothing', async ({ page, api, pool }) => {
  const home = await seedHome(api, pool);
  await ensureDatasetPresent(api, `${pool}/${homeLeafB}`);
  // An existing directory: B's own mountpoint. Middleware takes any existing
  // path under /mnt that no other user has as a home.
  const existing = datasetMountPath(`${pool}/${homeLeafB}`);
  const { form } = usersLocators;

  await openEditUserForm(page, { username, fullName: seededFullName });

  await page.locator(form.homeValue).click();
  await expect(page.locator(form.homeCreate)).not.toBeChecked();
  await page.locator(form.home).fill(existing);

  await test.step('declining the warning leaves the form open and the home as it was', async () => {
    await page.locator(form.save).click();
    await expect(page.locator(confirmDialogLocators.title)).toContainText('Warning!');
    await page.locator(confirmDialogLocators.cancel).click();

    await expect(page.locator(confirmDialogLocators.title)).toBeHidden();
    await expect(page.locator(form.save)).toBeEnabled();
    expect((await findUser(api, username))?.home).toBe(home);
  });

  await test.step('confirming it saves the new home', async () => {
    await page.locator(form.save).click();
    await expect(page.locator(confirmDialogLocators.title)).toContainText('Warning!');
    await page.locator(confirmDialogLocators.checkbox).click();
    await page.locator(confirmDialogLocators.confirm).click();
    await expect(page.locator(form.save)).toBeHidden({ timeout: slowCallTimeoutMs });

    expect((await findUser(api, username))?.home).toBe(existing);
  });
});

test('The edit form refuses SMB access without a new password, and a home at /mnt', async ({ page, api }) => {
  const { form } = usersLocators;
  const newPassword = 'Edit-E2E-N3w-Passw0rd!';

  await openEditUserForm(page, { username, fullName: seededFullName });

  await test.step('a home at /mnt is refused, and clearing it restores the default', async () => {
    await page.locator(form.homeValue).click();
    await page.locator(form.home).fill('/mnt');

    await expect(page.locator(form.homeErrors)).toContainText('Home directory cannot be set to /mnt');
    await expect(page.locator(form.save)).toBeDisabled();

    // An empty home goes back to `/var/empty`, which is the account's own: the
    // home is untouched again, so the save below raises no warning.
    await page.locator(form.home).fill('');
    await expect(page.locator(form.homeErrors)).toBeHidden();
  });

  await test.step('turning SMB on holds Save until a new password is typed', async () => {
    await page.locator(form.smbAccess).click();

    await expect(page.locator(form.smbAccessError))
      .toHaveText('Password must be reset in order to enable SMB authentication');
    await expect(page.locator(form.save)).toBeDisabled();

    await fillPassword(page, newPassword);
    await expect(page.locator(form.smbAccessError)).toBeHidden();
    await expect(page.locator(form.save)).toBeEnabled();
  });

  await saveUserForm(page);

  expect(await findUser(api, username)).toMatchObject({ smb: true });
});
