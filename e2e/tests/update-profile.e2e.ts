/**
 * Story: an admin chooses an update profile on System > Update, and the appliance keeps it.
 *
 * Which profiles are listed, and which of them are available, is the appliance's answer, so every
 * test reads `update.profile_choices` and `update.config` first and derives names from them. In
 * middleware (`plugins/update_/profile_.py`), an appliance without the Mission Critical entitlement
 * lists Developer, Early Adopter and General, and one with it lists General and Mission Critical. A
 * profile is available when it is the configured one, or when it is no more conservative than the
 * profile of the installed version. The CI appliance has no Mission Critical entitlement, and
 * `dashboard-update-state.e2e.ts` switches it to Developer and back on every run, so at least those
 * two are on offer there. Nothing here could read the appliance directly, so which of Early Adopter
 * and General are also available is left to the API on the day.
 *
 * Switching only rewrites the configuration: `update.update` sends an `update.status` CHANGED event
 * and clears the HasUpdate alert, and starts no download (`plugins/update_/config.py`). So the
 * test asserts the configuration and nothing about update availability. `update.status` asks the
 * update server, and the page shows the card only once that has answered, hence the long ceiling on
 * the first wait. Whatever the page says about updates is not asserted.
 *
 * The profile is global. It is read once, before the first test changes it, written back in
 * `beforeEach` when the appliance holds something else, and written back in `afterEach`
 * unconditionally. If the starting profile was available only because it was the configured one,
 * middleware refuses it once another is configured, and the restore fails with that refusal rather
 * than leaving the appliance quietly on the wrong profile.
 *
 * Does not need a pool, so it does not ask for the `pool` fixture.
 */
import type { Page } from '@playwright/test';
import { readUpdateProfile, readUpdateProfileChoices, setUpdateProfile } from '../fixtures/update';
import type { UpdateProfile, UpdateProfileChoices } from '../fixtures/update';
import { goToDashboard, goToUpdate } from '../flows/navigation';
import { applyUpdateProfile, chooseUpdateProfile } from '../flows/update';
import { confirmDialogLocators } from '../locators/dialogs';
import { updateLocators } from '../locators/update';
import { apiCallsTo } from '../support/api-calls';
import { runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

test.use({ recordApiCalls: true });

/** The card waits for `update.status`, which asks the update server; so does the reload after a switch. */
const updatePageTimeoutMs = 60_000;

/** One entry of `update.profile_choices`, with its id. */
interface ProfileChoice {
  id: string;
  name: string;
  available: boolean;
}

/** The profile the appliance held before the first test in this file changed it. */
let startingProfile: UpdateProfile | undefined;

function profilesOf(choices: UpdateProfileChoices): ProfileChoice[] {
  return Object.entries(choices).map(([id, choice]) => ({ id, name: choice.name, available: choice.available }));
}

function availableProfiles(choices: UpdateProfileChoices): ProfileChoice[] {
  return profilesOf(choices).filter((profile) => profile.available);
}

/** The `name` the card labels a profile id with. */
function nameOf(choices: UpdateProfileChoices, id: string): string {
  const profile = profilesOf(choices).find((choice) => choice.id === id);
  if (!profile) {
    throw new Error(`update.profile_choices does not list the profile ${id}`);
  }
  return profile.name;
}

/** The first available profile that is not `current`, which is what each switch moves to. */
function otherAvailableProfile(choices: UpdateProfileChoices, current: string): ProfileChoice {
  const other = availableProfiles(choices).find((profile) => profile.id !== current);
  if (!other) {
    throw new Error(`No update profile other than ${current} is available`);
  }
  return other;
}

/** Opens System > Update and waits for the profile card to show `profileName`. */
async function openUpdateProfileCard(page: Page, profileName: string): Promise<void> {
  await goToUpdate(page);
  await expect(page.locator(updateLocators.profile.select)).toHaveText(profileName, { timeout: updatePageTimeoutMs });
}

test.beforeEach(async ({ api }) => {
  startingProfile ??= await readUpdateProfile(api);
  if (await readUpdateProfile(api) !== startingProfile) {
    await setUpdateProfile(api, startingProfile);
  }
});

test.afterEach(async ({ api }) => {
  // Guarded: Playwright runs this even when `beforeEach` threw. Writing `undefined` would send `null`.
  await runCleanupSteps([
    ['restore the update profile', async () => {
      if (startingProfile !== undefined && await readUpdateProfile(api) !== startingProfile) {
        await setUpdateProfile(api, startingProfile);
      }
    }],
  ]);
});

test('an admin switches to another available profile, and the appliance keeps it', async ({ page, api }) => {
  const choices = await readUpdateProfileChoices(api);
  const current = await readUpdateProfile(api);
  expect(current).toBe(startingProfile);

  // With one profile on offer the card disables Apply, so there is nothing to switch to.
  test.skip(availableProfiles(choices).length < 2, 'fewer than two update profiles are available on this appliance');
  const target = otherAvailableProfile(choices, current);

  await openUpdateProfileCard(page, nameOf(choices, current));

  const configCallsBefore = apiCallsTo(page, 'update.config').length;
  await applyUpdateProfile(page, target.name);

  // A successful switch emits `profileSwitched`, and the page reloads everything it shows.
  await expect.poll(
    () => apiCallsTo(page, 'update.config').slice(configCallsBefore).map((call) => call.answer),
    { timeout: updatePageTimeoutMs },
  ).toContain('result');
  expect(await readUpdateProfile(api)).toBe(target.id);

  // Coming back reads the stored profile, not whatever the control was left holding.
  await goToDashboard(page);
  await openUpdateProfileCard(page, target.name);
});

test('the select offers exactly the available profiles', async ({ page, api }) => {
  const choices = await readUpdateProfileChoices(api);
  const current = await readUpdateProfile(api);
  const profiles = profilesOf(choices);
  const available = profiles.filter((profile) => profile.available);
  const notAvailable = profiles.filter((profile) => !profile.available);

  await openUpdateProfileCard(page, nameOf(choices, current));
  await page.locator(updateLocators.profile.select).click();

  for (const profile of available) {
    await expect(page.locator(updateLocators.profile.option(profile.name))).toBeVisible();
  }
  await expect(page.locator(updateLocators.profile.options)).toHaveCount(available.length);

  // Empty when the appliance offers every profile it lists. The loop stays, so it checks when it does not.
  for (const profile of notAvailable) {
    await expect(page.locator(updateLocators.profile.option(profile.name))).toHaveCount(0);
    await expect(page.locator(updateLocators.profile.name(profile.name))).toBeVisible();
  }

  if (available.some((profile) => profile.id === current)) {
    await expect(page.locator(updateLocators.profile.current)).toHaveCount(0);
  } else {
    await expect(page.locator(updateLocators.profile.current)).toHaveText(nameOf(choices, current));
  }

  await page.keyboard.press('Escape');
});

test('cancelling the confirmation leaves the profile as it was', async ({ page, api }) => {
  const choices = await readUpdateProfileChoices(api);
  const current = await readUpdateProfile(api);

  // With one profile on offer the card disables Apply, so there is nothing to cancel.
  test.skip(availableProfiles(choices).length < 2, 'fewer than two update profiles are available on this appliance');
  const target = otherAvailableProfile(choices, current);

  await openUpdateProfileCard(page, nameOf(choices, current));
  await chooseUpdateProfile(page, target.name);
  await page.locator(updateLocators.profile.apply).click();

  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.cancel).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeHidden();

  expect(apiCallsTo(page, 'update.update')).toHaveLength(0);
  expect(await readUpdateProfile(api)).toBe(current);
});
