/**
 * Stories: an admin turns SMB Stateful Failover on and off from the SMB service
 * form, and the form locks it while SMB1 is the minimum protocol or a Legacy
 * share exists — the two conditions middleware refuses it under.
 *
 * Only an HA-licensed system shows the setting at all, so this runs in the HA
 * suite, after the rest of its chain (`playwright.config.ts`) has left the pair
 * licensed and healthy, with `tank` imported on whichever controller holds the
 * VIP. Unlike the links before it, it changes nothing for good: `beforeEach`
 * moves the two fields it touches to a known start and teardown puts back what
 * it found, with the service stopped throughout so a save only rewrites
 * configuration.
 *
 * The EULA's acceptance is kept per controller, and `ha-license` accepted it on
 * controller 1 only. After `ha-failover`, controller 2 holds the VIP, so the app
 * raises the EULA over the first page here. Whichever test opens the form first
 * agrees to it, as an admin signing in there would; that is the one thing this
 * spec does not undo.
 */
import type { Page } from '@playwright/test';
import { expectsEula, isHaLicensed, requireHa } from '../fixtures/ha';
import { readSmbSettings } from '../fixtures/service-config';
import {
  ensureLegacySmbSharePresent, ensureSmbServiceStopped, ensureSmbShareAbsent, readSmbFailoverSettings,
  setSmbFailoverSettings, type SmbFailoverSettings,
} from '../fixtures/smb';
import { datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { acceptEula } from '../flows/ha';
import { openServiceForm, saveServiceForm } from '../flows/services';
import { selectOption } from '../flows/storage';
import { servicesLocators } from '../locators/services';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** The labels `smbMinProtocolLabels` gives the options the tests pick. */
const minimumProtocolLabel = {
  smb1: 'SMB1 – legacy clients (not recommended)',
  smb2: 'SMB2 – default',
} as const;

/** Where each test starts: off, and on a protocol that allows it on. */
const startingSettings: SmbFailoverSettings = { stateful_failover: false, minimum_protocol: 'SMB2' };

/** The Legacy share that rules Stateful Failover out, and the dataset under it. */
const legacyShare = 'e2e_ha_legacy_share';
const legacyDataset = 'e2e_ha_legacy_ds';

/** The settings as this spec found them. Undefined until read, so teardown restores only what it read. */
let settingsFound: SmbFailoverSettings | undefined;

test.beforeEach(async ({ api, config, pool }) => {
  requireHa(config);
  if (!await isHaLicensed(api)) {
    throw new Error('SMB Stateful Failover needs an HA-licensed system, and failover.licensed is false');
  }

  settingsFound = undefined;
  await ensureSmbServiceStopped(api);
  // Before the settings: middleware refuses Stateful Failover while a Legacy share exists.
  await ensureSmbShareAbsent(api, legacyShare);
  await ensureDatasetAbsent(api, `${pool}/${legacyDataset}`);

  settingsFound = await readSmbFailoverSettings(api);
  await setSmbFailoverSettings(api, startingSettings);
});

test.afterEach(async ({ api, pool }) => {
  if (leavingTestData(`the SMB Stateful Failover settings, share "${legacyShare}" and its dataset`)) {
    return;
  }

  await runCleanupSteps([
    [`remove share ${legacyShare}`, () => ensureSmbShareAbsent(api, legacyShare)],
    [`remove dataset ${legacyDataset}`, () => ensureDatasetAbsent(api, `${pool}/${legacyDataset}`)],
    ['restore the SMB Stateful Failover settings', async () => {
      if (settingsFound !== undefined) {
        await setSmbFailoverSettings(api, settingsFound);
      }
    }],
    ['stop the SMB service', () => ensureSmbServiceStopped(api)],
  ]);
});

/**
 * Opens the SMB service form with its advanced options showing, agreeing first
 * to the EULA when the app is going to put it in the way.
 */
async function openSmbAdvancedOptions(page: Page, api: E2eApiClient, netbiosName: string): Promise<void> {
  const form = servicesLocators.smbForm;

  if (await expectsEula(api)) {
    await acceptEula(page);
  }
  await openServiceForm(page, 'cifs', form.netbiosName, netbiosName);
  await page.locator(form.advancedToggle).click();
  await expect(page.locator(form.statefulFailover)).toBeVisible();
}

test('an admin turns Stateful Failover on, then off again, and the appliance keeps each', async ({ page, api }) => {
  const form = servicesLocators.smbForm;
  const { netbiosname } = await readSmbSettings(api);

  await openSmbAdvancedOptions(page, api, netbiosname);
  await expect(page.locator(form.statefulFailover)).toBeEnabled();
  await page.locator(form.statefulFailover).click();
  await saveServiceForm(page);

  expect(await readSmbFailoverSettings(api)).toEqual({ ...startingSettings, stateful_failover: true });

  await openSmbAdvancedOptions(page, api, netbiosname);
  await expect(page.locator(form.statefulFailover)).toBeChecked();
  await page.locator(form.statefulFailover).click();
  await saveServiceForm(page);

  expect(await readSmbFailoverSettings(api)).toEqual(startingSettings);
});

test('Stateful Failover is locked while SMB1 is the minimum protocol', async ({ page, api }) => {
  const form = servicesLocators.smbForm;

  await openSmbAdvancedOptions(page, api, (await readSmbSettings(api)).netbiosname);
  await expect(page.locator(form.statefulFailover)).toBeEnabled();

  // Locked by SMB1 and by nothing else: picking SMB2 again frees it.
  await selectOption(page, form.minimumProtocol, form.minimumProtocolOption(minimumProtocolLabel.smb1));
  await expect(page.locator(form.statefulFailover)).toBeDisabled();
  await selectOption(page, form.minimumProtocol, form.minimumProtocolOption(minimumProtocolLabel.smb2));
  await expect(page.locator(form.statefulFailover)).toBeEnabled();

  // A backstop: nothing was saved, so this fails only if opening the form wrote something.
  expect(await readSmbFailoverSettings(api)).toEqual(startingSettings);
});

test('Stateful Failover is locked while a Legacy share exists', async ({ page, api, pool }) => {
  const form = servicesLocators.smbForm;
  const dataset = `${pool}/${legacyDataset}`;

  // Over the API: the share is a precondition, not what the test is about. The
  // first test shows the same form with the box free when there is none.
  await ensureDatasetPresent(api, dataset);
  await ensureLegacySmbSharePresent(api, { name: legacyShare, path: datasetMountPath(dataset) });

  await openSmbAdvancedOptions(page, api, (await readSmbSettings(api)).netbiosname);
  await expect(page.locator(form.statefulFailover)).toBeDisabled();

  // A backstop, as above.
  expect(await readSmbFailoverSettings(api)).toEqual(startingSettings);
});
