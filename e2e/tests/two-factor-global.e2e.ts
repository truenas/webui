/**
 * Stories: an admin changes global two-factor from its Advanced Settings card while it's on (a save that keeps it on
 * asks for confirmation) and turns it off; checked on the card and in `auth.twofactor.config`. While it's on, the
 * layout holds a secretless account's first route behind a setup dialog the token sign-in would wait out, so each
 * test signs in with it off, enables it over the API, reloads and skips the dialog; the admin never gets a secret.
 * It's turned off before and after every test, unconditionally and not skipped under `TN_KEEP_TEST_DATA`: left on,
 * every later spec would open behind that dialog.
 */
import { disableGlobalTwoFactor, readGlobalTwoFactor, type GlobalTwoFactorConfig } from '../fixtures/two-factor';
import { goToAdvancedSettings } from '../flows/navigation';
import { confirmGlobalTwoFactorChange, openGlobalTwoFactorForm, startWithGlobalTwoFactorOn } from '../flows/two-factor';
import { topbarLocators } from '../locators/topbar';
import { twoFactorLocators } from '../locators/two-factor';
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

test('changing the settings while two-factor is on asks first, and the appliance keeps them', async ({
  page, api,
}) => {
  const { globalCard, globalForm } = twoFactorLocators;
  const newWindow = 3;

  // SSH starts off, so ticking it is a change.
  await startWithGlobalTwoFactorOn(page, api, startingWindow);
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

  await startWithGlobalTwoFactorOn(page, api, startingWindow);

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
