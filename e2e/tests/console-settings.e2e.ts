/**
 * Stories: an admin changes the console settings from the Console card on
 * System > Advanced Settings, and the appliance keeps what they saved.
 *
 * Each save is asserted twice, the way the other Advanced Settings specs do it:
 * the card's readouts say the screen believed it, `system.advanced.config` says
 * the appliance did it.
 *
 * One test starts from the defaults, turns the serial console on at a new speed,
 * hides the text console behind a password and changes the banner. The other
 * starts from all of that and undoes it, emptying the banner, which the card
 * shows as `–`. Between them, both boxes are ticked and unticked.
 *
 * The serial port is not changed: see `fixtures/console.ts`.
 *
 * The settings are one config record, so there is nothing to delete afterwards.
 * Teardown writes middleware's defaults back.
 */
import {
  consoleBaseline, readConsoleSettings, setConsoleSettings, type ConsoleSettings,
} from '../fixtures/console';
import { chooseSerialSpeed, openConsoleForm, saveConsoleForm } from '../flows/console';
import { consoleLocators } from '../locators/console';
import { leavingTestData } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Written before each test as well as after, so an interrupted run leaves the next one able to start. */
test.beforeEach(async ({ api }) => {
  await setConsoleSettings(api, consoleBaseline);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData('the console settings as the test left them')) {
    return;
  }

  await setConsoleSettings(api, consoleBaseline);
});

test('an admin turns on the serial console and changes the banner, and the appliance keeps them', async ({
  page, api,
}) => {
  const motd = 'E2E console banner';

  await openConsoleForm(page, consoleBaseline.motd);
  await page.locator(consoleLocators.form.consoleMenu).click();
  await page.locator(consoleLocators.form.serialConsole).click();
  await chooseSerialSpeed(page, '115200');
  await page.locator(consoleLocators.form.motd).fill(motd);
  await saveConsoleForm(page);

  await expect(page.locator(consoleLocators.card.consoleMenu)).toHaveText('Disabled');
  await expect(page.locator(consoleLocators.card.serialConsole)).toHaveText('Enabled');
  await expect(page.locator(consoleLocators.card.serialPort)).toHaveText('ttyS0');
  await expect(page.locator(consoleLocators.card.serialSpeed)).toHaveText('115200 bps');
  await expect(page.locator(consoleLocators.card.motd)).toHaveText(motd);

  expect(await readConsoleSettings(api)).toEqual({
    consolemenu: false,
    serialconsole: true,
    serialport: 'ttyS0',
    serialspeed: '115200',
    motd,
  });
});

/**
 * Written in a hook, like the second syslog test, so the starting state is in
 * place before `page` signs in and before anything in the app has read it. The
 * file-level `beforeEach` runs first, so this lands on top of it.
 */
test.describe('starting with the serial console on', () => {
  const start: ConsoleSettings = {
    consolemenu: false,
    serialconsole: true,
    serialport: 'ttyS0',
    serialspeed: '38400',
    motd: 'E2E banner to remove',
  };

  test.beforeEach(async ({ api }) => {
    await setConsoleSettings(api, start);
  });

  test('an admin turns off the serial console and empties the banner', async ({ page, api }) => {
    await openConsoleForm(page, start.motd);
    await expect(page.locator(consoleLocators.card.serialConsole)).toHaveText('Enabled');
    await expect(page.locator(consoleLocators.card.serialSpeed)).toHaveText('38400 bps');

    await page.locator(consoleLocators.form.consoleMenu).click();
    await page.locator(consoleLocators.form.serialConsole).click();
    await page.locator(consoleLocators.form.motd).fill('');
    await saveConsoleForm(page);

    await expect(page.locator(consoleLocators.card.consoleMenu)).toHaveText('Enabled');
    await expect(page.locator(consoleLocators.card.serialConsole)).toHaveText('Disabled');
    await expect(page.locator(consoleLocators.card.motd)).toHaveText('–');

    // With the serial console off the form sends no port or speed, so the
    // appliance keeps the ones it had.
    expect(await readConsoleSettings(api)).toEqual({
      consolemenu: true,
      serialconsole: false,
      serialport: start.serialport,
      serialspeed: start.serialspeed,
      motd: '',
    });
  });
});
