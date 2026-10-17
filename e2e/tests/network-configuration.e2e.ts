/**
 * Stories: an admin changes the appliance's hostname, domain, search domains, host
 * entries and service announcements from the Network Configuration card on
 * System > Network, and middleware refuses a nameserver or a default gateway that
 * would leave the appliance unable to resolve or route.
 *
 * Every save is asserted on the card and through `network.configuration.config`.
 * The refusals are checked where the form shows them, and by the config being
 * unchanged afterwards.
 *
 * ## What is left alone
 *
 * The CI appliance is reached through qemu's user-mode NAT on DHCP, so a real
 * change to its nameservers, gateway or interface cuts the suite off. No test
 * saves one on purpose. The refused values are refused before middleware writes
 * anything, and every address used is reserved for documentation (RFC 5737).
 *
 * ## Setup and teardown
 *
 * `beforeAll` reads the config, and `afterEach` writes it back if anything
 * differs, pass or fail. The form's own save stores the DHCP nameserver and
 * gateway as static values (see `fixtures/network-config.ts`), so the restore
 * runs after every successful save, not only after a failure.
 */
import { type NetworkSettings, readNetworkConfig, restoreNetworkConfig } from '../fixtures/network-config';
import {
  addChips, discardNetworkSettings, networkSaveTimeoutMs, openNetworkSettings, saveNetworkSettings,
} from '../flows/network-config';
import { errorDialogLocators } from '../locators/dialogs';
import { networkConfigLocators } from '../locators/network';
import { leavingTestData } from '../support/cleanup';
import { errorDialogClose } from '../support/constants';
import { expect, test } from '../support/fixtures';

const hostname = 'e2e-net-host';
const domain = 'e2e.example';
const searchDomains = ['alpha.e2e.example', 'beta.e2e.example'];
const hostEntry = '192.0.2.10 e2e-doc-host';

/** TEST-NET-1: on no network the appliance is attached to, so never reachable. */
const unreachableGateway = '192.0.2.1';

/** What the appliance held before this file ran, and therefore what `afterEach` writes back. */
let found: NetworkSettings | undefined;

/** `found`, for a test that cannot run without it. */
function baseline(): NetworkSettings {
  if (found === undefined) {
    throw new Error('beforeAll did not read network.configuration.config');
  }
  return found;
}

/** The card's Service Announcement line for these flags, in the order the card lists them. */
function announcementText({ netbios, mdns, wsd }: NetworkSettings['service_announcement']): string {
  return [
    netbios ? 'NETBIOS-NS' : undefined,
    mdns ? 'mDNS' : undefined,
    wsd ? 'WS-DISCOVERY' : undefined,
  ].filter(Boolean).join(', ');
}

test.beforeAll(async ({ api }) => {
  found = await readNetworkConfig(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData('the network configuration the test saved')) {
    return;
  }

  // Guarded: if `beforeAll` threw, there is nothing known to write back.
  if (found !== undefined) {
    await restoreNetworkConfig(api, found);
  }
});

test('an admin edits the hostname, domains, hosts and announcements, and they are kept', async ({ page, api }) => {
  const start = baseline();
  const form = networkConfigLocators.form;
  const card = networkConfigLocators.card;
  // Each flag the other way round from the start, so every one of them has to be saved to read back.
  const announcements = {
    netbios: !start.service_announcement.netbios,
    mdns: !start.service_announcement.mdns,
    wsd: !start.service_announcement.wsd,
  };
  // The chips are added after whatever the appliance already lists.
  const expectedDomains = [...start.domains, ...searchDomains];
  const expectedHosts = [...start.hosts, hostEntry];

  await openNetworkSettings(page, start.hostname);
  await page.locator(form.hostname).fill(hostname);
  // Domain is disabled while it is inherited from DHCP.
  await page.locator(form.inheritDhcp).setChecked(false);
  await page.locator(form.domain).fill(domain);
  await addChips(page, form.domains, searchDomains);
  await addChips(page, form.hosts, [hostEntry]);
  await page.locator(form.netbios).setChecked(announcements.netbios);
  await page.locator(form.mdns).setChecked(announcements.mdns);
  await page.locator(form.wsd).setChecked(announcements.wsd);
  await saveNetworkSettings(page);

  await expect(page.locator(card.hostname)).toHaveText(hostname);
  await expect(page.locator(card.domain)).toHaveText(domain);
  await expect(page.locator(card.additionalDomains)).toHaveText(expectedDomains.join(', '));
  await expect(page.locator(card.hostnameDatabase)).toHaveText(expectedHosts.join(', '));
  await expect(page.locator(card.serviceAnnouncement)).toHaveText(announcementText(announcements));

  expect(await readNetworkConfig(api)).toMatchObject({
    hostname,
    domain,
    domains: expectedDomains,
    hosts: expectedHosts,
    service_announcement: announcements,
  });
});

test('a loopback nameserver is refused, and nothing is saved', async ({ page, api }) => {
  const start = baseline();
  const form = networkConfigLocators.form;

  await openNetworkSettings(page, start.hostname);
  await page.locator(form.nameserver1).fill('127.0.0.1');
  await page.locator(networkConfigLocators.save).click();

  await expect(page.locator(form.nameserver1Field)).toContainText('Loopback is not a valid nameserver', {
    timeout: networkSaveTimeoutMs,
  });
  // A refusal leaves the panel open; a save would have closed it.
  await expect(page.locator(networkConfigLocators.save)).toBeVisible();
  await discardNetworkSettings(page);

  expect((await readNetworkConfig(api)).nameserver1).toBe(start.nameserver1);
});

test('an unreachable IPv4 gateway is refused, and nothing is saved', async ({ page, api }) => {
  const start = baseline();
  const form = networkConfigLocators.form;

  await openNetworkSettings(page, start.hostname);
  await page.locator(form.ipv4gateway).fill(unreachableGateway);
  await page.locator(networkConfigLocators.save).click();

  await expect(page.locator(form.ipv4gatewayField)).toContainText(`Gateway ${unreachableGateway} is unreachable`, {
    timeout: networkSaveTimeoutMs,
  });
  await expect(page.locator(networkConfigLocators.save)).toBeVisible();
  await discardNetworkSettings(page);

  expect((await readNetworkConfig(api)).ipv4gateway).toBe(start.ipv4gateway);
});

test('nameservers out of order are refused, and nothing is saved', async ({ page, api }) => {
  const start = baseline();
  const form = networkConfigLocators.form;

  await openNetworkSettings(page, start.hostname);
  // A third nameserver with no second one, whatever DHCP put in the first.
  await page.locator(form.nameserver2).fill('');
  await page.locator(form.nameserver3).fill('192.0.2.53');
  await page.locator(networkConfigLocators.save).click();

  // Middleware files this one under `nameserver`, which names no field, so the
  // form reports it in the error dialog instead.
  await expect(page.locator(errorDialogLocators.message)).toContainText(/consecutive order/, {
    timeout: networkSaveTimeoutMs,
  });
  await page.locator(errorDialogClose).click();
  await expect(page.locator(errorDialogLocators.title)).toBeHidden();
  await discardNetworkSettings(page);

  const saved = await readNetworkConfig(api);
  expect(saved.nameserver2).toBe(start.nameserver2);
  expect(saved.nameserver3).toBe(start.nameserver3);
});
