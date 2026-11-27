/**
 * Stories: an admin reads the license on the Support card, looks up the System Thumbprint, and opens the EULA from
 * global search. All read-only: each readout is checked against `system.info` and `truenas.license.info`, and the
 * production toggle, File Ticket and license upload are never touched. The Expiration Date uses the account's date
 * format, so the card test writes the `preferences.e2e.ts` baseline first and restores it afterwards.
 *
 * Save Debug is the one action taken: confirmed, it runs `system.debug` and the browser receives the archive;
 * cancelled, it starts nothing. The archive stays in Playwright's output, and the job leaves nothing to undo.
 */
import { readFile } from 'node:fs/promises';
import { findJobStateAfter, findLatestJobId } from '../fixtures/jobs';
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
import { readSystemIdentity } from '../fixtures/system-info';
import { goToGeneralSettings, goToViaGlobalSearch } from '../flows/navigation';
import { confirmSaveDebug, openSaveDebugConfirmation } from '../flows/support';
import { confirmDialogLocators } from '../locators/dialogs';
import { generalSettingsLocators } from '../locators/general-settings';
import { globalSearchLocators } from '../locators/navigation';
import { expect, test } from '../support/fixtures';

const { support, fingerprintDialog, eula } = generalSettingsLocators;

/** The UI waits for the job before it fetches the file, so the job is normally done already. */
const debugJobReadTimeoutMs = 30_000;

/** The first two bytes of every gzip stream. */
const gzipMagic = Buffer.from([0x1f, 0x8b]);

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

test.describe('Save Debug', () => {
  // A retry would only run `system.debug` for another minute or more to learn the same thing.
  test.describe.configure({ retries: 0 });

  test('an admin saves a debug, and the browser receives a gzipped archive named for the host', async ({ page, api }) => {
    const { hostname } = await readSystemIdentity(api);
    const shortHostname = hostname.split('.')[0];
    const since = await findLatestJobId(api, 'system.debug');

    await openSaveDebugConfirmation(page);
    const download = await confirmSaveDebug(page);

    // Then `<yyyyMMddHHmmss>`, the browser's time when the job started.
    const fileName = download.suggestedFilename();
    const prefix = `debug-${shortHostname}-`;
    expect(fileName.startsWith(prefix), `"${fileName}" should start with "${prefix}"`).toBe(true);
    expect(fileName.slice(prefix.length)).toMatch(/^\d{14}\.tgz$/);
    const archive = await readFile(await download.path());
    expect(archive.length).toBeGreaterThan(gzipMagic.length);
    expect(archive.subarray(0, gzipMagic.length).equals(gzipMagic)).toBe(true);

    await expect
      .poll(() => findJobStateAfter(api, 'system.debug', since), {
        message: 'The system.debug job the button started should have succeeded.',
        timeout: debugJobReadTimeoutMs,
      })
      .toBe('SUCCESS');
  });

  test('cancelling the confirmation starts no debug', async ({ page, api }) => {
    const since = await findLatestJobId(api, 'system.debug');

    await openSaveDebugConfirmation(page);
    await page.locator(confirmDialogLocators.cancel).click();
    await expect(page.locator(confirmDialogLocators.title)).toBeHidden();

    // `core.download` is only called once the dialog answers yes, so a closed dialog is the whole wait.
    expect(await findJobStateAfter(api, 'system.debug', since)).toBeUndefined();
  });
});
