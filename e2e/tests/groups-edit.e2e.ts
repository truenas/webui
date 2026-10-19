/**
 * Stories: an admin edits a group from its row on Credentials > Groups — renaming
 * it, changing what it may run with sudo and whether it is an SMB group, moving
 * privileges onto and off it — and the form's refusals in edit mode.
 *
 * Each save is asserted through `group.query`, and the privilege moves through
 * `privilege.query` as well: privileges are not part of `group.update` at all.
 * The form sends one `privilege.update` per privilege it touched, so the group's
 * side of the relationship is only ever written by those.
 *
 * Members and Delete are covered by `groups-members.e2e.ts` and
 * `groups-deletion.e2e.ts`; the add direction of the form by `groups-form.e2e.ts`.
 */
import {
  ensureGroupAbsent, ensureGroupPresent, findGroup, type GroupRecord, type GroupSeedOptions,
} from '../fixtures/groups';
import { ensurePrivilegeAbsent, ensurePrivilegePresent, findPrivilege } from '../fixtures/privileges';
import { expandGroupRow, openEditGroupForm, saveGroupForm } from '../flows/groups';
import { goToGroups, goToPrivileges } from '../flows/navigation';
import { addChips } from '../flows/network-config';
import { groupsLocators } from '../locators/groups';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** The group every test edits, provisioned over the API. */
const groupName = 'e2e_edit_group';
/** What the first test renames it to, through the form. */
const renamedName = 'e2e_edit_renamed';
/** A second group, there to be collided with and to be left alone. */
const bystanderName = 'e2e_edit_bystander';

const allGroups = [groupName, renamedName, bystanderName];

/** Names only the bystander when seeded; the third test adds the group under test to it. */
const addedPrivilege = 'e2e-group-edit-added';
/**
 * Names only the group under test when seeded; the third test takes it off.
 *
 * A different role from {@link addedPrivilege}, so the group's `roles` before
 * and after the save cannot agree by accident.
 */
const removedPrivilege = 'e2e-group-edit-removed';

const allPrivileges = [addedPrivilege, removedPrivilege];

/**
 * Both privileges first, then every group name: middleware refuses to delete a
 * group a privilege still names (`privilege.before_group_delete`). Both of the
 * edited group's names, because a failure can leave it under either.
 */
async function cleanUp(api: E2eApiClient): Promise<void> {
  await runCleanupSteps([
    ...allPrivileges.map((name): [string, () => Promise<void>] => [
      `remove the privilege ${name}`, () => ensurePrivilegeAbsent(api, name),
    ]),
    ...allGroups.map((name): [string, () => Promise<void>] => [
      `remove the group ${name}`, () => ensureGroupAbsent(api, name),
    ]),
  ]);
}

/** Creates a group over the API and returns the appliance's record of it. */
async function seedGroup(api: E2eApiClient, name: string, options: GroupSeedOptions = {}): Promise<GroupRecord> {
  await ensureGroupPresent(api, name, options);
  const group = await findGroup(api, name);
  if (!group) {
    throw new Error(`Group "${name}" was created but cannot be found.`);
  }
  return group;
}

/**
 * Removed before each test as well as after, so an interrupted run leaves the
 * next one able to start, and unconditionally so a failure still cleans up.
 */
test.beforeEach(async ({ api }) => {
  await cleanUp(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the privileges ${allPrivileges.join(', ')} and the groups ${allGroups.join(', ')}`)) {
    return;
  }

  await cleanUp(api);
});

test('an admin renames a group, and it is the same group under the new name', async ({ page, api }) => {
  const { form } = groupsLocators;
  const seeded = await seedGroup(api, groupName);

  await openEditGroupForm(page, groupName);

  // The GID is fixed once a group exists, so the form shows it and will not take another.
  await expect(page.locator(form.gid)).toBeDisabled();
  await expect(page.locator(form.gid)).toHaveValue(String(seeded.gid));
  // An untouched edit form can be saved. The last test shows the name check
  // itself excluding the group's own name; here it may still be pending.
  await expect(page.locator(form.save)).toBeEnabled();

  await page.locator(form.name).fill(renamedName);
  await saveGroupForm(page);

  // The row tag is the name, so a rename replaces the row's ids rather than relabelling it.
  await expect(page.locator(groupsLocators.row(groupName))).toBeHidden();
  await expect(page.locator(groupsLocators.row(renamedName))).toBeVisible();
  await expandGroupRow(page, renamedName);
  await expect(page.locator(groupsLocators.rowAction.edit(renamedName))).toBeVisible();

  // The same `id` is what makes this an update, not a delete and a create that
  // happen to leave the list looking the same.
  expect(await findGroup(api, groupName)).toBeUndefined();
  expect(await findGroup(api, renamedName)).toMatchObject({ id: seeded.id, gid: seeded.gid });
});

test('editing a group that allows all sudo commands reads the wildcard back, and the admin narrows it', async ({
  page, api,
}) => {
  const { form } = groupsLocators;
  const command = '/usr/bin/ls';
  await seedGroup(api, groupName, { sudoCommands: ['ALL'], sudoCommandsNopasswd: [], smb: false });

  await openEditGroupForm(page, groupName);

  // `ALL` is shown as the checkbox, never as a chip in the list the checkbox disables.
  await expect(page.locator(form.sudoCommandsAll)).toBeChecked();
  await expect(page.locator(form.sudoCommands)).toBeDisabled();
  await expect(page.locator(form.sudoCommandChip('ALL'))).toBeHidden();

  // Letting go of the wildcard has to hand the list back.
  await page.locator(form.sudoCommandsAll).click();
  await expect(page.locator(form.sudoCommands)).toBeEnabled();
  await addChips(page, form.sudoCommands, [command]);
  await expect(page.locator(form.sudoCommandChip(command))).toBeVisible();

  await page.locator(form.sudoCommandsNopasswdAll).click();
  await page.locator(form.smb).click();
  await saveGroupForm(page);

  // The sudo cell read `Yes` before the save too, since the wildcard counts, so
  // it is a backstop; the API read below is what shows the list was narrowed.
  // SMB was seeded off, so its `Yes` can only have come from this save.
  await expect(page.locator(groupsLocators.cell.sudo(groupName))).toHaveText('Yes');
  await expect(page.locator(groupsLocators.cell.smb(groupName))).toHaveText('Yes');

  expect(await findGroup(api, groupName)).toMatchObject({
    sudo_commands: [command],
    sudo_commands_nopasswd: ['ALL'],
    smb: true,
  });
});

test('an admin assigns one privilege and removes another from the group form, and other groups keep theirs', async ({
  page, api,
}) => {
  const { form } = groupsLocators;
  const group = await seedGroup(api, groupName);
  const bystander = await seedGroup(api, bystanderName);
  await ensurePrivilegePresent(api, {
    name: addedPrivilege,
    roles: ['READONLY_ADMIN'],
    webShell: false,
    localGroupGids: [bystander.gid],
  });
  await ensurePrivilegePresent(api, {
    name: removedPrivilege,
    roles: ['SHARING_ADMIN'],
    webShell: false,
    localGroupGids: [group.gid],
  });
  // The seed itself, so the change below is measured from a known start.
  expect((await findGroup(api, groupName))?.roles).toEqual(['SHARING_ADMIN']);

  await openEditGroupForm(page, groupName);

  // `loadData` fills the selection after the form opens, from the privileges naming this GID.
  await expect(page.locator(form.privilegesChip(removedPrivilege))).toBeVisible();
  await expect(page.locator(form.privilegesChip(addedPrivilege))).toBeHidden();

  // Backspace in the empty field drops the last chip, and the loaded one is the only chip.
  // The chip's own Delete shortcut cannot be reached by clicking it: the click bubbles
  // to the field's container, which moves focus back into the text field.
  await page.locator(form.privileges).press('Backspace');
  await expect(page.locator(form.privilegesChip(removedPrivilege))).toBeHidden();

  await page.locator(form.privileges).fill(addedPrivilege);
  await page.locator(form.privilegesOption(addedPrivilege)).click();
  await expect(page.locator(form.privilegesChip(addedPrivilege))).toBeVisible();
  await saveGroupForm(page);

  // The bystander's GID is what catches an update that replaced the list instead of adding to it.
  const addedGids = ((await findPrivilege(api, addedPrivilege))?.local_groups ?? []).map((local) => local.gid);
  expect(addedGids).toHaveLength(2);
  expect(addedGids).toEqual(expect.arrayContaining([group.gid, bystander.gid]));
  expect((await findPrivilege(api, removedPrivilege))?.local_groups).toEqual([]);

  // `roles` comes from the privileges naming the group, so it moved with them.
  expect((await findGroup(api, groupName))?.roles).toEqual(['READONLY_ADMIN']);

  // Reopened rather than read straight after the save. The form computes the
  // row's roles in the browser from each privilege's `builtin_name`, which a
  // custom privilege does not have, so until the list reloads it can disagree
  // with the appliance.
  await goToPrivileges(page);
  await goToGroups(page);
  await expect(page.locator(groupsLocators.cell.roles(groupName))).toHaveText('Readonly Admin');
});

test('the edit form refuses a name another group has and an invalid one, and keeps its own', async ({ page, api }) => {
  const { form } = groupsLocators;
  await seedGroup(api, groupName);
  await seedGroup(api, bystanderName);
  const name = page.locator(form.name);
  const save = page.locator(form.save);

  await openEditGroupForm(page, groupName);

  // Save is enabled while the check is pending too, so this first read proves
  // little. The two returns to the group's own name below are what prove the
  // check excludes it: by then the group list is cached and the check answers at once.
  await expect(save).toBeEnabled();

  // Each refusal starts from an enabled Save, so a disabled one can only be
  // that name. The check is asynchronous, so the assertions retry. Enter tries
  // to submit anyway, so the read-back at the end has something to catch.
  await name.fill(bystanderName);
  await expect(save).toBeDisabled();
  await name.press('Enter');

  await name.fill(groupName);
  await expect(save).toBeEnabled();

  // A space fails `UserService.namePattern`.
  await name.fill('bad name');
  await expect(save).toBeDisabled();
  await name.press('Enter');

  await name.fill(groupName);
  await expect(save).toBeEnabled();

  // Left open deliberately: closing a dirty form raises the unsaved-changes
  // question, and nothing here needs the panel gone.
  expect(await findGroup(api, groupName)).toBeDefined();
  expect(await findGroup(api, bystanderName)).toBeDefined();
  expect(await findGroup(api, 'bad name')).toBeUndefined();
});
