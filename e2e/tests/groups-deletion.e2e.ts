/**
 * Story: deleting a group deletes the one you opened, and only that one.
 *
 * The same claim the user deletion spec makes, and it is worth making twice
 * because the two screens get to it by different routes: a user's Delete
 * belongs to whichever row the list has *selected*, while a group's belongs to
 * whichever row is *expanded*. Both fail the same silent way — the right dialog
 * over the wrong object — and the list looks correct either way.
 */
import { ensureGroupAbsent, ensureGroupPresent, findGroup } from '../fixtures/groups';
import { confirmGroupDeletion, expandGroupRow, openDeleteGroupDialog } from '../flows/groups';
import { goToGroups } from '../flows/navigation';
import { groupsLocators } from '../locators/groups';
import { expect, test } from '../support/fixtures';

/** The group each test deletes, and the one that must survive it. */
const target = 'e2e_delete_group';
const bystander = 'e2e_delete_bystander_group';

test.beforeEach(async ({ api }) => {
  await ensureGroupAbsent(api, target);
  await ensureGroupAbsent(api, bystander);
});

test.afterEach(async ({ api }) => {
  await ensureGroupAbsent(api, target);
  await ensureGroupAbsent(api, bystander);
});

test('deleting a group deletes the one that was expanded', async ({ page, api }) => {
  await ensureGroupPresent(api, target);
  await ensureGroupPresent(api, bystander);

  await goToGroups(page);
  await expandGroupRow(page, target);
  await openDeleteGroupDialog(page, target);
  await confirmGroupDeletion(page);

  await expect(page.locator(groupsLocators.row(target))).toBeHidden();

  expect(await findGroup(api, target)).toBeUndefined();
  // The whole point. A row-targeting bug does not throw — it quietly removes a
  // group nobody asked about, and the list looks right either way.
  expect(await findGroup(api, bystander)).toBeDefined();
  await expect(page.locator(groupsLocators.row(bystander))).toBeVisible();
});

test('a group survives a cancelled deletion', async ({ page, api }) => {
  await ensureGroupPresent(api, target);

  await goToGroups(page);
  await expandGroupRow(page, target);
  await openDeleteGroupDialog(page, target);

  // Escape rather than the Cancel button, because that is the dismissal a
  // dialog gets for free and therefore the one most likely to be wired to
  // nothing. `DeleteGroupDialog` only acts on an explicit Delete, so a group
  // going missing here would mean the shell closed with the wrong result.
  await page.keyboard.press('Escape');
  await expect(page.locator(groupsLocators.deleteDialog.title)).toBeHidden();

  expect(await findGroup(api, target)).toBeDefined();
  await expect(page.locator(groupsLocators.row(target))).toBeVisible();
});
