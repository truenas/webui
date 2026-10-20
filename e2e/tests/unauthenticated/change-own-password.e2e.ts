/**
 * Stories: a signed-in user changes their own password from the topbar's user
 * menu, and from then on only the new one signs them in; the dialog refuses a
 * mismatched confirmation and a wrong current password, and a refused change
 * leaves the old password working; and a Full Admin is not asked for the
 * current password at all.
 *
 * Under `tests/unauthenticated/` because the claim is about the next sign-in,
 * which the token bypass would defeat — and the token fixture mints tokens for
 * the suite's admin only, so these accounts have to sign in through the form
 * anyway. Every sign-in spends from the unauthenticated rate limit (20 per
 * method per IP per 60s), so each story is one test with its steps in sequence.
 * The three use seven sign-ins between them.
 *
 * Each runs against a throwaway account, never the suite's own admin: every
 * later test's token, and the `api` fixture's own connection, sign in with that
 * admin's password, so a change that teardown failed to undo would take the rest
 * of the run down. Deleting the account is also what discards whatever password
 * a failed test left it with.
 *
 * Two accounts, because the dialog differs by role. The read-only admin is not a
 * Full Admin, so it is asked for its current password and middleware checks it;
 * the Full Admin is not asked.
 *
 * No password is ever read back over the API — there is no such read. The
 * sign-in form taking one password and refusing the other is the evidence.
 */
import { ensureRoleAdminPresent, type RoleAdmin } from '../../fixtures/role-admins';
import { ensureSignInAdministratorPresent, ensureUserAbsent, findUser } from '../../fixtures/users';
import {
  attemptSignIn, changeOwnPassword, expectSignedInAs, expectSignInRefused, fillChangePasswordForm,
  openChangePasswordDialog, passwordChangeTimeoutMs, signIn, signOut, wrongCredentialsMessage,
} from '../../flows/auth';
import { topbarLocators } from '../../locators/topbar';
import { leavingTestData } from '../../support/cleanup';
import { expect, test } from '../../support/fixtures';

/**
 * Not a Full Admin, so the dialog asks for the current password.
 *
 * Its own account rather than `roleAdmins.readOnly`, which the roles specs sign
 * in as with the password written there: this spec changes the password.
 */
const readOnlyAdmin: RoleAdmin = {
  username: 'e2e_pw_ro_admin',
  password: 'E2E-PwRoAdmin-Passw0rd!',
  group: 'truenas_readonly_administrators',
};

/** In `builtin_administrators`, so the dialog does not ask for the current password. */
const fullAdmin = {
  username: 'e2e_pw_full_admin',
  /** Meets the appliance's complexity rules; not a credential of any real account. */
  password: 'E2E-PwFullAdmin-Passw0rd!',
};

/** What each account's password is changed to. Meets the complexity rules, and differs from both originals. */
const newPassword = 'E2E-Changed-Passw0rd!';

/** The group validator's message on Confirm Password (`change-password-form.component.ts`). */
const mismatchMessage = 'New password and confirmation should match.';

/** Middleware's refusal of a wrong current password, on `user.set_password.old_password`. */
function wrongCurrentPasswordMessage(username: string): string {
  return `${username}: failed to validate password.`;
}

/**
 * Removed before each test as well as after, so an interrupted run leaves the
 * next one able to start, and a password a failed test changed goes with the
 * account. The built-in group is only joined, never changed.
 */
test.beforeEach(async ({ api }) => {
  await ensureUserAbsent(api, readOnlyAdmin.username);
  await ensureUserAbsent(api, fullAdmin.username);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`users "${readOnlyAdmin.username}" and "${fullAdmin.username}"`)) {
    return;
  }
  await ensureUserAbsent(api, readOnlyAdmin.username);
  await ensureUserAbsent(api, fullAdmin.username);
});

test('a read-only admin changes their password, and only the new one signs them in', async ({ page, api }) => {
  await ensureRoleAdminPresent(api, readOnlyAdmin);

  await test.step('the admin changes their own password from the user menu', async () => {
    await signIn(page, readOnlyAdmin.username, readOnlyAdmin.password);
    await changeOwnPassword(page, { current: readOnlyAdmin.password, next: newPassword });
    await signOut(page);
  });

  await test.step('the old password is refused', async () => {
    await attemptSignIn(page, readOnlyAdmin.username, readOnlyAdmin.password);
    await expectSignInRefused(page, wrongCredentialsMessage);

    // The refusal reads the same for a locked or password-disabled account, so
    // without this it would pass for an account the change had broken.
    const account = await findUser(api, readOnlyAdmin.username);
    expect(account?.locked).toBe(false);
    expect(account?.password_disabled).toBe(false);
  });

  await test.step('the new password signs them in', async () => {
    await signIn(page, readOnlyAdmin.username, newPassword);
    await expectSignedInAs(page, readOnlyAdmin.username);
  });
});

test('the dialog refuses a mismatched confirmation and a wrong current password', async ({ page, api }) => {
  const dialog = topbarLocators.changePasswordDialog;
  await ensureRoleAdminPresent(api, readOnlyAdmin);

  await test.step('a confirmation that does not match holds Save back', async () => {
    await signIn(page, readOnlyAdmin.username, readOnlyAdmin.password);
    await openChangePasswordDialog(page);
    await fillChangePasswordForm(page, {
      current: 'E2E-Not-The-Passw0rd!',
      next: newPassword,
      confirmation: 'E2E-Something-Else-Passw0rd!',
    });

    await expect(page.locator(dialog.confirmPasswordField)).toContainText(mismatchMessage);
    await expect(page.locator(dialog.save)).toBeDisabled();

    // Matching the confirmation is the only change, so the mismatch is what Save was waiting on.
    await page.locator(dialog.confirmPassword).fill(newPassword);
    await expect(page.locator(dialog.save)).toBeEnabled();
  });

  await test.step('middleware refuses the wrong current password, and the dialog stays open', async () => {
    await page.locator(dialog.save).click();

    await expect(page.locator(dialog.currentPasswordField)).toContainText(
      wrongCurrentPasswordMessage(readOnlyAdmin.username),
      { timeout: passwordChangeTimeoutMs },
    );
    await expect(page.locator(dialog.title)).toBeVisible();

    await page.locator(dialog.close).click();
    await expect(page.locator(dialog.title)).toBeHidden();
    await signOut(page);
  });

  // A refusal on screen would also pass if the password had changed anyway.
  await test.step('the original password still signs them in', async () => {
    await signIn(page, readOnlyAdmin.username, readOnlyAdmin.password);
    await expectSignedInAs(page, readOnlyAdmin.username);
  });
});

test('a Full Admin is not asked for the current password, and the change works', async ({ page, api }) => {
  const dialog = topbarLocators.changePasswordDialog;
  await ensureSignInAdministratorPresent(api, fullAdmin);

  await test.step('the dialog has no Current Password field', async () => {
    await signIn(page, fullAdmin.username, fullAdmin.password);
    await openChangePasswordDialog(page);

    // The anchor first, so the absence below is read from a rendered form.
    await expect(page.locator(dialog.newPassword)).toBeVisible();
    await expect(page.locator(dialog.currentPassword)).toHaveCount(0);

    await page.locator(dialog.close).click();
    await expect(page.locator(dialog.title)).toBeHidden();
  });

  await test.step('the admin changes their password without it', async () => {
    await changeOwnPassword(page, { next: newPassword });
    await signOut(page);
  });

  await test.step('the new password signs them in', async () => {
    await signIn(page, fullAdmin.username, newPassword);
    await expectSignedInAs(page, fullAdmin.username);
  });
});
