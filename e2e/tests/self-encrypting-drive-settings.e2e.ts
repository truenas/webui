/**
 * Stories: an admin sets, mistypes and clears the global SED password from the
 * Self-Encrypting Drive card on System > Advanced Settings.
 *
 * Each save is asserted twice: the card's readout, which shows one `*` per
 * character or `–` when empty, and `system.advanced.sed_global_password_is_set`.
 * The CI appliance has no SED drives, so whether the password unlocks one is out
 * of scope; the stored setting is the claim.
 *
 * Runs only where the password can be put back. That means an appliance that
 * started with none set, since restoring one means sending it in clear text —
 * see `fixtures/self-encrypting-drive.ts`. Every test starts and ends with the
 * password cleared and read back as cleared.
 *
 * The card is rendered, and middleware takes a non-empty password, unless the
 * `SED` entitlement is explicitly denied.
 */
import { entitlementFeature, isNotDenied } from '../fixtures/entitlements';
import {
  clearSedPassword, isSedPasswordSet, readSedPassword, setSedPassword,
} from '../fixtures/self-encrypting-drive';
import { goToAdvancedSettings } from '../flows/navigation';
import { openSedForm, saveSedForm } from '../flows/self-encrypting-drive';
import { selfEncryptingDriveLocators } from '../locators/self-encrypting-drive';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** 16 characters, so the card reads 16 `*`. */
const sedPassword = 'e2e-sed-password';
const maskedSedPassword = '*'.repeat(sedPassword.length);
const mismatchedPassword = 'e2e-sed-mismatch';

/**
 * Whether a password was set before the first test in this file ran. Read once,
 * so a password this file failed to clear is never mistaken for the appliance's
 * own and cleared on its behalf — or, worse, taken as permission to write one.
 */
let startedWithPassword: boolean | undefined;

test.beforeEach(async ({ api, entitlements }) => {
  // The card is hidden and middleware refuses the password when SED is denied.
  test.skip(
    !isNotDenied(entitlements, entitlementFeature.sed),
    `the ${entitlementFeature.sed} entitlement is denied on this appliance`,
  );
  startedWithPassword ??= await isSedPasswordSet(api);
  // Restoring a password the suite did not set means writing it back in clear text.
  test.skip(startedWithPassword, 'a global SED password was already set on this appliance');

  await clearSedPassword(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData('the global SED password as the test left it')) {
    return;
  }

  // Only once it is known that the appliance started without one: never clear a password the suite did not set.
  await runCleanupSteps([
    ['clear the global SED password', async () => {
      if (startedWithPassword === false) {
        await clearSedPassword(api);
      }
    }],
  ]);
});

test('an admin sets the global SED password, and the card shows its length', async ({ page, api }) => {
  const card = selfEncryptingDriveLocators.card;
  const form = selfEncryptingDriveLocators.form;

  await goToAdvancedSettings(page);
  await expect(page.locator(card.password)).toHaveText('–');

  await openSedForm(page);
  await expect(page.locator(form.password)).toHaveValue('');
  await expect(page.locator(form.confirmPassword)).toHaveValue('');

  await page.locator(form.password).fill(sedPassword);
  await page.locator(form.confirmPassword).fill(sedPassword);
  await saveSedForm(page);

  await expect(page.locator(card.password)).toHaveText(maskedSedPassword);
  expect(await isSedPasswordSet(api)).toBe(true);
  // Compared rather than asserted equal, so a failure does not print what the appliance holds.
  expect(await readSedPassword(api) === sedPassword, 'sed_global_password is the value typed').toBe(true);
});

test('the SED form refuses a confirmation that does not match', async ({ page, api }) => {
  const form = selfEncryptingDriveLocators.form;
  const save = page.locator(form.save);

  await goToAdvancedSettings(page);
  await openSedForm(page);

  await page.locator(form.password).fill(sedPassword);
  await page.locator(form.confirmPassword).fill(mismatchedPassword);
  await expect(save).toBeDisabled();

  await page.locator(form.confirmPassword).fill(sedPassword);
  await expect(save).toBeEnabled();

  await page.locator(form.confirmPassword).fill(mismatchedPassword);
  await expect(save).toBeDisabled();

  // The panel is left open: closing a dirty form asks about unsaved changes, and nothing here needs it gone.
  expect(await isSedPasswordSet(api)).toBe(false);
});

test('an admin clears the global SED password, and the form opened holding it', async ({ page, api }) => {
  const card = selfEncryptingDriveLocators.card;
  const form = selfEncryptingDriveLocators.form;

  await setSedPassword(api, sedPassword);

  await goToAdvancedSettings(page);
  await expect(page.locator(card.password)).toHaveText(maskedSedPassword);

  await openSedForm(page);
  await expect(page.locator(form.password)).toHaveValue(sedPassword);
  await expect(page.locator(form.confirmPassword)).toHaveValue(sedPassword);

  await page.locator(form.password).fill('');
  await page.locator(form.confirmPassword).fill('');
  await saveSedForm(page);

  await expect(page.locator(card.password)).toHaveText('–');
  expect(await isSedPasswordSet(api)).toBe(false);
});
