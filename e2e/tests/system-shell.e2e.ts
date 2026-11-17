/**
 * Story: an admin opens System > Shell and runs commands as themself; a bigger font saves a preference and resizes
 * the shell, as does resizing the window; a read-only admin (no `web_shell`) finds Shell locked. Only commands that
 * print and change nothing are typed (`echo`, `id -un`). Never `exit`: a closed shell reconnects on its own. The
 * font test pins `terminalFontSize` via the preference baseline and restores it. `core.resize_shell` is recorded
 * without params, so the claim is that a resize was sent and accepted, not its exact columns and rows.
 */
import type { Page } from '@playwright/test';
import {
  establishPreferenceBaseline, readPreference, restorePreferences,
} from '../fixtures/preferences';
import type { PreferencesBlob } from '../fixtures/preferences';
import {
  ensureRoleAdminAbsent, ensureRoleAdminPresent, roleAdmins,
} from '../fixtures/role-admins';
import { goToShell } from '../flows/navigation';
import { signInAsRoleAdmin } from '../flows/roles';
import { runInTerminal, waitForShell } from '../flows/terminal';
import { navLocators } from '../locators/navigation';
import { roleLocators } from '../locators/roles';
import { terminalLocators } from '../locators/terminal';
import { apiCallsTo } from '../support/api-calls';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** A command's output reaching the terminal. */
const shellOutputTimeoutMs = 15_000;

/** A resize goes out 300 ms after what caused it, then waits on middleware's answer. */
const resizeTimeoutMs = 15_000;

/** How many `core.resize_shell` calls the page has sent that middleware answered with a result. */
function answeredResizes(page: Page): number {
  return apiCallsTo(page, 'core.resize_shell').filter((call) => call.answer === 'result').length;
}

/** Waits for one more answered resize than `before`. */
async function expectResizeAfter(page: Page, before: number, message: string): Promise<void> {
  await expect.poll(() => answeredResizes(page), { message, timeout: resizeTimeoutMs }).toBeGreaterThan(before);
}

test('an admin opens Shell from the sidebar and runs a command as themself', async ({ page, config }) => {
  await goToShell(page);
  await waitForShell(page);
  const terminal = page.locator(terminalLocators.terminal);

  await test.step('a command\'s output comes back', async () => {
    // The typed line holds `$((...))`, not the sum, so only the command's output can match.
    const n = Math.floor(Math.random() * 9000) + 1000;
    await runInTerminal(page, `echo e2e-shell-$((${n}+1))`);

    await expect(terminal).toContainText(`e2e-shell-${n + 1}`, { timeout: shellOutputTimeoutMs });
  });

  await test.step('the shell is the signed-in account\'s', async () => {
    // The typed line holds `$(id -un)`, so `u=<name>` is only on screen once the command ran.
    await runInTerminal(page, 'echo u=$(id -un)');

    await expect(terminal).toContainText(`u=${config.username}`, { timeout: shellOutputTimeoutMs });
  });
});

test.describe('the font size', () => {
  test.use({ recordApiCalls: true });

  /** What `beforeEach` wrote, and therefore exactly what `afterEach` must undo to. */
  let baseline: PreferencesBlob | undefined;

  test.beforeEach(async ({ api }) => {
    baseline = await establishPreferenceBaseline(api);
  });

  test.afterEach(async ({ api }) => {
    // Guarded: an unguarded call after a failed `beforeEach` would write `null` over the attribute.
    if (baseline) {
      await restorePreferences(api, baseline);
    }
  });

  test('a bigger font is saved and resizes the shell, as does a bigger window', async ({ page, api }) => {
    await goToShell(page);
    await waitForShell(page);
    const terminal = page.locator(terminalLocators.terminal);

    // The initial fit, which the font-size control sets off when the shell connects.
    await expectResizeAfter(page, 0, 'the shell should be fitted to the page once it connects');
    await expect(terminal).toHaveCSS('font-size', '14px');

    await test.step('+ saves a bigger font and resizes the shell', async () => {
      const before = answeredResizes(page);
      await page.locator(terminalLocators.increaseFontSize).click();

      await expect(terminal).toHaveCSS('font-size', '15px');
      await expectResizeAfter(page, before, 'a bigger font should resize the shell');
      await expect.poll(
        () => readPreference(api, 'terminalFontSize'),
        { message: 'the bigger font should be saved in the preferences' },
      ).toBe(15);
    });

    await test.step('a bigger window resizes the shell', async () => {
      const before = answeredResizes(page);
      // Bigger than the desktop default, so the sidebar stays as it was.
      await page.setViewportSize({ width: 1440, height: 900 });

      await expectResizeAfter(page, before, 'a bigger window should resize the shell');
    });
  });
});

test.describe('as a read-only administrator', () => {
  test.use({ authenticate: false });

  const account = roleAdmins.readOnly;

  test.beforeEach(async ({ api }) => {
    await ensureRoleAdminAbsent(api, account);
    await ensureRoleAdminPresent(api, account);
  });

  test.afterEach(async ({ api }) => {
    if (leavingTestData(`user "${account.username}"`)) {
      return;
    }

    await runCleanupSteps([
      [`remove user ${account.username}`, () => ensureRoleAdminAbsent(api, account)],
    ]);
  });

  test('finds Shell locked in the System menu', async ({ page }) => {
    await signInAsRoleAdmin(page, account);
    await page.locator(navLocators.system).filter({ visible: true }).first().click();

    // The built-in read-only privilege has no `web_shell`. Not clicked: an `<a>` cannot be disabled,
    // so the wrapper is the whole of the lock.
    const shell = page.locator(navLocators.shell).filter({ visible: true });
    await expect(shell).toBeVisible();
    await expect(page.locator(roleLocators.missing).filter({ has: shell })).toHaveCount(1);
  });
});
