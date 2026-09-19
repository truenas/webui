/**
 * Story: what the add-user form accepts, what it refuses, and what the
 * appliance is left holding afterwards.
 *
 * Saves are asserted through the API: a row says the screen believed it,
 * `user.query` says the appliance did it. The refusals sit beside a real
 * creation deliberately — a form that refuses everything would pass a spec
 * made only of refusals.
 */
import {
  ensureUserAbsent, ensureUserPresent, findUser,
} from '../fixtures/users';
import {
  fillPassword, openAddUserForm, saveUserForm,
} from '../flows/users';
import { usersLocators } from '../locators/users';
import { expect, test } from '../support/fixtures';

/** Created through the form, never over the API — that is the thing under test. */
const newUser = { username: 'e2e_form_user', password: 'E2E-Form-Passw0rd!' };
const newAdmin = { username: 'e2e_form_admin', password: 'E2E-Form-Passw0rd!' };

/** Provisioned over the API purely so the form has a name to collide with. */
const existingUser = 'e2e_form_taken';

/**
 * Removed before each test as well as after, so an interrupted run leaves the
 * next one able to start (R3.5), and unconditionally so a failure still cleans
 * up (R3.2).
 */
test.beforeEach(async ({ api }) => {
  await ensureUserAbsent(api, newUser.username);
  await ensureUserAbsent(api, newAdmin.username);
});

test.afterEach(async ({ api }) => {
  await ensureUserAbsent(api, newUser.username);
  await ensureUserAbsent(api, newAdmin.username);
  await ensureUserAbsent(api, existingUser);
});

test('an admin creates a user, and the appliance really has one', async ({ page, api }) => {
  await openAddUserForm(page);
  await page.locator(usersLocators.form.username).fill(newUser.username);
  await fillPassword(page, newUser.password);
  await saveUserForm(page);

  await expect(page.locator(usersLocators.row(newUser.username))).toBeVisible();

  const saved = await findUser(api, newUser.username);
  expect(saved).toBeDefined();
  // The fields the form never echoes back. A uid and a primary group named
  // after the account are the appliance's work, not the form's, and they are
  // what distinguishes a real account from a row that merely rendered.
  expect(saved).toMatchObject({
    username: newUser.username,
    locked: false,
    password_disabled: false,
    group: { bsdgrp_group: newUser.username },
  });
  expect(saved?.uid).toBeGreaterThan(0);
  // A plain account: no UI access was asked for, so no role should have been
  // resolved for it.
  expect(saved?.roles).toEqual([]);
});

test('the role control appears only once UI access is granted, and the role lands', async ({ page, api }) => {
  await openAddUserForm(page);
  await page.locator(usersLocators.form.username).fill(newAdmin.username);

  // The ordering `flows/users.ts` documents, asserted rather than assumed: the
  // control is absent until access is granted, which is the part a refactor of
  // either component can break without either's unit tests noticing.
  await expect(page.locator(usersLocators.form.role)).toBeHidden();
  await page.locator(usersLocators.form.truenasAccess).click();
  await expect(page.locator(usersLocators.form.role)).toBeVisible();

  await page.locator(usersLocators.form.role).click();
  await page.locator(usersLocators.form.roleFullAdmin).click();
  await fillPassword(page, newAdmin.password);
  await saveUserForm(page);

  // Picking a role in a select proves nothing until the appliance agrees.
  const saved = await findUser(api, newAdmin.username);
  expect(saved?.roles).toContain('FULL_ADMIN');
});

test('the form will not submit a password that does not match its confirmation', async ({ page, api }) => {
  await openAddUserForm(page);
  await page.locator(usersLocators.form.username).fill(newUser.username);
  await page.locator(usersLocators.form.password).fill(newUser.password);
  await page.locator(usersLocators.form.passwordConfirm).fill('not-the-same-password');

  // Save is disabled rather than erroring on click: `canSubmit` blocks while
  // the form is INVALID, so refusing is the absence of an action, not a message.
  await expect(page.locator(usersLocators.form.save)).toBeDisabled();

  // And it is *this* that Save was waiting on. Without correcting it the test
  // would pass just as well against a form that never enables Save at all.
  await page.locator(usersLocators.form.passwordConfirm).fill(newUser.password);
  await expect(page.locator(usersLocators.form.save)).toBeEnabled();

  await page.locator(usersLocators.form.close).click();
  expect(await findUser(api, newUser.username)).toBeUndefined();
});

test('the form will not submit a username that is already taken', async ({ page, api }) => {
  await ensureUserPresent(api, existingUser);
  const before = await findUser(api, existingUser);

  await openAddUserForm(page);
  await page.locator(usersLocators.form.username).fill(existingUser);
  await fillPassword(page, newUser.password);

  // Refusing is the absence of an action: `canSubmit` blocks while the form is
  // INVALID, so Save never becomes clickable rather than erroring on click.
  await expect(page.locator(usersLocators.form.save)).toBeDisabled();

  // And it is the name Save was waiting on. Without this the test would pass
  // against a form that never enables Save at all.
  await page.locator(usersLocators.form.username).fill(newUser.username);
  await expect(page.locator(usersLocators.form.save)).toBeEnabled();

  await page.locator(usersLocators.form.close).click();

  // The account that already existed must be untouched — a refusal that edited
  // the thing it refused to duplicate would be worse than one that saved.
  expect(await findUser(api, existingUser)).toMatchObject({ uid: before?.uid });
});
