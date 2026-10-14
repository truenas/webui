/**
 * Stories: an admin adds, edits and deletes a privilege from the list on
 * Credentials > Privileges, and the appliance holds what they did.
 *
 * Each save is asserted twice: the list's row says the screen believed it,
 * `privilege.query` says the appliance did it — and carries the roles' wire values
 * and the groups themselves, where the list shows labels and a count.
 *
 * Edit and delete each run beside a second privilege that must come through
 * untouched. Every row carries its own Edit and Delete buttons, so an action
 * belongs to whichever row's button was clicked, and a row-targeting bug changes
 * the wrong privilege without failing anything else.
 *
 * The edited privilege names a local group. The form shows groups by name and
 * sends them as gids, resolving each one on save, so an edit that never touches
 * the groups still has to send the same group back.
 */
import { ensureGroupAbsent, ensureGroupPresent, findGroup } from '../fixtures/groups';
import {
  ensurePrivilegeAbsent, ensurePrivilegePresent, findPrivilege, type PrivilegeSeed,
} from '../fixtures/privileges';
import {
  deletePrivilege, openAddPrivilegeForm, openEditPrivilegeForm, savePrivilegeForm, toggleRoles,
} from '../flows/privileges';
import { privilegeLocators } from '../locators/privileges';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Created through the form, never over the API — that is the thing under test. */
const createdName = 'e2e-privilege-created';

/** The local group the edited privilege names. */
const groupName = 'e2e_privilege_grp';

/** Provisioned over the API so there is something to edit or delete. Its group is filled in per test. */
const target: Omit<PrivilegeSeed, 'localGroupGids'> = {
  name: 'e2e-privilege-target', roles: ['READONLY_ADMIN'], webShell: false,
};

/** The privilege that must survive whatever is done to the target. */
const bystander: PrivilegeSeed = {
  name: 'e2e-privilege-bystander', roles: ['READONLY_ADMIN'], webShell: false, localGroupGids: [],
};

const allNames = [createdName, target.name, bystander.name];

/** Every privilege first, then the group: middleware refuses to delete a group a privilege still names. */
async function removeEverything(api: E2eApiClient): Promise<void> {
  await runCleanupSteps([
    ...allNames.map((name): [string, () => Promise<void>] => [
      `remove the privilege ${name}`, () => ensurePrivilegeAbsent(api, name),
    ]),
    [`remove the group ${groupName}`, () => ensureGroupAbsent(api, groupName)],
  ]);
}

/**
 * The target, naming the spec's own group, and the bystander, over the API:
 * acting on one from the list is the thing under test. Returns the group's gid.
 */
async function seedTargetAndBystander(api: E2eApiClient): Promise<number> {
  await ensureGroupPresent(api, groupName);
  const group = await findGroup(api, groupName);
  if (!group) {
    throw new Error(`Group "${groupName}" was created but cannot be found, so the privilege has nothing to name.`);
  }

  await ensurePrivilegePresent(api, { ...target, localGroupGids: [group.gid] });
  await ensurePrivilegePresent(api, bystander);
  return group.gid;
}

/**
 * Removed before each test as well as after, so an interrupted run leaves the
 * next one able to start, and unconditionally so a failure still cleans up.
 */
test.beforeEach(async ({ api }) => {
  await removeEverything(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the privileges ${allNames.join(', ')} and the group ${groupName}`)) {
    return;
  }

  await removeEverything(api);
});

test('an admin adds a privilege, and the appliance really has one', async ({ page, api }) => {
  const { list, form } = privilegeLocators;

  await openAddPrivilegeForm(page);
  await page.locator(form.name).fill(createdName);
  await toggleRoles(page, ['Readonly Admin']);
  await page.locator(form.webShell).click();
  await savePrivilegeForm(page);

  await expect(page.locator(list.name(createdName))).toHaveText(createdName);
  await expect(page.locator(list.roles(createdName))).toHaveText('Readonly Admin');
  await expect(page.locator(list.localGroups(createdName))).toHaveText('0');
  await expect(page.locator(list.webShell(createdName))).toHaveText('Yes');

  expect(await findPrivilege(api, createdName)).toMatchObject({
    name: createdName,
    builtin_name: null,
    roles: ['READONLY_ADMIN'],
    web_shell: true,
    local_groups: [],
    ds_groups: [],
  });
});

test('editing a privilege from its row changes the privilege that was picked', async ({ page, api }) => {
  const { list, form } = privilegeLocators;
  const gid = await seedTargetAndBystander(api);
  const before = await findPrivilege(api, target.name);

  await openEditPrivilegeForm(page, target.name);
  // Readonly Admin is the seeded role, so this drops it and picks Sharing Admin.
  await toggleRoles(page, ['Readonly Admin', 'Sharing Admin']);
  // Off on the seeded privilege, so a stored `web_shell: true` can only have come from this click.
  await page.locator(form.webShell).click();
  await savePrivilegeForm(page);

  // The name is the row tag and was left alone, so the row keeps its ids.
  await expect(page.locator(list.roles(target.name))).toHaveText('Sharing Admin');
  await expect(page.locator(list.webShell(target.name))).toHaveText('Yes');
  await expect(page.locator(list.localGroups(target.name))).toHaveText('1');

  // The same record, by id: an update, not a delete and a create that happen to
  // leave the list looking the same. `roles` exactly, so a role the click should
  // have dropped and did not fails here.
  const after = await findPrivilege(api, target.name);
  expect(after).toMatchObject({ id: before?.id, web_shell: true, roles: ['SHARING_ADMIN'] });
  expect(after?.local_groups).toEqual([expect.objectContaining({ gid })]);

  expect(await findPrivilege(api, bystander.name)).toMatchObject({
    roles: ['READONLY_ADMIN'],
    web_shell: false,
    local_groups: [],
  });
});

test('deleting a privilege from its row removes the privilege that was picked', async ({ page, api }) => {
  await seedTargetAndBystander(api);

  await deletePrivilege(page, target.name);

  // Polled rather than read once: a row can also be hidden while the list is
  // between loads, which proves nothing.
  await expect.poll(() => findPrivilege(api, target.name)).toBeUndefined();

  // The whole point of the second privilege: the list looks right either way.
  await expect(page.locator(privilegeLocators.list.row(bystander.name))).toBeVisible();
  expect(await findPrivilege(api, bystander.name)).toMatchObject({
    roles: ['READONLY_ADMIN'],
    web_shell: false,
  });
});
