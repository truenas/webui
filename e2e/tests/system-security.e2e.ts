/**
 * Stories: an admin sets a password policy from the System Security card on System > Advanced
 * Settings; the form refuses out-of-range values before anything is sent; and ticking STIG lists
 * what is missing, raises the other fields to the STIG minimums and blocks Save.
 *
 * A save is asserted twice, as `kernel-settings.e2e.ts` does: the card's readouts say the screen
 * believed it, `system.security.config` says the appliance did it. Whether middleware then
 * enforces the policy on a password is middleware's behaviour and out of scope.
 *
 * FIPS and STIG are NEVER saved, through the form or over the API. Enabling FIPS needs a reboot,
 * and enabling STIG locks out every account without two-factor — the suite's admin included.
 * The STIG test ticks the switch, reads what it did, and backs out without saving.
 *
 * A password-only save raises no reboot reason (`plugins/security/config.py` sets one only when
 * `enable_fips` or `enable_gpos_stig` changes), and a Max Password Age cannot flag the suite's
 * admin for a change: middleware computes `password_change_required` on read, from a password age
 * that a freshly installed appliance has nowhere near 90 days of, and stops once the age is
 * cleared again (`plugins/account.py`, `user_extend`).
 *
 * The policy is one config record, so nothing is created and nothing is deleted. The five
 * password fields are cleared before each test and written back as the appliance held them after
 * it. A policy left behind would make the user and password specs have their passwords refused.
 */
import { readDocker } from '../fixtures/apps';
import {
  isSystemSecurityAvailable,
  noPasswordPolicy,
  passwordPolicyOf,
  readSystemSecurity,
  setPasswordPolicy,
  suiteAdminHasTwoFactorSecret,
  type PasswordPolicy,
} from '../fixtures/system-security';
import { disableGlobalTwoFactor, readGlobalTwoFactor, type GlobalTwoFactorConfig } from '../fixtures/two-factor';
import { findUser } from '../fixtures/users';
import { goToAdvancedSettings } from '../flows/navigation';
import {
  discardSystemSecurityForm,
  openSystemSecurityForm,
  saveSystemSecurityForm,
  toggleComplexityRules,
} from '../flows/system-security';
import { systemSecurityLocators } from '../locators/system-security';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Every requirement the STIG probe can list as missing, by the id its link is built on. */
const stigRequirementIds = [
  'root-session',
  'global-2fa',
  'ssh-2fa',
  'apps-service',
  'root-password',
  'admin-password',
  'current-user-2fa',
  'user-2fa',
  'current-session-2fa',
];

/**
 * Whether the appliance renders the card at all, and the policy it held before the first test in
 * this file changed it. Read once per worker, as `startingDebugKernel` is in
 * `kernel-settings.e2e.ts`: a second read after a failed restore would record this file's own
 * policy as the appliance's.
 */
let available: boolean | undefined;
let startingPolicy: PasswordPolicy | undefined;
let startedHardened: boolean | undefined;

test.beforeEach(async ({ api }) => {
  available ??= await isSystemSecurityAvailable(api);
  // The card is behind the licence, not the STIG entitlement (`LicenseService.hasSystemSecurity$`).
  test.skip(!available, 'system.security.info.fips_available is false here, so the System Security card is hidden.');

  if (startedHardened === undefined) {
    const starting = await readSystemSecurity(api);
    startingPolicy = passwordPolicyOf(starting);
    startedHardened = starting.enable_fips || starting.enable_gpos_stig;
  }
  // A hardened appliance is not this suite's to touch: undoing either switch needs a reboot.
  test.skip(startedHardened, 'This appliance already has FIPS or STIG on, so the spec leaves it alone.');

  await setPasswordPolicy(api, noPasswordPolicy);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData('the password policy as the test left it')) {
    return;
  }

  // Guarded: Playwright runs this even when `beforeEach` skipped or threw before reading.
  await runCleanupSteps([
    ['restore the password policy', async () => {
      if (startingPolicy !== undefined && !startedHardened) {
        await setPasswordPolicy(api, startingPolicy);
      }
    }],
  ]);
});

test('an admin sets a password policy, and the card and the appliance keep it', async ({ page, api }) => {
  const { card, form } = systemSecurityLocators;

  await goToAdvancedSettings(page);
  for (const readout of [
    card.minPasswordAge, card.maxPasswordAge, card.complexityRuleset, card.minPasswordLength,
    card.passwordHistoryLength,
  ]) {
    await expect(page.locator(readout)).toHaveText('–');
  }
  await expect(page.locator(card.fips)).toHaveText('No');
  await expect(page.locator(card.stig)).toHaveText('No');

  await openSystemSecurityForm(page);
  await page.locator(form.minPasswordAge).fill('2');
  await page.locator(form.maxPasswordAge).fill('90');
  await toggleComplexityRules(page, ['Upper', 'Number']);
  await page.locator(form.minPasswordLength).fill('12');
  await page.locator(form.passwordHistoryLength).fill('3');
  await saveSystemSecurityForm(page);

  await expect(page.locator(card.minPasswordAge)).toHaveText('2 days');
  await expect(page.locator(card.maxPasswordAge)).toHaveText('90 days');
  await expect(page.locator(card.minPasswordLength)).toHaveText('12 characters');
  await expect(page.locator(card.passwordHistoryLength)).toHaveText('3 entries');
  // Middleware stores a set, so the order the readout lists them in is not the form's.
  const ruleset = page.locator(card.complexityRuleset);
  await expect(ruleset).toContainText('Upper');
  await expect(ruleset).toContainText('Number');
  await expect(ruleset).not.toContainText('Lower');
  await expect(ruleset).not.toContainText('Special');
  await expect(page.locator(card.fips)).toHaveText('No');
  await expect(page.locator(card.stig)).toHaveText('No');
  await expect(page.locator(systemSecurityLocators.rebootRequiredTitle)).toBeHidden();

  const saved = await readSystemSecurity(api);
  expect(saved).toMatchObject({
    enable_fips: false,
    enable_gpos_stig: false,
    min_password_age: 2,
    max_password_age: 90,
    min_password_length: 12,
    password_history_length: 3,
  });
  expect([...saved.password_complexity_ruleset].sort((a, b) => a.localeCompare(b))).toEqual(['NUMBER', 'UPPER']);
});

test('the form refuses out-of-range values before anything is sent', async ({ page, api }) => {
  const { form } = systemSecurityLocators;

  await goToAdvancedSettings(page);
  await openSystemSecurityForm(page);

  // Each just past the form's own `Validators.min`/`max`, worded by `tn-form-field-errors.provider.ts`.
  const outOfRange: [input: string, field: string, value: string, message: string][] = [
    [form.minPasswordAge, form.minPasswordAgeField, '366', 'Maximum value is 365'],
    [form.maxPasswordAge, form.maxPasswordAgeField, '5', 'Minimum value is 7'],
    [form.minPasswordLength, form.minPasswordLengthField, '7', 'Minimum value is 8'],
    [form.passwordHistoryLength, form.passwordHistoryLengthField, '11', 'Maximum value is 10'],
  ];
  for (const [input, field, value, message] of outOfRange) {
    await expect(page.locator(field)).not.toContainText(message);
    await page.locator(input).fill(value);
    await page.locator(input).blur();
    await expect(page.locator(field)).toContainText(message);
  }
  await expect(page.locator(form.save)).toBeDisabled();

  // One field put right clears its own message and leaves the other three holding Save down.
  await page.locator(form.maxPasswordAge).fill('7');
  await page.locator(form.maxPasswordAge).blur();
  await expect(page.locator(form.maxPasswordAgeField)).not.toContainText('Minimum value is 7');
  await expect(page.locator(form.save)).toBeDisabled();

  await discardSystemSecurityForm(page);

  expect(await readSystemSecurity(api)).toEqual({ enable_fips: false, enable_gpos_stig: false, ...noPasswordPolicy });
});

/**
 * The requirement links the probe should list for this appliance and this suite's admin, read
 * from the same sources the form reads (`setupStigRequirements`). Only global two-factor is
 * set by the test; the rest is whatever the appliance has, so it is asked rather than assumed.
 */
async function expectedStigRequirements(
  api: E2eApiClient,
  username: string,
  twoFactor: GlobalTwoFactorConfig,
): Promise<string[]> {
  const expected: string[] = [];

  if (username === 'root' || username === 'truenas_admin') {
    expected.push('root-session');
  }
  if (!twoFactor.enabled) {
    expected.push('global-2fa');
  }
  if (!twoFactor.services.ssh) {
    expected.push('ssh-2fa');
  }
  if ((await readDocker(api)).status !== 'UNCONFIGURED') {
    expected.push('apps-service');
  }
  const root = await findUser(api, 'root');
  if (root && !root.password_disabled) {
    expected.push('root-password');
  }
  const admin = await findUser(api, 'truenas_admin');
  if (admin && !admin.password_disabled) {
    expected.push('admin-password');
  }
  // The UI signed in with a token, never with a code, so its session is not a two-factor one.
  expected.push(await suiteAdminHasTwoFactorSecret(api) ? 'current-session-2fa' : 'current-user-2fa');

  return expected;
}

test.describe('with global two-factor off', () => {
  /** Global two-factor as the run found it: the tolerance window and SSH are written back from this. */
  let twoFactorBaseline: GlobalTwoFactorConfig | undefined;

  test.beforeEach(async ({ api }) => {
    twoFactorBaseline ??= await readGlobalTwoFactor(api);
    await disableGlobalTwoFactor(api, twoFactorBaseline);
  });

  // Not skipped under `TN_KEEP_TEST_DATA`: left on, every later sign-in meets the setup dialog.
  test.afterEach(async ({ api }) => {
    if (twoFactorBaseline) {
      await disableGlobalTwoFactor(api, twoFactorBaseline);
    }
  });

  test('ticking STIG lists the missing requirements and blocks Save, and backing out saves nothing', async ({
    page, api, config,
  }) => {
    const { card, form } = systemSecurityLocators;
    const twoFactor = await readGlobalTwoFactor(api);
    const expected = await expectedStigRequirements(api, config.username, twoFactor);
    const unexpected = stigRequirementIds.filter((id) => !expected.includes(id));

    await goToAdvancedSettings(page);
    await openSystemSecurityForm(page);
    await expect(page.locator(form.fipsCheckbox)).not.toBeChecked();
    // Never Save from here on: with STIG ticked it would lock the suite's admin out.
    await page.locator(form.stig).click();

    for (const id of expected) {
      await expect(page.locator(form.stigRequirement(id))).toBeVisible();
    }
    // The list renders whole from one probe, so once the expected links are there the rest are settled.
    for (const id of unexpected) {
      await expect(page.locator(form.stigRequirement(id))).toHaveCount(0);
    }

    // `watchStigToggle` raises every field to its STIG minimum and turns FIPS on with it.
    await expect(page.locator(form.fipsCheckbox)).toBeChecked();
    await expect(page.locator(form.minPasswordAge)).toHaveValue('1');
    await expect(page.locator(form.maxPasswordAge)).toHaveValue('60');
    await expect(page.locator(form.minPasswordLength)).toHaveValue('15');
    await expect(page.locator(form.passwordHistoryLength)).toHaveValue('5');
    for (const rule of ['Upper', 'Lower', 'Number', 'Special']) {
      await expect(page.locator(form.complexityRuleset)).toContainText(rule);
    }
    await expect(page.locator(form.save)).toBeDisabled();

    // Unticking clears the list but does not undo what ticking did to FIPS.
    await page.locator(form.stig).click();
    for (const id of expected) {
      await expect(page.locator(form.stigRequirement(id))).toHaveCount(0);
    }
    await expect(page.locator(form.fipsCheckbox)).toBeChecked();

    await discardSystemSecurityForm(page);

    await expect(page.locator(card.fips)).toHaveText('No');
    await expect(page.locator(card.stig)).toHaveText('No');
    expect(await readSystemSecurity(api)).toEqual({ enable_fips: false, enable_gpos_stig: false, ...noPasswordPolicy });
  });
});
