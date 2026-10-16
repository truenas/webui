/**
 * Stories: an admin saves the WebShare service's Passkey mode and AI Assistant
 * (MCP) settings from its row on the Services page under System, and TrueSearch
 * stays locked off on an appliance without TrueNAS Connect.
 *
 * The page has no readout of the settings, so each save is asserted through
 * `webshare.config`, and as the whole set this spec reads: the form sends every
 * field back, so one it dropped or flipped fails here even when nobody edited it.
 *
 * `beforeEach` snapshots the settings, then moves them to a known start so each
 * edit is a change. The Passkey start is `Required`, not the form's own default
 * of `Disabled`, so seeing it in the select proves the form has loaded before a
 * test edits anything. Teardown writes the snapshot back, except TrueSearch,
 * which is never written over the API; a UI save leaves it off wherever it is
 * locked. The service is stopped throughout, so a save only rewrites configuration.
 *
 * The MCP test needs an appliance with no Directory Services login groups, as
 * CI's is. With one, the form offers a group picker and does not prefill.
 */
import { readWebshareSettings, setWebshareSettings, type WebshareSettings } from '../fixtures/service-config';
import { ensureServiceStopped } from '../fixtures/services';
import { openServiceFormShowing, saveServiceForm } from '../flows/services';
import { selectOption } from '../flows/storage';
import { servicesLocators } from '../locators/services';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const webshareLeftRunning = 'WebShare left running. A later save would restart it rather than only '
  + 'rewrite its settings.';

/** The group the form prefills when MCP is turned on and there is nothing else to choose. */
const webshareGroup = 'truenas_webshare';

/**
 * Where each test starts: Passkey away from every mode a test picks first, and
 * MCP off with nothing saved, which is the state turning it on prefills from.
 */
const startingValues: Omit<WebshareSettings, 'search'> = {
  passkey: 'REQUIRED',
  mcp_enabled: false,
  mcp_allowed_groups: [],
  mcp_allow_write: false,
};

/**
 * The settings as this spec found them, put back in teardown. Undefined until
 * read, so a `beforeEach` that failed before reading them restores nothing.
 */
let settingsFound: WebshareSettings | undefined;

/** What each test starts from: TrueSearch as found, and the fields above. */
let startingSettings: WebshareSettings;

test.beforeEach(async ({ api }) => {
  settingsFound = undefined;
  await ensureServiceStopped(api, 'webshare', webshareLeftRunning);

  settingsFound = await readWebshareSettings(api);
  startingSettings = { ...settingsFound, ...startingValues };
  await setWebshareSettings(api, startingSettings);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData('the WebShare settings the test saved')) {
    return;
  }

  await runCleanupSteps([
    ['restore the WebShare settings', async () => {
      if (settingsFound !== undefined) {
        await setWebshareSettings(api, settingsFound);
      }
    }],
    ['stop the WebShare service', () => ensureServiceStopped(api, 'webshare', webshareLeftRunning)],
  ]);
});

test('an admin saves each Passkey mode, and the appliance keeps it', async ({ page, api }) => {
  const form = servicesLocators.webshareForm;

  await openServiceFormShowing(page, 'webshare', form.passkey, 'Required');
  await selectOption(page, form.passkey, form.passkeyOption('Enabled'));
  await saveServiceForm(page);

  expect(await readWebshareSettings(api)).toEqual({ ...startingSettings, passkey: 'ENABLED' });

  await openServiceFormShowing(page, 'webshare', form.passkey, 'Enabled');
  await selectOption(page, form.passkey, form.passkeyOption('Required'));
  await saveServiceForm(page);

  expect(await readWebshareSettings(api)).toEqual({ ...startingSettings, passkey: 'REQUIRED' });
});

test('turning MCP on prefills the WebShare group, and turning it off keeps it', async ({ page, api }) => {
  const form = servicesLocators.webshareForm;

  await openServiceFormShowing(page, 'webshare', form.passkey, 'Required');
  await page.locator(form.mcpEnabled).click();

  // Allow Write renders only once MCP is on, so seeing it enabled is what makes
  // the missing picker below mean "hidden while on" rather than "not on yet".
  await expect(page.locator(form.mcpAllowWrite)).toBeEnabled();
  await expect(page.locator(form.mcpAllowedGroups)).toHaveCount(0);

  await page.locator(form.mcpAllowWrite).click();
  await saveServiceForm(page);

  const enabled = {
    ...startingSettings,
    mcp_enabled: true,
    mcp_allowed_groups: [webshareGroup],
    mcp_allow_write: true,
  };
  expect(await readWebshareSettings(api)).toEqual(enabled);

  await openServiceFormShowing(page, 'webshare', form.passkey, 'Required');
  // The load sets MCP from the appliance, so it has to read as on before the
  // click that turns it off; a click before the load would be overwritten.
  await expect(page.locator(form.mcpEnabled)).toBeChecked();
  await page.locator(form.mcpEnabled).click();
  await saveServiceForm(page);

  // The groups and write access stay in the payload while MCP is off, so a save
  // that does not enable MCP must not wipe them.
  expect(await readWebshareSettings(api)).toEqual({ ...enabled, mcp_enabled: false });
});

test('TrueSearch stays locked off without TrueNAS Connect', async ({ page, api }) => {
  const form = servicesLocators.webshareForm;

  await openServiceFormShowing(page, 'webshare', form.passkey, 'Required');

  await expect(page.locator(form.search)).toBeDisabled();
  // Whichever condition is missing first. The CI appliance has neither, and
  // the license hint wins there; an appliance with the entitlement shows the other.
  await expect(page.locator(form.searchField)).toContainText(
    /TrueSearch is not included in this system's license\.|TrueSearch requires TrueNAS Connect to be configured\./,
  );

  await selectOption(page, form.passkey, form.passkeyOption('Enabled'));
  await saveServiceForm(page);

  // The locked box still reaches the API, as false, so the save has to leave
  // TrueSearch off whatever the appliance held before.
  expect(await readWebshareSettings(api)).toEqual({ ...startingSettings, search: false, passkey: 'ENABLED' });
});
