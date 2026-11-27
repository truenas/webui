/**
 * Stories: on the Allowed IP Addresses card of System > Advanced Settings, an admin adds an address and a subnet
 * through Configure, deletes one from the card, and is refused a malformed address; checked on the card and in
 * `system.general.config` `ui_allowlist`. A non-empty allowlist refuses every client it does not name, so every
 * list seeded or saved here starts with the runner's own address, and the restart prompt is always declined.
 * `ui_allowlist` is written back to what it held before the file ran, before and after every test.
 */
import {
  readAllowlist, readRunnerAddress, writeAllowlist,
} from '../fixtures/allowed-addresses';
import {
  addAllowedAddress,
  deleteAllowedAddress,
  discardAllowedAddressesForm,
  openAllowedAddressesForm,
  saveAllowedAddressesForm,
} from '../flows/allowed-addresses';
import { allowedAddressesLocators } from '../locators/allowed-addresses';
import type { E2eApiClient } from '../support/api/client';
import { apiCallsTo } from '../support/api-calls';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

test.use({ recordApiCalls: true });

const { card, form } = allowedAddressesLocators;

/** Documentation ranges (RFC 5737), so no real client is admitted by them. */
const address = '192.0.2.10';
const subnet = '198.51.100.0/24';

/** What the `ip2` validator says. From `tn-form-field-errors.provider.ts`. */
const invalidAddressMessage = 'Invalid IP address';

/** What the appliance held before this file ran, and therefore what teardown writes back. */
let found: string[] | undefined;

/** Read once, and the head of every allowlist a test seeds or saves. */
let runner = '';

async function restoreAllowlist(api: E2eApiClient): Promise<void> {
  await runCleanupSteps([
    ['write back the allowlist', async () => {
      // Guarded: if `beforeAll` threw, there is nothing known to write back.
      if (found !== undefined) {
        await writeAllowlist(api, found);
      }
    }],
  ]);
}

test.beforeAll(async ({ api }) => {
  found = await readAllowlist(api);
  runner = await readRunnerAddress(api);
});

test.beforeEach(async ({ api }) => {
  await restoreAllowlist(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData('the allowlist as the test left it')) {
    return;
  }

  await restoreAllowlist(api);
});

test('an admin adds an address and a subnet through Configure, and the appliance stores both', async ({
  page, api,
}) => {
  // Seeded with the runner alone, so the list saved below can only lose it to the form.
  await writeAllowlist(api, [runner]);

  await openAllowedAddressesForm(page, [runner]);
  await addAllowedAddress(page, 1, address);
  await addAllowedAddress(page, 2, subnet);
  await saveAllowedAddressesForm(page);

  await expect(page.locator(card.address(address))).toHaveText(address);
  await expect(page.locator(card.address(subnet))).toHaveText(subnet);
  await expect(page.locator(card.row(runner))).toBeVisible();

  expect(await readAllowlist(api)).toEqual([runner, address, subnet]);
  expect(apiCallsTo(page, 'system.general.ui_restart')).toHaveLength(0);
});

test('deleting an address from the card removes that address and keeps the rest', async ({ page, api }) => {
  await writeAllowlist(api, [runner, address, subnet]);

  await deleteAllowedAddress(page, address);

  await expect(page.locator(card.row(subnet))).toBeVisible();
  await expect(page.locator(card.row(runner))).toBeVisible();
  expect(await readAllowlist(api)).toEqual([runner, subnet]);
  expect(apiCallsTo(page, 'system.general.ui_restart')).toHaveLength(0);
});

test('the form refuses a malformed address, and nothing is sent', async ({ page, api }) => {
  await writeAllowlist(api, [runner]);

  await openAllowedAddressesForm(page, [runner]);
  await page.locator(form.add).click();
  // Not shown for an untouched field, so a message afterwards is the refusal.
  await expect(page.locator(form.addressField(1))).not.toContainText(invalidAddressMessage);

  await page.locator(form.address(1)).fill('192.0.2.300');
  await page.locator(form.address(1)).blur();
  await expect(page.locator(form.addressField(1))).toContainText(invalidAddressMessage);
  await expect(page.locator(form.save)).toBeDisabled();

  // A submit attempt, so the checks below mean something: the form's own refusal
  // is what keeps the value from reaching middleware.
  await page.locator(form.address(1)).press('Enter');
  await discardAllowedAddressesForm(page);

  expect(apiCallsTo(page, 'system.general.update')).toHaveLength(0);
  expect(apiCallsTo(page, 'system.general.ui_restart')).toHaveLength(0);
  expect(await readAllowlist(api)).toEqual([runner]);
});
