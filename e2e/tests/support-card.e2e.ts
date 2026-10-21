/**
 * Stories: an admin reads the appliance's license on the Support card, looks up the System
 * Thumbprint, and opens the EULA from global search.
 *
 * All of it is read-only. The card takes its readouts from the store, which combines `system.info`
 * with `truenas.license.info`, so each readout is checked against those two calls. Nothing on the
 * appliance is changed: the production toggle, File Ticket and the license upload are never
 * touched.
 *
 * ## Setup and teardown
 *
 * The Expiration Date is formatted with the account's date format, so the card test writes the
 * preference baseline from `preferences.e2e.ts` first and puts it back afterwards. The other tests
 * change nothing. Global search keeps its recent searches in the test's own `localStorage`.
 */
import { establishPreferenceBaseline, restorePreferences } from '../fixtures/preferences';
import type { PreferencesBlob } from '../fixtures/preferences';
import {
  additionalHardwareLabel,
  contractTypeLabel,
  decodeFingerprint,
  featuresLabel,
  firstEulaLine,
  hidesFingerprint,
  readEula,
  readFingerprint,
  readLicense,
  readProactiveSupport,
  readSupportSystemInfo,
  supportExpiryDate,
} from '../fixtures/support';
import { goToGeneralSettings, goToViaGlobalSearch } from '../flows/navigation';
import { generalSettingsLocators } from '../locators/general-settings';
import { globalSearchLocators } from '../locators/navigation';
import { expect, test } from '../support/fixtures';

const { support, fingerprintDialog, eula } = generalSettingsLocators;

test.describe('the Support card', () => {
  /** What `beforeEach` wrote, and therefore exactly what `afterEach` must undo to. */
  let baseline: PreferencesBlob | undefined;

  test.beforeEach(async ({ api }) => {
    baseline = await establishPreferenceBaseline(api);
  });

  test.afterEach(async ({ api }) => {
    // Guarded: Playwright runs this even when `beforeEach` threw. See `preferences.e2e.ts`.
    if (baseline) {
      await restorePreferences(api, baseline);
    }
  });

  test('the Support card shows the appliance\'s license as middleware holds it', async ({ page, api }) => {
    const license = await readLicense(api);
    if (!license) {
      // CI licenses the appliance before the suite runs. Unlicensed, the card shows a different list.
      test.skip(true, 'truenas.license.info is null here, so the Support card has no license readouts.');
      return;
    }
    const system = await readSupportSystemInfo(api);
    const proactive = await readProactiveSupport(api);
    const expiry = supportExpiryDate(license);
    const additionalHardware = additionalHardwareLabel(license);

    await goToGeneralSettings(page);

    // Features is rendered on every license, so it is what says the licensed list is in.
    await expect(page.locator(support.features)).toHaveText(featuresLabel(license));
    await expect(page.locator(support.model)).toHaveText(license.model || system.model);

    if (license.contract_type) {
      await expect(page.locator(support.contractType)).toHaveText(contractTypeLabel(license.contract_type));
    } else {
      await expect(page.locator(support.contractType)).toBeHidden();
    }

    if (license.serials.length) {
      await expect(page.locator(support.licensedSerials)).toHaveText(license.serials.join(' / '));
    } else {
      await expect(page.locator(support.licensedSerials)).toBeHidden();
    }

    // The date only: CI renews the license each run, so the day count after it moves.
    if (expiry) {
      await expect(page.locator(support.expirationDate)).toHaveText(new RegExp(`^\\s*${expiry}`));
    } else {
      await expect(page.locator(support.expirationDate)).toBeHidden();
    }

    if (!proactive.available) {
      await expect(page.locator(support.proactiveSupport)).toHaveText('Not Available');
    } else if (proactive.enabled) {
      await expect(page.locator(support.proactiveSupport)).toHaveText('Enabled');
    } else {
      await expect(page.locator(support.proactiveSupport)).toBeHidden();
    }

    if (system.serial) {
      await expect(page.locator(support.systemSerial)).toHaveText(system.serial);
    } else {
      await expect(page.locator(support.systemSerial)).toBeHidden();
    }

    if (additionalHardware) {
      await expect(page.locator(support.additionalHardware)).toHaveText(additionalHardware);
    } else {
      await expect(page.locator(support.additionalHardware)).toBeHidden();
    }
  });
});

test('an Enterprise license is not offered the System Thumbprint', async ({ page, api }) => {
  // The other half of the rule is the next test. One of the two always runs.
  test.skip(!hidesFingerprint(await readLicense(api)), 'The license here is not Enterprise, so the row is shown.');

  await goToGeneralSettings(page);

  // The row is decided from the license the readouts come from, so once Features is in, an absent
  // button is a hidden row rather than a slow one.
  await expect(page.locator(support.features)).toBeVisible();
  await expect(page.locator(support.viewFingerprint)).toHaveCount(0);
});

test('the System Thumbprint shows the appliance\'s thumbprint, key by key', async ({ page, api }) => {
  // The other half of the rule is the previous test. One of the two always runs.
  test.skip(hidesFingerprint(await readLicense(api)), 'The license here is Enterprise, so the row is hidden.');
  const raw = await readFingerprint(api);
  const fields = decodeFingerprint(raw);

  await goToGeneralSettings(page);
  await page.locator(support.viewFingerprint).click();
  await expect(page.locator(fingerprintDialog.title)).toBeVisible();

  if (fields) {
    for (const field of fields) {
      if ('value' in field) {
        await expect(page.locator(fingerprintDialog.field(field.key))).toHaveText(field.value);
      } else {
        for (const [index, item] of field.items.entries()) {
          await expect(page.locator(fingerprintDialog.fieldItem(field.key, index))).toHaveText(item);
        }
      }
    }
  } else {
    await expect(page.locator(fingerprintDialog.raw)).toHaveText(raw);
  }

  await page.locator(fingerprintDialog.close).click();
  await expect(page.locator(fingerprintDialog.title)).toBeHidden();
});

test('an admin opens the EULA from global search and reads it', async ({ page, api }) => {
  const html = await readEula(api);
  const line = html ? firstEulaLine(html) : undefined;
  if (!line) {
    // Without a EULA the page shows only its heading and no Back button, so there is nothing to read.
    test.skip(true, 'truenas.get_eula has no text on this appliance.');
    return;
  }

  await goToViaGlobalSearch(
    page,
    'EULA',
    globalSearchLocators.result(['System', 'Support', 'Eula']),
    /\/system\/support\/eula\/?$/,
  );

  await expect(page.locator(eula.text)).toContainText(line);

  await page.locator(eula.backToSupport).click();
  await expect(page).toHaveURL(/\/system\/general\/?$/);
});
