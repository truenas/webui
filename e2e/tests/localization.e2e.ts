/**
 * Stories: an admin changes the timezone, the language and the date format, and
 * each one sticks.
 *
 * The three are not saved in the same place. The timezone is the appliance's, set
 * from the Localization card on System > General Settings and stored in
 * `system.general`. The language and the date format are the signed-in account's,
 * set from the Localization section of the Preferences form and stored in its
 * `preferences` attribute. The card used to hold all three. Each test asserts
 * twice: once on the screen, and once through the API that stores it.
 *
 * ## Setup and teardown
 *
 * The timezone is one config record, so there is nothing to delete. Each test
 * starts from a timezone it writes, and teardown writes back the one the
 * appliance held before the first test, as `replication-settings.e2e.ts` does.
 *
 * The preferences are a blob on the account the whole suite signs in as, so these
 * tests use the baseline and teardown from `preferences.e2e.ts`. That baseline
 * includes English and the default date format, so a run that died with the app
 * in German does not start the next one there.
 */
import { findRunningBootEnvironment } from '../fixtures/boot-environments';
import { readTimezone, readTimezoneLabel, setTimezone } from '../fixtures/localization';
import { establishPreferenceBaseline, readPreference, restorePreferences } from '../fixtures/preferences';
import type { PreferencesBlob } from '../fixtures/preferences';
import { chooseTimezone, openLocalizationForm, saveLocalizationForm } from '../flows/localization';
import { goToBootEnvironments, goToGeneralSettings } from '../flows/navigation';
import {
  chooseDateFormat, chooseLanguage, monthDayYearLabel, openPreferencesForm, savePreferences,
} from '../flows/preferences';
import { bootEnvironmentLocators } from '../locators/boot-environments';
import { localizationLocators } from '../locators/localization';
import { leavingTestData } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** The timezone the timezone test starts from, and the one it moves the appliance to. */
const startingTimezone = 'America/Los_Angeles';
const newTimezone = 'Asia/Tokyo';

/**
 * A language whose word for the card's Settings button is unmistakable.
 *
 * The translation is from `src/assets/i18n/de.json`. If that file changes the
 * word, this test fails on the text and not on the language.
 */
const german = { label: 'Deutsch (de)', code: 'de', settings: 'Einstellungen' };

test.describe('the appliance timezone', () => {
  /** What the appliance held before this file ran, and therefore what `afterEach` writes back. */
  let found: string | undefined;

  test.beforeAll(async ({ api }) => {
    found = await readTimezone(api);
  });

  test.beforeEach(async ({ api }) => {
    await setTimezone(api, startingTimezone);
  });

  test.afterEach(async ({ api }) => {
    if (leavingTestData('the timezone as the test left it')) {
      return;
    }

    // Guarded: if `beforeAll` threw, there is nothing known to write back.
    if (found !== undefined) {
      await setTimezone(api, found);
    }
  });

  test('an admin changes the timezone, and the appliance keeps it', async ({ page, api }) => {
    const startingLabel = await readTimezoneLabel(api, startingTimezone);
    const newLabel = await readTimezoneLabel(api, newTimezone);

    await openLocalizationForm(page, startingTimezone, startingLabel);
    await chooseTimezone(page, newLabel);
    await saveLocalizationForm(page);

    await expect(page.locator(localizationLocators.card.timezone)).toHaveText(newTimezone);
    expect(await readTimezone(api)).toBe(newTimezone);
  });
});

test.describe('the account language and date format', () => {
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

  test('an admin switches the app to German, and the account keeps it', async ({ page, api }) => {
    const settings = page.locator(localizationLocators.card.settings);

    await goToGeneralSettings(page);
    await expect(settings).toHaveText('Settings');

    await openPreferencesForm(page);
    await chooseLanguage(page, german.label);
    await savePreferences(page);

    // The page behind the panel is translated in place, without a reload.
    await expect(settings).toHaveText(german.settings);
    await expect.poll(() => readPreference(api, 'language')).toBe(german.code);
  });

  test('an admin picks a date format, and dates are shown in it', async ({ page, api }) => {
    const running = await findRunningBootEnvironment(api);
    const created = page.locator(bootEnvironmentLocators.list.dateCreated(running.id));

    // The running boot environment is the one row every appliance has, and its
    // Date Created cell goes through the account's date format.
    await goToBootEnvironments(page);
    await expect(created).toHaveText(/^\d{4}-\d{2}-\d{2} /);

    await openPreferencesForm(page);
    await chooseDateFormat(page, monthDayYearLabel(await readTimezone(api)));
    await savePreferences(page);

    // The cell is re-rendered in place, without a reload.
    await expect(created).toHaveText(/^\d{2}\/\d{2}\/\d{4} /);
    await expect.poll(() => readPreference(api, 'dateFormat')).toBe('MM/dd/yyyy');
  });
});
