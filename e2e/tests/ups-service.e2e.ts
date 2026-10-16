/**
 * Stories: an admin opens the UPS form from its row on System > Services, saves
 * a Slave configuration and a Master configuration with a driver, and the form
 * will not take an identifier with a space in it.
 *
 * The form swaps fields by mode: Master shows Driver, Slave shows Remote Host and
 * Remote Port. Each save switches mode, so the fields of the mode it leaves are
 * on screen and filled when the test starts. The page has no readout of the UPS
 * settings, so each save is asserted through `ups.config` alone, as the whole
 * record less the monitor password.
 *
 * Nothing starts the UPS service. With no UPS attached it would fail and raise
 * an alert. It is stopped, and its settings put back to the baseline, before and
 * after every test. See `fixtures/service-config.ts` for why the baseline is
 * Slave mode and not the stock configuration.
 */
import {
  findUpsDriverKey, pickUpsSerialPort, readUpsSettings, setUpsSettings, upsBaseline, type UpsReadback,
} from '../fixtures/service-config';
import { ensureServiceStopped } from '../fixtures/services';
import { openServiceForm, saveServiceForm } from '../flows/services';
import { selectOption } from '../flows/storage';
import { servicesLocators } from '../locators/services';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const upsLeftRunning = 'UPS left running. With no UPS attached it fails, and raises an alert every later run sees.';

/** What `ups.config` holds once {@link upsBaseline} is written. */
const baselineReadback: UpsReadback = {
  identifier: 'ups',
  mode: 'SLAVE',
  remotehost: '192.0.2.1',
  remoteport: 3493,
  driver: '',
  port: '',
  monuser: 'upsmon',
  shutdown: 'LOWBATT',
  shutdowntimer: 30,
  complete_identifier: 'ups@192.0.2.1:3493',
};

/** The Identifier field's `Validators.pattern` message, from `tn-form-field-errors.provider.ts`. */
const invalidIdentifierMessage = 'Invalid format or character';

test.beforeEach(async ({ api }) => {
  await ensureServiceStopped(api, 'ups', upsLeftRunning);
  await setUpsSettings(api, upsBaseline);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData('UPS as the test left it, and the UPS settings it saved')) {
    return;
  }

  await runCleanupSteps([
    ['stop the UPS service', () => ensureServiceStopped(api, 'ups', upsLeftRunning)],
    ['restore the UPS settings', () => setUpsSettings(api, upsBaseline)],
  ]);
});

test('an admin saves a Slave UPS configuration, and the appliance keeps it', async ({ page, api }) => {
  const form = servicesLocators.upsForm;
  // Starts in Master mode with a driver, so the save has to leave it.
  const driver = await findUpsDriverKey(api, 'usbhid-ups');
  await setUpsSettings(api, {
    ...upsBaseline,
    mode: 'MASTER',
    driver,
    port: 'auto',
  });

  await openServiceForm(page, 'ups', form.identifier, upsBaseline.identifier);
  await expect(page.locator(form.remoteHost)).toBeHidden();
  await page.locator(form.identifier).fill('e2eups');
  await selectOption(page, form.mode, form.modeSlave);
  await expect(page.locator(form.driver)).toBeHidden();

  await page.locator(form.remoteHost).fill('192.0.2.10');
  await page.locator(form.remotePort).fill('3494');
  await page.locator(form.monitorUser).fill('e2emon');
  await page.locator(form.monitorPassword).fill('e2emonpass');
  await selectOption(page, form.shutdownMode, form.shutdownOnBattery);
  await page.locator(form.shutdownTimer).fill('60');
  await saveServiceForm(page);

  // The driver is the one set up above. A Slave save leaves it out, and this
  // readback cannot tell that apart from a save that sent it again.
  expect(await readUpsSettings(api)).toEqual({
    identifier: 'e2eups',
    mode: 'SLAVE',
    remotehost: '192.0.2.10',
    remoteport: 3494,
    driver,
    port: 'auto',
    monuser: 'e2emon',
    shutdown: 'BATT',
    shutdowntimer: 60,
    complete_identifier: 'e2eups@192.0.2.10:3494',
  });
});

test('an admin saves a Master UPS configuration with a driver, and the appliance keeps it', async ({ page, api }) => {
  const form = servicesLocators.upsForm;
  const port = await pickUpsSerialPort(api);

  await openServiceForm(page, 'ups', form.identifier, upsBaseline.identifier);
  await expect(page.locator(form.driver)).toBeHidden();
  await selectOption(page, form.mode, form.modeMaster);
  await expect(page.locator(form.remoteHost)).toBeHidden();

  await page.locator(form.driver).fill('usbhid-ups');
  await page.locator(form.driverOptions).first().click();
  await page.locator(form.port).fill(port);
  await page.locator(form.port).blur();
  await saveServiceForm(page);

  // The remote host and port are left out of a Master save, so they keep the
  // baseline's, and the identifier now names this machine.
  expect(await readUpsSettings(api)).toEqual({
    ...baselineReadback,
    mode: 'MASTER',
    // A driver key is `<driver>[ <options>]$<model>`, and the first row is whichever model sorts first.
    driver: expect.stringMatching(/^usbhid-ups[ $]/),
    port,
    complete_identifier: 'ups@localhost:3493',
  });
});

test('the UPS form refuses an identifier with a space in it', async ({ page, api }) => {
  const form = servicesLocators.upsForm;

  await openServiceForm(page, 'ups', form.identifier, upsBaseline.identifier);
  // The baseline is a complete Slave configuration, so Save starts enabled and
  // the refusal below is what disables it.
  await expect(page.locator(servicesLocators.save)).toBeEnabled();
  await expect(page.locator(form.identifierField)).not.toContainText(invalidIdentifierMessage);

  await page.locator(form.identifier).fill('e2e ups');
  await page.locator(form.identifier).blur();
  await expect(page.locator(form.identifierField)).toContainText(invalidIdentifierMessage);
  await expect(page.locator(servicesLocators.save)).toBeDisabled();

  // Nothing was saved.
  expect(await readUpsSettings(api)).toEqual(baselineReadback);
});
