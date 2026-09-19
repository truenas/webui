/**
 * Story: deleting a user deletes the one you picked, and only what you asked.
 *
 * Two claims a list-and-dialog page can get wrong without any visible symptom:
 * acting on the wrong row, and taking the user's primary group with it when
 * that was not asked for. Both are checked through the API — the list no longer
 * showing a row is not evidence the account is gone.
 */
import {
  ensureGroupAbsent, ensureUserAbsent, ensureUserPresent, findGroup, findUser,
} from '../fixtures/users';
import { confirmUserDeletion, openDeleteUserDialog } from '../flows/users';
import { usersLocators } from '../locators/users';
import { expect, test } from '../support/fixtures';

/** The account each test deletes, and the one that must survive it. */
const target = 'e2e_delete_target';
const bystander = 'e2e_delete_bystander';

test.beforeEach(async ({ api }) => {
  await ensureUserAbsent(api, target);
  await ensureUserAbsent(api, bystander);
  await ensureGroupAbsent(api, target);
});

test.afterEach(async ({ api }) => {
  await ensureUserAbsent(api, target);
  await ensureUserAbsent(api, bystander);
  await ensureGroupAbsent(api, target);
});

test('deleting a user deletes the one that was selected', async ({ page, api }) => {
  await ensureUserPresent(api, target);
  await ensureUserPresent(api, bystander);

  await openDeleteUserDialog(page, target);
  await confirmUserDeletion(page);

  expect(await findUser(api, target)).toBeUndefined();
  // The whole point. A row-targeting bug does not throw — it quietly removes
  // an account nobody asked about, and the list looks right either way.
  expect(await findUser(api, bystander)).toBeDefined();
});

test('the primary group goes only when asked', async ({ page, api }) => {
  await ensureUserPresent(api, target);
  expect(await findGroup(api, target)).toBeDefined();

  await openDeleteUserDialog(page, target);
  // Offered because this account is the last member of its own group. Left
  // unticked: the group is a separate object and should outlive the user.
  await expect(page.locator(usersLocators.deleteDialog.deletePrimaryGroup)).toBeVisible();
  await confirmUserDeletion(page);

  expect(await findUser(api, target)).toBeUndefined();
  expect(await findGroup(api, target)).toBeDefined();
});

test('the primary group goes when it is asked for', async ({ page, api }) => {
  await ensureUserPresent(api, target);

  await openDeleteUserDialog(page, target);
  await page.locator(usersLocators.deleteDialog.deletePrimaryGroup).click();
  await confirmUserDeletion(page);

  expect(await findUser(api, target)).toBeUndefined();
  expect(await findGroup(api, target)).toBeUndefined();
});
