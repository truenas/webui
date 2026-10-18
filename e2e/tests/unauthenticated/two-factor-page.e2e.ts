/**
 * Stories: a user who already has two-factor opens the Two-Factor Authentication
 * page from the user menu and renews their secret, confirming the new one with a
 * code; unsets it; or starts a renewal and cancels it, which leaves the account
 * with no secret at all, because the old one was replaced the moment Renew ran.
 *
 * `two-factor.e2e.ts` and `two-factor-setup.e2e.ts` set a secret up on an account
 * that has none, where the card's button reads Configure and asks nothing first.
 * This is the same card on an account that has one, where it reads Renew, asks
 * for a confirmation, and offers Unset beside it.
 *
 * Under `tests/unauthenticated/` because the user signs in through the form with
 * a code: the token bypass mints tokens for the suite's admin only, who must
 * never hold a secret. One sign-in per test, a password and a code, and each is
 * one `auth.login_ex` from the unauthenticated rate limit (20 per method per IP
 * per 60s): six across this file.
 *
 * The starting secret is armed over the API, as in `two-factor-signin.e2e.ts`,
 * and a fresh one per test, so no sign-in code is ever replayed. Codes are
 * computed on the appliance's clock (`applianceNow`), which both the sign-in and
 * the card check them against. Secrets are compared as booleans and codes are
 * only typed into a field: neither is ever quoted in an assertion.
 *
 * The page keeps a renewal awaiting its code in `localStorage`, keyed by
 * username. Every test has a fresh browser context, so none inherits one.
 *
 * Global two-factor is on here as a precondition, and left on it would put every
 * later account with no secret — the suite's admin included — through the setup
 * dialog. So it is turned off after each test, unconditionally and not skipped
 * under `TN_KEEP_TEST_DATA`, and the user goes with it: a secret left on it would
 * ask for a code at its next sign-in in another spec.
 */
import type { Page } from '@playwright/test';
import {
  armTwoFactorSecret, disableGlobalTwoFactor, ensureTwoFactorUserPresent, readGlobalTwoFactor,
  setGlobalTwoFactor, twoFactorUser,
  type GlobalTwoFactorConfig,
} from '../../fixtures/two-factor';
import { ensureUserAbsent, findUser } from '../../fixtures/users';
import { attemptSignIn, awaitAdminShell, signInTimeoutMs } from '../../flows/auth';
import {
  confirmTwoFactorCode, confirmUnsetFrom, openTwoFactorPage, renewTwoFactorSecret, submitOneTimePassword,
} from '../../flows/two-factor';
import { twoFactorLocators } from '../../locators/two-factor';
import type { E2eApiClient } from '../../support/api/client';
import { runCleanupSteps } from '../../support/cleanup';
import { expect, test } from '../../support/fixtures';
import { applianceNow, totpCode } from '../../support/totp';

/**
 * One step either side of now, so a code computed just before a 30-second
 * boundary is still accepted once it reaches the appliance or the card.
 */
const toleranceWindow = 1;

/** Global two-factor as the run found it: the tolerance window and SSH are written back from this. */
let baseline: GlobalTwoFactorConfig | undefined;

/** The secret armed for this test's user: what it signs in with. */
let secret = '';

function foundBaseline(): GlobalTwoFactorConfig {
  if (!baseline) {
    throw new Error('Global two-factor was never read, so there is nothing to restore it from.');
  }
  return baseline;
}

/** Signs the user in through the form with their password and the code the armed secret gives now. */
async function signInWithCode(page: Page, api: E2eApiClient): Promise<void> {
  const { username, password } = twoFactorUser;

  await attemptSignIn(page, username, password);
  await submitOneTimePassword(page, totpCode(secret, await applianceNow(api)));
  await awaitAdminShell(page, username);
}

/** The secret the card shows beside the QR code. */
async function secretOnScreen(page: Page): Promise<string> {
  const secretText = page.locator(twoFactorLocators.setup.secret);
  await expect(secretText).not.toBeEmpty({ timeout: signInTimeoutMs });
  return (await secretText.innerText()).trim();
}

async function hasSecret(api: E2eApiClient): Promise<boolean | undefined> {
  return (await findUser(api, twoFactorUser.username))?.twofactor_auth_configured;
}

test.beforeAll(async ({ api }) => {
  baseline = await readGlobalTwoFactor(api);
});

/** Deleting the account first is also what removes a secret an interrupted run left on it. */
test.beforeEach(async ({ api }) => {
  await ensureUserAbsent(api, twoFactorUser.username);
  await ensureTwoFactorUserPresent(api);
  await setGlobalTwoFactor(api, {
    enabled: true,
    window: toleranceWindow,
    services: foundBaseline().services,
  });
  secret = await armTwoFactorSecret(api, twoFactorUser.username);
});

test.afterEach(async ({ api }) => {
  await runCleanupSteps([
    ['delete the user, and its secret with it', () => ensureUserAbsent(api, twoFactorUser.username)],
    ['turn global two-factor off', () => disableGlobalTwoFactor(api, foundBaseline())],
  ]);
});

test('a user renews their secret on the page, and confirms the new one with a code', async ({ page, api }) => {
  const { setup } = twoFactorLocators;
  let renewed = '';

  await test.step('the page opens from the user menu, showing the current secret', async () => {
    await signInWithCode(page, api);
    await openTwoFactorPage(page);
  });

  await test.step('Renew, confirmed, replaces the secret and asks for a code for it', async () => {
    const previous = await secretOnScreen(page);
    await renewTwoFactorSecret(page);

    renewed = await secretOnScreen(page);
    expect(renewed !== previous, 'the secret on screen is still the one from before Renew').toBe(true);
    await expect(page.locator(setup.unsetSecret)).toBeHidden();
  });

  await test.step('the code the new secret gives now is accepted', async () => {
    await confirmTwoFactorCode(page, totpCode(renewed, await applianceNow(api)));

    await expect(page.locator(setup.code)).toBeHidden({ timeout: signInTimeoutMs });
    await expect(page.locator(setup.unsetSecret)).toBeVisible();
  });

  expect(await hasSecret(api)).toBe(true);
});

test('a user unsets their secret on the page', async ({ page, api }) => {
  const { setup } = twoFactorLocators;
  const secretText = page.locator(setup.secret);

  await signInWithCode(page, api);
  await openTwoFactorPage(page);
  // On screen before Unset, so its going below is the Unset's doing.
  await expect(secretText).toBeVisible();

  await confirmUnsetFrom(page, setup.unsetSecret);

  await expect(secretText).toBeHidden({ timeout: signInTimeoutMs });
  await expect(page.locator(setup.unsetSecret)).toBeHidden();
  expect(await hasSecret(api)).toBe(false);
});

test('cancelling a renewal leaves the account with no secret', async ({ page, api }) => {
  const { setup } = twoFactorLocators;

  await signInWithCode(page, api);
  await openTwoFactorPage(page);
  await renewTwoFactorSecret(page);
  // The renewal armed a new secret, so the account holds one until Cancel.
  expect(await hasSecret(api)).toBe(true);

  await confirmUnsetFrom(page, setup.cancelSetup);

  await expect(page.locator(setup.code)).toBeHidden({ timeout: signInTimeoutMs });
  expect(await hasSecret(api)).toBe(false);
});
