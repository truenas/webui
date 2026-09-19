/**
 * Story: membership is a relationship, and the list is answerable to it.
 *
 * Everything else on these screens is an attribute of one object. Membership is
 * a fact about two, held in a picker on a route of its own — and the group list
 * reads it back to decide whether the group can be deleted at all. That second
 * part is the interesting one: it is the only place here where editing one
 * thing changes what another thing will let you do.
 */
import {
  ensureGroupAbsent, ensureGroupPresent, findGroup, setGroupMembers,
} from '../fixtures/groups';
import { ensureUserAbsent, ensureUserPresent, findUser } from '../fixtures/users';
import {
  expandGroupRow, moveGroupMember, openGroupMembers, openMembersFromExpandedRow, saveGroupMembers,
} from '../flows/groups';
import { goToGroups } from '../flows/navigation';
import { groupsLocators } from '../locators/groups';
import { expect, test } from '../support/fixtures';

const group = 'e2e_members_group';
const member = 'e2e_members_user';

/**
 * The user goes first in both directions: middleware refuses to delete a group
 * an account still belongs to, so removing it last would leave the group behind
 * on every run.
 */
test.beforeEach(async ({ api }) => {
  await ensureUserAbsent(api, member);
  await ensureGroupAbsent(api, group);
});

test.afterEach(async ({ api }) => {
  await ensureUserAbsent(api, member);
  await ensureGroupAbsent(api, group);
});

test('an admin adds a user to a group, and the appliance agrees', async ({ page, api }) => {
  await ensureGroupPresent(api, group);
  await ensureUserPresent(api, member);

  await openGroupMembers(page, group, member);

  // Which side the user starts on is the precondition restated in the screen's
  // own terms — without it, a picker that opened with everyone already a member
  // would pass the rest of this test.
  await expect(page.locator(groupsLocators.members.available(member))).toBeVisible();
  await expect(page.locator(groupsLocators.members.selected(member))).toBeHidden();

  await moveGroupMember(page, member, 'member');
  await saveGroupMembers(page);

  const user = await findUser(api, member);
  expect(user).toBeDefined();
  expect((await findGroup(api, group))?.users).toContain(user?.id);
});

test('a group cannot be deleted until its members are taken off it', async ({ page, api }) => {
  await ensureGroupPresent(api, group);
  await ensureUserPresent(api, member);

  // `user.id` rather than `user`: the generated query result declares every
  // field optional, so having a record is not yet having an id to seed with.
  const user = await findUser(api, member);
  if (user?.id === undefined) {
    throw new Error(`Precondition failed: user "${member}" was created but cannot be found.`);
  }
  await setGroupMembers(api, group, [user.id]);

  await goToGroups(page);
  await expandGroupRow(page, group);

  // Not a validation message and not an error — the button is simply dead, and
  // the only account of why is a tooltip. A regression here leaves an admin
  // unable to delete a group with no visible reason.
  await expect(page.locator(groupsLocators.rowAction.delete(group))).toBeDisabled();

  // From the row that is already open, as an admin who just read the tooltip
  // would — going back through the sidebar would toggle this row shut.
  await openMembersFromExpandedRow(page, group, member);
  await expect(page.locator(groupsLocators.members.selected(member))).toBeVisible();
  await moveGroupMember(page, member, 'non-member');
  await saveGroupMembers(page);

  // The claim: editing membership on one screen changed what a different screen
  // will let the admin do. Neither component's unit tests can see this.
  await expandGroupRow(page, group);
  await expect(page.locator(groupsLocators.rowAction.delete(group))).toBeEnabled();

  expect((await findGroup(api, group))?.users).toEqual([]);
});
