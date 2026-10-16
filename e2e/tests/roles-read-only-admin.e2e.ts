/**
 * Stories: a read-only administrator signs in, lands on the dashboard and can
 * sign out again; and finds Restart and Shut Down locked in the topbar's power
 * menu, where a full admin finds them enabled.
 *
 * The read-only admin signs in through the form, in a `describe` that turns the
 * token off: the token fixture mints tokens for the suite's admin only. Every
 * sign-in spends from the unauthenticated rate limit, so each story signs in
 * once and runs its checks as steps.
 *
 * Restart and Shut Down are never clicked, by either account. Locked is the
 * claim, and a click that got through would restart the appliance under the rest
 * of the run. `system.boot_id` is read before and after as a guard on that.
 */
import { firstValueFrom, timeout } from 'rxjs';
import {
  ensureRoleAdminAbsent, ensureRoleAdminPresent, roleAdmins,
} from '../fixtures/role-admins';
import { findUser } from '../fixtures/users';
import { signOut } from '../flows/auth';
import { signInAsRoleAdmin } from '../flows/roles';
import { dashboardLocators } from '../locators/dashboard';
import { signinLocators } from '../locators/signin';
import { topbarLocators } from '../locators/topbar';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData } from '../support/cleanup';
import { expect, test } from '../support/fixtures';
import { readTimeoutMs } from '../support/timeouts';

const account = roleAdmins.readOnly;

/** The dashboard's widgets load after the shell, each on its own API calls. */
const dashboardTimeoutMs = 30_000;

/** Changes on every boot, so the same value before and after means nothing restarted. */
async function readBootId(api: E2eApiClient): Promise<string> {
  return firstValueFrom(api.api.call('system.boot_id').pipe(timeout(readTimeoutMs)));
}

test.describe('as a read-only administrator', () => {
  test.use({ authenticate: false });

  test.beforeEach(async ({ api }) => {
    await ensureRoleAdminAbsent(api, account);
    await ensureRoleAdminPresent(api, account);
  });

  test.afterEach(async ({ api }) => {
    if (leavingTestData(`user "${account.username}"`)) {
      return;
    }
    await ensureRoleAdminAbsent(api, account);
  });

  test('a read-only admin signs in to the dashboard, and signs out again', async ({ page, api }) => {
    await test.step('the account holds the read-only role and not full admin', async () => {
      const roles = (await findUser(api, account.username))?.roles;
      expect(roles).toContain('READONLY_ADMIN');
      expect(roles).not.toContain('FULL_ADMIN');
    });

    await test.step('signing in through the form lands on the dashboard', async () => {
      await signInAsRoleAdmin(page, account);
      await expect(page.locator(dashboardLocators.systemInfo.hostname)).toBeVisible({ timeout: dashboardTimeoutMs });
    });

    await test.step('the read-only admin can sign out', async () => {
      await signOut(page);
      await expect(page.locator(signinLocators.username)).toBeVisible();
    });
  });

  test('Restart and Shut Down are locked in the power menu', async ({ page, api }) => {
    const bootId = await readBootId(api);

    await signInAsRoleAdmin(page, account);
    await page.locator(topbarLocators.powerMenu).click();

    await expect(page.locator(topbarLocators.restart)).toBeVisible();
    await expect(page.locator(topbarLocators.restart)).toBeDisabled();
    await expect(page.locator(topbarLocators.shutDown)).toBeVisible();
    await expect(page.locator(topbarLocators.shutDown)).toBeDisabled();

    await page.keyboard.press('Escape');
    await expect(page.locator(topbarLocators.restart)).toBeHidden();

    expect(await readBootId(api)).toBe(bootId);
  });
});

// The baseline that makes the test above about the role: the same items, enabled,
// for the suite's full admin. Without it a menu that was always disabled would pass.
test.describe('as a full administrator', () => {
  test('Restart and Shut Down are enabled in the power menu', async ({ page }) => {
    await page.locator(topbarLocators.powerMenu).click();

    await expect(page.locator(topbarLocators.restart)).toBeEnabled();
    await expect(page.locator(topbarLocators.shutDown)).toBeEnabled();

    await page.keyboard.press('Escape');
    await expect(page.locator(topbarLocators.restart)).toBeHidden();
  });
});
