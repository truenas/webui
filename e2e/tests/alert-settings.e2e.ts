/**
 * Stories: an admin changes an alert class's level, and its frequency, from the
 * Category card on System > Alert Settings, and the appliance keeps what they saved.
 *
 * Each save is asserted twice: `alertclasses.config` says the appliance did it,
 * and the card, opened afresh from the sidebar, says the screen shows what is
 * stored rather than what was last clicked.
 *
 * The card sends every override it holds on each save, and middleware replaces
 * the whole set with what it receives. So each test runs beside a second class
 * in the same category, carrying an override of its own, which must come
 * through the save untouched — a card that sent only the row that changed would
 * wipe it and still show the change.
 *
 * The classes are middleware's, picked when the file starts: see
 * `fixtures/alert-classes.ts`. The settings are one config record, so there is
 * nothing to delete afterwards. Teardown writes back every override the
 * appliance held before the first test.
 */
import {
  type AlertClassOverrides, type AlertClassPick, pickAlertClasses, readAlertClassOverride,
  readAlertClassOverrides, setAlertClassOverrides, withoutOverrides,
} from '../fixtures/alert-classes';
import {
  chooseAlertClassLevel, chooseAlertClassPolicy, openAlertClass, saveAlertClasses,
} from '../flows/alert-classes';
import { goToNetwork } from '../flows/navigation';
import { alertClassLocators } from '../locators/alert-classes';
import { leavingTestData } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** What the appliance held before this file ran, and therefore what `afterEach` writes back. */
let found: AlertClassOverrides | undefined;

let target: AlertClassPick;
let bystander: AlertClassPick;

/** Not the default for any class, so the form will send it. */
const bystanderOverride = { policy: 'DAILY' } as const;

test.beforeAll(async ({ api }) => {
  found = await readAlertClassOverrides(api);
  ({ target, bystander } = await pickAlertClasses(api));
});

/** The target at its defaults, the bystander with its override, everything else as found. */
test.beforeEach(async ({ api }) => {
  await setAlertClassOverrides(api, {
    ...withoutOverrides(found ?? {}, [target.id, bystander.id]),
    [bystander.id]: bystanderOverride,
  });
});

test.afterEach(async ({ api }) => {
  if (leavingTestData('the alert class settings as the test left them')) {
    return;
  }

  // Guarded: if `beforeAll` threw, there is nothing known to write back.
  if (found !== undefined) {
    await setAlertClassOverrides(api, found);
  }
});

test('an admin changes an alert class\'s level, and the appliance keeps it', async ({ page, api }) => {
  // Any level but the class's default, which the form would not send.
  const level = target.defaultLevel === 'CRITICAL' ? 'ERROR' : 'CRITICAL';

  await openAlertClass(page, target);
  await expect(page.locator(alertClassLocators.level(target.title))).toContainText(target.defaultLevel);
  await chooseAlertClassLevel(page, target.title, level);
  await saveAlertClasses(page);

  await expect.poll(async () => (await readAlertClassOverride(api, target.id))?.level).toBe(level);
  expect(await readAlertClassOverride(api, bystander.id)).toMatchObject(bystanderOverride);

  // Away and back, so the card reloads from the appliance rather than keeping the click.
  await goToNetwork(page);
  await openAlertClass(page, target);
  await expect(page.locator(alertClassLocators.level(target.title))).toContainText(level);
});

test('an admin changes an alert class\'s frequency, and the appliance keeps it', async ({ page, api }) => {
  await openAlertClass(page, target);
  await expect(page.locator(alertClassLocators.policy(target.title))).toContainText('IMMEDIATELY');
  await chooseAlertClassPolicy(page, target.title, 'HOURLY');
  await saveAlertClasses(page);

  await expect.poll(async () => (await readAlertClassOverride(api, target.id))?.policy).toBe('HOURLY');
  expect(await readAlertClassOverride(api, bystander.id)).toMatchObject(bystanderOverride);

  await goToNetwork(page);
  await openAlertClass(page, target);
  await expect(page.locator(alertClassLocators.policy(target.title))).toContainText('HOURLY');
});
