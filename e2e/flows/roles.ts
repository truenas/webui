/**
 * Signing in as a restricted administrator, and what the UI should show them.
 *
 * Through the form, never the token: the token fixture mints tokens for the
 * suite's own admin only. Every call here spends one `auth.login_ex` from the
 * unauthenticated rate limit (20 per method per IP per 60s), so a spec signs in
 * once per test and groups a page's checks with `test.step`.
 */
import { expect, type Page } from '@playwright/test';
import { expectSignedInAs, signIn } from './auth';
import type { RoleAdmin } from '../fixtures/role-admins';
import { roleLocators } from '../locators/roles';

/** Signs in as the account through the form and checks the session is theirs. */
export async function signInAsRoleAdmin(page: Page, account: RoleAdmin): Promise<void> {
  await signIn(page, account.username, account.password);
  await expectSignedInAs(page, account.username);
}

/**
 * Asserts a control is locked for lack of a role, not merely disabled.
 *
 * `toBeDisabled()` alone would also pass for a Save held down by an invalid or
 * untouched form. Sitting inside the role-missing wrapper is what says the role
 * did it. Not for a `tn-menu-item`, which the wrapper never reaches (see
 * `roleLocators.missing`).
 */
export async function expectLockedByRole(page: Page, selector: string): Promise<void> {
  await expect(page.locator(selector)).toBeDisabled();
  await expect(page.locator(roleLocators.missing).filter({ has: page.locator(selector) })).toHaveCount(1);
}

/**
 * Asserts a control is not rendered at all, beside an anchor that is.
 *
 * The anchor is what keeps this from passing on a page that has not loaded.
 */
export async function expectHiddenByRole(page: Page, anchorSelector: string, selector: string): Promise<void> {
  await expect(page.locator(anchorSelector)).toBeVisible();
  await expect(page.locator(selector)).toHaveCount(0);
}
