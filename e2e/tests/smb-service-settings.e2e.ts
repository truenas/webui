/**
 * Stories: an admin saves the SMB service settings from its row on the Services
 * page under System, and middleware's refusal of SMB1 with required encryption
 * reaches the form.
 *
 * The page has no readout of the settings, so each save is asserted through
 * `smb.config` alone, and as the whole record: the form sends every field back,
 * so one it dropped or mis-mapped fails here even when nobody edited it.
 *
 * The NetBIOS name and workgroup differ per appliance, so there is no fixed
 * baseline as SSH and FTP have. `beforeEach` snapshots the settings, then moves
 * the fields the tests edit to a known start so each edit is a change; teardown
 * writes the snapshot back. The service is stopped throughout, so a save only
 * rewrites configuration. The Apple-extensions write is `smb-service.e2e.ts`'s.
 */
import { readSmbSettings, setSmbSettings, type SmbSettings } from '../fixtures/service-config';
import { ensureSmbServiceStopped } from '../fixtures/smb';
import { openServiceForm, saveServiceForm } from '../flows/services';
import { selectOption } from '../flows/storage';
import { servicesLocators } from '../locators/services';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** The labels `smbMinProtocolLabels` and `smbEncryptionLabels` give the options the tests pick. */
const minimumProtocolLabel = {
  smb1: 'SMB1 – legacy clients (not recommended)',
  smb3: 'SMB3 – modern clients only',
} as const;

const encryptionLabel = {
  desired: 'Desired – encrypt transport if supported by client during session negotiation',
  required: 'Required – always encrypt transport (rejecting access if client does not support encryption – '
    + 'incompatible with minimum protocol set to SMB1)',
} as const;

/** How long middleware may take to answer the refused save. A ceiling, not a wait. */
const refusalTimeoutMs = 60_000;

/**
 * Where each test starts the fields it edits: away from every value a test
 * saves, so a control the form ignored leaves its field here and fails.
 */
const startingValues: Omit<SmbSettings, 'netbiosname' | 'workgroup' | 'aapl_extensions'> = {
  description: '',
  minimum_protocol: 'SMB2',
  ntlmv1_auth: false,
  unixcharset: 'UTF-8',
  encryption: 'DEFAULT',
  debug: false,
  syslog: false,
  multichannel: false,
  filemask: 'DEFAULT',
  dirmask: 'DEFAULT',
};

/**
 * The settings as this spec found them, put back in teardown. Undefined until
 * read, so a `beforeEach` that failed before reading them restores nothing.
 */
let settingsFound: SmbSettings | undefined;

/** What each test starts from: the appliance's own name and workgroup, and the fields above. */
let startingSettings: SmbSettings;

test.beforeEach(async ({ api }) => {
  settingsFound = undefined;
  await ensureSmbServiceStopped(api);

  settingsFound = await readSmbSettings(api);
  startingSettings = { ...settingsFound, ...startingValues };
  await setSmbSettings(api, startingSettings);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData('the SMB service settings the test saved')) {
    return;
  }

  await runCleanupSteps([
    ['restore the SMB settings', async () => {
      if (settingsFound !== undefined) {
        await setSmbSettings(api, settingsFound);
      }
    }],
    ['stop the SMB service', () => ensureSmbServiceStopped(api)],
  ]);
});

test('an admin saves the NetBIOS section, and the appliance keeps it', async ({ page, api }) => {
  const form = servicesLocators.smbForm;

  await openServiceForm(page, 'cifs', form.netbiosName, startingSettings.netbiosname);
  await page.locator(form.netbiosName).fill('E2ESMBNAME');
  await page.locator(form.workgroup).fill('E2EGROUP');
  await page.locator(form.description).fill('e2e smb service');
  await selectOption(page, form.minimumProtocol, form.minimumProtocolOption(minimumProtocolLabel.smb3));
  await page.locator(form.ntlmv1Auth).click();
  await saveServiceForm(page);

  // Upper-cased before comparing, because middleware is free to change a NetBIOS
  // name's case and the claim is only that the name typed is the one kept.
  const saved = await readSmbSettings(api);
  expect({ ...saved, netbiosname: saved.netbiosname.toUpperCase() }).toEqual({
    ...startingSettings,
    netbiosname: 'E2ESMBNAME',
    workgroup: 'E2EGROUP',
    description: 'e2e smb service',
    minimum_protocol: 'SMB3',
    ntlmv1_auth: true,
  });
});

test('an admin saves the advanced options, and the appliance keeps them', async ({ page, api }) => {
  const form = servicesLocators.smbForm;

  await openServiceForm(page, 'cifs', form.netbiosName, startingSettings.netbiosname);
  await page.locator(form.advancedToggle).click();
  await expect(page.locator(form.unixCharset)).toBeVisible();

  await selectOption(page, form.unixCharset, form.unixCharsetOption('ISO8859_1'));
  await selectOption(page, form.encryption, form.encryptionOption(encryptionLabel.desired));
  await page.locator(form.debug).click();
  await page.locator(form.syslog).click();
  await page.locator(form.multichannel).click();
  await page.locator(form.fileMask).fill('0644');
  await page.locator(form.dirMask).fill('0755');
  await saveServiceForm(page);

  expect(await readSmbSettings(api)).toEqual({
    ...startingSettings,
    unixcharset: 'ISO8859_1',
    encryption: 'DESIRED',
    debug: true,
    syslog: true,
    multichannel: true,
    filemask: '0644',
    dirmask: '0755',
  });
});

test('SMB1 with required encryption is refused, and nothing is saved', async ({ page, api }) => {
  const form = servicesLocators.smbForm;

  await openServiceForm(page, 'cifs', form.netbiosName, startingSettings.netbiosname);
  await page.locator(form.advancedToggle).click();
  await expect(page.locator(form.encryption)).toBeVisible();

  await selectOption(page, form.minimumProtocol, form.minimumProtocolOption(minimumProtocolLabel.smb1));
  await selectOption(page, form.encryption, form.encryptionOption(encryptionLabel.required));
  await page.locator(servicesLocators.save).click();

  // Middleware's own sentence, not the word SMB1: the Required option's label
  // mentions SMB1 too, and it is showing in this same field before any refusal.
  await expect(page.locator(form.encryptionField))
    .toContainText('may not be set to REQUIRED while SMB1 support is enabled', { timeout: refusalTimeoutMs });
  // A refusal leaves the panel open; a save would have closed it.
  await expect(page.locator(servicesLocators.save)).toBeVisible();

  const saved = await readSmbSettings(api);
  expect(saved.minimum_protocol).toBe(startingSettings.minimum_protocol);
  expect(saved.encryption).toBe(startingSettings.encryption);
});
