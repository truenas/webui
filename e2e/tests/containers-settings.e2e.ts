/**
 * Stories: an admin sets and unsets the preferred pool for containers, moves the
 * automatic bridge to another IPv4 network, and is refused a network too small to
 * use. The Create New Container form asks for a pool only while none is preferred.
 *
 * Every setting lives in `lxc.config`, so each save is asserted twice: once by
 * reopening the form, and once through the API. No container is created, so no
 * image and no internet are needed.
 *
 * ## Setup and teardown
 *
 * Each test starts from middleware's defaults with no preferred pool, and
 * teardown writes back what the appliance held before the first test. The
 * preferred pool is the worker's `pool`, and teardown clears it before the
 * worker exports that pool.
 */
import {
  type ContainerSettings, containerSettingsBaseline, countContainers, readContainerConfig, setContainerConfig,
} from '../fixtures/containers';
import {
  closeContainerPanel, containerSettingsSaveTimeoutMs, openContainerSettings, openCreateContainerForm,
  saveContainerSettings,
} from '../flows/containers';
import { containersLocators } from '../locators/containers';
import { leavingTestData } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** The baseline's IPv4 address, which the settings form shows once it has loaded. */
const baselineV4Address = '172.200.0.0';

/** `do_update`'s refusal for a network with fewer than four addresses, verbatim. */
const tooFewAddressesMessage = 'The network must have at least 4 addresses';

/** What the appliance held before this file ran, and therefore what `afterEach` writes back. */
let found: ContainerSettings | undefined;

test.beforeAll(async ({ api }) => {
  found = await readContainerConfig(api);
});

test.beforeEach(async ({ api }) => {
  await setContainerConfig(api, containerSettingsBaseline);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData('the containers settings the test saved')) {
    return;
  }

  // Guarded: if `beforeAll` threw, there is nothing known to write back.
  if (found !== undefined) {
    await setContainerConfig(api, found);
  }
});

test('an admin sets the preferred pool and the IPv4 network, and both are kept', async ({ page, api, pool }) => {
  const form = containersLocators.settings;

  await openContainerSettings(page, baselineV4Address);
  await page.locator(form.preferredPool).click();
  await page.locator(form.preferredPoolOption(pool)).click();
  await page.locator(form.v4Address).fill('172.201.0.0');
  await page.locator(form.v4Prefix).click();
  // Not the baseline's /24, so reading the prefix back below shows it was saved.
  await page.locator(form.v4PrefixOption(25)).click();
  await saveContainerSettings(page);

  expect(await readContainerConfig(api)).toEqual({
    ...containerSettingsBaseline,
    preferred_pool: pool,
    v4_network: '172.201.0.0/25',
  });

  await openContainerSettings(page, '172.201.0.0');
  await expect(page.locator(form.preferredPool)).toHaveText(pool);
  await expect(page.locator(form.v4Prefix)).toHaveText('25');
});

test('the Create form asks for a pool only while no preferred pool is set', async ({ page, api, pool }) => {
  const containersBefore = await countContainers(api);

  await setContainerConfig(api, { ...containerSettingsBaseline, preferred_pool: pool });
  // The form renders Pool until its own read of `lxc.config` lands, so a count
  // of zero is that read having said a pool is preferred.
  await openCreateContainerForm(page);
  await expect(page.locator(containersLocators.create.pool)).toHaveCount(0);
  await closeContainerPanel(page);

  await setContainerConfig(api, containerSettingsBaseline);
  await openCreateContainerForm(page);
  await expect(page.locator(containersLocators.create.pool)).toBeVisible();
  await closeContainerPanel(page);

  expect(await countContainers(api)).toBe(containersBefore);
});

test('an admin clears the preferred pool', async ({ page, api, pool }) => {
  const form = containersLocators.settings;

  await setContainerConfig(api, { ...containerSettingsBaseline, preferred_pool: pool });

  await openContainerSettings(page, baselineV4Address);
  await expect(page.locator(form.preferredPool)).toHaveText(pool);
  await page.locator(form.preferredPool).click();
  await page.locator(form.preferredPoolEmpty).click();
  await saveContainerSettings(page);

  expect((await readContainerConfig(api)).preferred_pool).toBeNull();
});

test('the settings form will not save without a network', async ({ page, api }) => {
  const form = containersLocators.settings;

  await openContainerSettings(page, baselineV4Address);
  await page.locator(form.v4Address).fill('');
  // The IPv6 network alone is enough, so Save is still there to take.
  await expect(page.locator(containersLocators.save)).toBeEnabled();

  await page.locator(form.v6Address).fill('');
  await expect(page.locator(containersLocators.save)).toBeDisabled();
  expect(await readContainerConfig(api)).toEqual(containerSettingsBaseline);
});

test('middleware refuses an IPv4 network with fewer than four addresses', async ({ page, api }) => {
  const form = containersLocators.settings;

  await openContainerSettings(page, baselineV4Address);
  // Not shown for the stored network, so a message afterwards is this refusal.
  await expect(page.locator(form.v4Field)).not.toContainText(tooFewAddressesMessage);

  await page.locator(form.v4Address).fill('172.201.0.0');
  await page.locator(form.v4Prefix).click();
  await page.locator(form.v4PrefixOption(31)).click();
  await page.locator(containersLocators.save).click();

  await expect(page.locator(form.v4Field)).toContainText(tooFewAddressesMessage, {
    timeout: containerSettingsSaveTimeoutMs,
  });
  await expect(page.locator(containersLocators.save)).toBeVisible();
  expect((await readContainerConfig(api)).v4_network).toBe(containerSettingsBaseline.v4_network);
});
