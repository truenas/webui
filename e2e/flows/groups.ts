/**
 * Group management, driven through the UI.
 */
import { expect, type Page } from '@playwright/test';
import { goToGroups } from './navigation';
import { groupsLocators } from '../locators/groups';

/** Group creation and membership updates are middleware calls, not instant. */
const saveTimeoutMs = 60_000;

/** Opens the add-group side panel, from the sidebar as a user would. */
export async function openAddGroupForm(page: Page): Promise<void> {
  await goToGroups(page);

  await page.locator(groupsLocators.addGroup).click();
  await expect(page.locator(groupsLocators.form.name)).toBeVisible();

  // The GID is patched in by `loadData` once `group.get_next_gid` answers, and
  // the form is on screen before that lands. Typing a name into a form whose
  // Save is still waiting on a field it has not received reads as a validation
  // failure, so the wait belongs here rather than in each test.
  await expect(page.locator(groupsLocators.form.gid)).not.toHaveValue('');
}

/**
 * Saves the form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded — a
 * refusal leaves it open with the error attached.
 */
export async function saveGroupForm(page: Page): Promise<void> {
  await page.locator(groupsLocators.form.save).click();
  await expect(page.locator(groupsLocators.form.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Expands a group's row to reveal its actions.
 *
 * **Clicking a row toggles it**, so this collapses a row that is already open
 * rather than leaving it that way — call it once per visit to the list. That is
 * why {@link openGroupMembers} is built out of this plus
 * {@link openMembersFromExpandedRow}, and why a test that is already looking at
 * an open row reaches for the latter.
 *
 * Waits on Members rather than on the panel: it is the one action every local
 * group renders, so it is the signal that the detail row is really there —
 * Edit and Delete are each conditional.
 */
export async function expandGroupRow(page: Page, group: string): Promise<void> {
  await page.locator(groupsLocators.row(group)).click();
  await expect(page.locator(groupsLocators.rowAction.members(group))).toBeVisible();
}

/** Opens the delete confirmation for an already-expanded group. */
export async function openDeleteGroupDialog(page: Page, group: string): Promise<void> {
  await page.locator(groupsLocators.rowAction.delete(group)).click();
  await expect(page.locator(groupsLocators.deleteDialog.title)).toBeVisible();
}

/** Confirms the open delete dialog and waits for it to go. */
export async function confirmGroupDeletion(page: Page): Promise<void> {
  await page.locator(groupsLocators.deleteDialog.confirm).click();
  await expect(page.locator(groupsLocators.deleteDialog.title)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Opens the members picker from a row that is already expanded.
 *
 * Waits on the picker holding the given user rather than on the route: the page
 * renders its card before `user.query` and `group.query` resolve, so arriving
 * is not the same as being able to pick anyone. Either side will do — the
 * caller is the one with an opinion about which.
 */
export async function openMembersFromExpandedRow(page: Page, group: string, awaitUser: string): Promise<void> {
  await page.locator(groupsLocators.rowAction.members(group)).click();
  await expect(
    page.locator(groupsLocators.members.available(awaitUser))
      .or(page.locator(groupsLocators.members.selected(awaitUser))),
  ).toBeVisible({ timeout: saveTimeoutMs });
}

/** Opens the members picker for a group, starting from the sidebar. */
export async function openGroupMembers(page: Page, group: string, awaitUser: string): Promise<void> {
  await goToGroups(page);
  await expandGroupRow(page, group);
  await openMembersFromExpandedRow(page, group, awaitUser);
}

/**
 * Moves one user between the picker's two sides.
 *
 * Selecting the item and then clicking the arrow, rather than "move all":
 * the arrow is disabled until something is selected, so this exercises the
 * pairing the screen actually depends on.
 */
export async function moveGroupMember(page: Page, username: string, to: 'member' | 'non-member'): Promise<void> {
  const members = groupsLocators.members;
  const from = to === 'member' ? members.available(username) : members.selected(username);
  const arrow = to === 'member' ? members.moveRight : members.moveLeft;
  const landed = to === 'member' ? members.selected(username) : members.available(username);

  await page.locator(from).click();
  await page.locator(arrow).click();
  await expect(page.locator(landed)).toBeVisible();
}

/**
 * Saves the membership and waits for the return to the list.
 *
 * `GroupMembersComponent` navigates back only on success, so landing on the
 * list is the save's own acknowledgement.
 */
export async function saveGroupMembers(page: Page): Promise<void> {
  await page.locator(groupsLocators.members.save).click();
  await expect(page).toHaveURL(/\/credentials\/groups\/?$/, { timeout: saveTimeoutMs });
}
