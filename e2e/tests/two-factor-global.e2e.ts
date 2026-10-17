/**
 * Stories: an admin changes global two-factor authentication from its card on
 * System > Advanced Settings while it is on, and turns it off.
 *
 * Turning it on from the card is covered by `unauthenticated/two-factor.e2e.ts`,
 * which goes on to sign in with a code. These start from it on, which is where
 * the form behaves differently: a save that keeps it on asks for confirmation
 * first, and one that turns it off does not.
 *
 * Each save is asserted twice: the card's readouts say the screen believed it,
 * `auth.twofactor.config` says the appliance did it.
 *
 * Starting with it on takes care. While it is on, the admin layout puts an
 * account with no secret — this suite's admin — through a full-screen setup
 * dialog on its first route, and holds that route until the dialog closes. The
 * token sign-in waits for the shell, so it would spend its whole budget behind
 * that dialog. So each test signs in with two-factor off, turns it on over the
 * API and reloads: the app starts again, reads the setting afresh, raises the
 * dialog, and the test skips it. The suite's admin is never given a secret.
 *
 * Global two-factor is turned off before each test and after it,
 * unconditionally and deliberately not skipped under `TN_KEEP_TEST_DATA`: left
 * on, every later spec would open behind that dialog.
 */
import type { Page } from '@playwright/test';
import {
  disableGlobalTwoFactor, readGlobalTwoFactor, setGlobalTwoFactor, type GlobalTwoFactorConfig,
} from '../fixtures/two-factor';
import { goToAdvancedSettings } from '../flows/navigation';
import { confirmGlobalTwoFactorChange, openGlobalTwoFactorForm, skipTwoFactorSetupPrompt } from '../flows/two-factor';
import { topbarLocators } from '../locators/topbar';
import { twoFactorLocators } from '../locators/two-factor';
import type { E2eApiClient } from '../support/api/client';
import { expect, test } from '../support/fixtures';

const saveTimeoutMs = 60_000;

/** The tolerance window each test starts from, so a change to it is visible. */
const startingWindow = 1;

/** Global two-factor as the run found it: the tolerance window and SSH are written back from this. */
let baseline: GlobalTwoFactorConfig | undefined;

function foundBaseline(): GlobalTwoFactorConfig {
  if (!baseline) {
    throw new Error('Global two-factor was never read, so there is nothing to restore it from.');
  }
  return baseline;
}

test.beforeAll(async ({ api }) => {
  baseline = await readGlobalTwoFactor(api);
});

/** Before as well as after, so an interrupted run that left it on cannot stop the next sign-in. */
test.beforeEach(async ({ api }) => {
  await disableGlobalTwoFactor(api, foundBaseline());
});

test.afterEach(async ({ api }) => {
  if (baseline) {
    await disableGlobalTwoFactor(api, baseline);
  }
});

/**
 * Turns global two-factor on over the API under a page that is already signed
 * in, reloads so the app reads it afresh, and skips the setup dialog that
 * raises. SSH starts off, so turning it on is a change.
 */
async function startWithTwoFactorOn(page: Page, api: E2eApiClient): Promise<void> {
  await setGlobalTwoFactor(api, {
    enabled: true,
    window: startingWindow,
    services: { ssh: false },
  });
  await page.reload();
  await skipTwoFactorSetupPrompt(page);
}

test('changing the settings while two-factor is on asks first, and the appliance keeps them', async ({
  page, api,
}) => {
  const { globalCard, globalForm } = twoFactorLocators;
  const newWindow = 3;

  await startWithTwoFactorOn(page, api);
  await openGlobalTwoFactorForm(page, 'Enabled');
  await expect(page.locator(globalForm.window)).toHaveValue(String(startingWindow));

  await page.locator(globalForm.ssh).setChecked(true);
  await page.locator(globalForm.window).fill(String(newWindow));
  await page.locator(globalForm.save).click();
  // Nothing is sent until this is accepted, so the panel closing below is the save landing after it.
  await confirmGlobalTwoFactorChange(page);
  await expect(page.locator(globalForm.save)).toBeHidden({ timeout: saveTimeoutMs });

  // A save that leaves it on takes the admin to set up their own secret. Nothing
  // is clicked there: that would give the suite's admin one.
  await expect(page).toHaveURL(/\/two-factor-auth\/?$/, { timeout: saveTimeoutMs });

  await goToAdvancedSettings(page);
  await expect(page.locator(globalCard.state)).toHaveText('Enabled');
  await expect(page.locator(globalCard.window)).toHaveText(String(newWindow));
  await expect(page.locator(globalCard.ssh)).toHaveText('Enabled');

  expect(await readGlobalTwoFactor(api)).toMatchObject({
    enabled: true,
    window: newWindow,
    services: { ssh: true },
  });
});

test('an admin turns two-factor off, and the user menu stops offering it', async ({ page, api }) => {
  const { globalCard, globalForm } = twoFactorLocators;
  const twoFactorMenuItem = page.locator(topbarLocators.twoFactorAuth);

  await startWithTwoFactorOn(page, api);

  // Offered while it is on, so its absence at the end is the save's doing.
  await page.locator(topbarLocators.userMenu).click();
  await expect(twoFactorMenuItem).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(twoFactorMenuItem).toBeHidden();

  await openGlobalTwoFactorForm(page, 'Enabled');
  await page.locator(globalForm.enabled).setChecked(false);
  await page.locator(globalForm.save).click();
  // No warning this time. Had one been raised, nothing would be sent and the panel would stay open.
  await expect(page.locator(globalForm.save)).toBeHidden({ timeout: saveTimeoutMs });

  await expect(page.locator(globalCard.state)).toHaveText('Disabled');
  expect((await readGlobalTwoFactor(api)).enabled).toBe(false);

  await page.locator(topbarLocators.userMenu).click();
  await expect(page.locator(topbarLocators.preferences)).toBeVisible();
  await expect(twoFactorMenuItem).toBeHidden();
});
