/**
 * Story: what the add-group form accepts, what it refuses, and what the
 * appliance is left holding afterwards.
 *
 * Saves are asserted through the API for the reason the user specs give: a row
 * says the screen believed it, `group.query` says the appliance did it. The
 * group form adds something the user form has no equivalent of — fields that
 * are *derived* on submit rather than sent as typed, which is why the sudo
 * test below reads the stored value rather than the control.
 */
import { ensureGroupAbsent, ensureGroupPresent, findGroup } from '../fixtures/groups';
import { openAddGroupForm, saveGroupForm } from '../flows/groups';
import { groupsLocators } from '../locators/groups';
import { expect, test } from '../support/fixtures';

/** Created through the form, never over the API — that is the thing under test. */
const newGroup = 'e2e_form_group';
const sudoGroup = 'e2e_form_sudo_group';

/** Provisioned over the API purely so the form has a name to collide with. */
const existingGroup = 'e2e_form_taken_group';

const allGroups = [newGroup, sudoGroup, existingGroup];

/**
 * Removed before each test as well as after, so an interrupted run leaves the
 * next one able to start (R3.5), and unconditionally so a failure still cleans
 * up (R3.2).
 */
test.beforeEach(async ({ api }) => {
  for (const group of allGroups) {
    await ensureGroupAbsent(api, group);
  }
});

test.afterEach(async ({ api }) => {
  for (const group of allGroups) {
    await ensureGroupAbsent(api, group);
  }
});

test('an admin creates a group, and the appliance really has one', async ({ page, api }) => {
  await openAddGroupForm(page);

  // Read back rather than typed. The GID is the form's own proposal, from
  // `group.get_next_gid`, and the claim worth making is that the group the
  // appliance ends up with is the one the admin was shown — not that some
  // number the test invented round-tripped.
  const proposedGid = await page.locator(groupsLocators.form.gid).inputValue();
  expect(Number(proposedGid)).toBeGreaterThan(0);

  await page.locator(groupsLocators.form.name).fill(newGroup);
  await saveGroupForm(page);

  await expect(page.locator(groupsLocators.row(newGroup))).toBeVisible();

  const saved = await findGroup(api, newGroup);
  expect(saved).toBeDefined();
  expect(saved).toMatchObject({
    group: newGroup,
    gid: Number(proposedGid),
    // A plain group: nothing was asked for beyond a name, so none of the
    // optional powers should have been granted.
    smb: false,
    builtin: false,
    local: true,
    sudo_commands: [],
    sudo_commands_nopasswd: [],
    users: [],
    roles: [],
  });
});

test('"allow all sudo commands" takes the command list out of play, and stores the wildcard', async ({ page, api }) => {
  await openAddGroupForm(page);
  await page.locator(groupsLocators.form.name).fill(sudoGroup);

  // `enabledWhen` on the field, so the list is disabled rather than removed —
  // and the pairing runs both ways, which is what stops this passing against a
  // form that disables the list and never lets go.
  await expect(page.locator(groupsLocators.form.sudoCommands)).toBeEnabled();
  await page.locator(groupsLocators.form.sudoCommandsAll).click();
  await expect(page.locator(groupsLocators.form.sudoCommands)).toBeDisabled();
  await page.locator(groupsLocators.form.sudoCommandsAll).click();
  await expect(page.locator(groupsLocators.form.sudoCommands)).toBeEnabled();

  await page.locator(groupsLocators.form.sudoCommandsAll).click();
  await saveGroupForm(page);

  // The half no unit test of the template can reach: the checkbox is not a
  // field the API knows about. `submit` turns it into a wildcard command, and
  // a group granted every sudo command by accident is not a defect anyone
  // would see on screen.
  const saved = await findGroup(api, sudoGroup);
  expect(saved?.sudo_commands).toEqual(['ALL']);
  expect(saved?.sudo_commands_nopasswd).toEqual([]);
});

test('the form will not submit a group name that is already taken', async ({ page, api }) => {
  await ensureGroupPresent(api, existingGroup);

  await openAddGroupForm(page);
  await page.locator(groupsLocators.form.name).fill(existingGroup);

  // Refusing is the absence of an action: `canSubmit` blocks while the form is
  // INVALID, so Save never becomes clickable rather than erroring on click.
  // The check is asynchronous — it waits on a cached `group.query` — so the
  // assertion has to be one that retries.
  await expect(page.locator(groupsLocators.form.save)).toBeDisabled();

  // And it is the name Save was waiting on. Without this the test would pass
  // against a form that never enables Save at all.
  await page.locator(groupsLocators.form.name).fill(newGroup);
  await expect(page.locator(groupsLocators.form.save)).toBeEnabled();

  // Left open deliberately: closing a dirty form raises the unsaved-changes
  // confirmation, and nothing here needs the panel gone. The page is
  // test-scoped, so it goes with it.
  expect(await findGroup(api, newGroup)).toBeUndefined();
});
