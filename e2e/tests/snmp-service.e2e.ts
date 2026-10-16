/**
 * Stories: an admin opens the SNMP form from its row on System > Services,
 * saves the general settings and the SNMP v3 credentials, and the form will
 * not take a v3 password shorter than eight characters.
 *
 * The page has no readout of a service's settings, so each save is asserted
 * through `snmp.config` alone, as the whole record less its two secrets, so a
 * save that changed a field it was not asked to touch fails too.
 *
 * SNMP goes back to stopped, and its settings to the baseline, before and after
 * every test. See `fixtures/service-config.ts`.
 */
import {
  readSnmpSettings, setSnmpSettings, snmpBaseline, type SnmpReadback,
} from '../fixtures/service-config';
import { ensureServiceStopped } from '../fixtures/services';
import { openServiceForm, saveServiceForm } from '../flows/services';
import { selectOption } from '../flows/storage';
import { servicesLocators } from '../locators/services';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const snmpLeftRunning = 'SNMP left running. A later save would restart it, and the appliance would answer queries.';

/** What `snmp.config` holds once {@link snmpBaseline} is written. */
const baselineReadback: SnmpReadback = {
  location: '',
  contact: '',
  community: 'public',
  options: '',
  zilstat: false,
  v3: false,
  v3_username: '',
  v3_authtype: '',
  v3_privproto: null,
};

/** The Password field's `Validators.minLength(8)` message, from `tn-form-field-errors.provider.ts`. */
const shortPasswordMessage = 'The length of the field should be at least 8';

test.beforeEach(async ({ api }) => {
  await ensureServiceStopped(api, 'snmp', snmpLeftRunning);
  await setSnmpSettings(api, snmpBaseline);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData('SNMP as the test left it, and the SNMP settings it saved')) {
    return;
  }

  await runCleanupSteps([
    ['stop the SNMP service', () => ensureServiceStopped(api, 'snmp', snmpLeftRunning)],
    ['restore the SNMP settings', () => setSnmpSettings(api, snmpBaseline)],
  ]);
});

test('an admin saves the SNMP general settings, and the appliance keeps them', async ({ page, api }) => {
  const form = servicesLocators.snmpForm;

  await openServiceForm(page, 'snmp', form.community, snmpBaseline.community);
  await page.locator(form.location).fill('e2e rack 1');
  await page.locator(form.contact).fill('e2e@example.com');
  await page.locator(form.community).fill('e2epublic');
  await page.locator(form.options).fill('maxGetbulkRepeats 10');
  await page.locator(form.zilstat).click();
  await saveServiceForm(page);

  // v3 was never ticked, so every v3 field is still the baseline's blank.
  expect(await readSnmpSettings(api)).toEqual({
    ...baselineReadback,
    location: 'e2e rack 1',
    contact: 'e2e@example.com',
    community: 'e2epublic',
    options: 'maxGetbulkRepeats 10',
    zilstat: true,
  });
});

test('an admin saves SNMP v3 credentials, and the appliance keeps them', async ({ page, api }) => {
  const form = servicesLocators.snmpForm;

  await openServiceForm(page, 'snmp', form.community, snmpBaseline.community);
  // The v3 fields are not rendered until the box is ticked.
  await expect(page.locator(form.v3Username)).toBeHidden();
  await page.locator(form.v3).click();
  await expect(page.locator(form.v3Username)).toBeVisible();

  await page.locator(form.v3Username).fill('e2esnmp');
  await selectOption(page, form.v3AuthType, form.v3AuthTypeSha);
  await page.locator(form.v3Password).fill('e2e-snmp-pass');
  await selectOption(page, form.v3PrivProto, form.v3PrivProtoAes);
  await page.locator(form.v3PrivPassphrase).fill('e2e-snmp-priv');
  await saveServiceForm(page);

  // The password and passphrase are secrets and may come back redacted, so
  // they are not read back. The general settings were not touched.
  expect(await readSnmpSettings(api)).toEqual({
    ...baselineReadback,
    v3: true,
    v3_username: 'e2esnmp',
    v3_authtype: 'SHA',
    v3_privproto: 'AES',
  });
});

test('the SNMP form refuses a v3 password shorter than eight characters', async ({ page, api }) => {
  const form = servicesLocators.snmpForm;

  await openServiceForm(page, 'snmp', form.community, snmpBaseline.community);
  await page.locator(form.v3).click();
  await page.locator(form.v3Username).fill('e2esnmp');
  await selectOption(page, form.v3AuthType, form.v3AuthTypeSha);

  // Not shown before the field is typed into, so a message afterwards is this refusal.
  await expect(page.locator(form.v3PasswordField)).not.toContainText(shortPasswordMessage);

  await page.locator(form.v3Password).fill('short');
  await page.locator(form.v3Password).blur();
  await expect(page.locator(form.v3PasswordField)).toContainText(shortPasswordMessage);
  await expect(page.locator(servicesLocators.save)).toBeDisabled();

  // And withdrawn at eight characters, so it is the length being refused and
  // not a message the field always shows once v3 is on.
  await page.locator(form.v3Password).fill('e2e-snmp-pass');
  await expect(page.locator(form.v3PasswordField)).not.toContainText(shortPasswordMessage);

  // Nothing was saved: v3 is still off on the appliance.
  expect(await readSnmpSettings(api)).toEqual(baselineReadback);
});
