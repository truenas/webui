/**
 * Stories: from the Network Configuration card on System > Network an admin changes hostname, domain, search
 * domains, host entries, service announcements and outbound activity, and middleware refuses a nameserver or
 * gateway that would break resolving or routing; saves are checked on the card and `network.configuration.config`.
 * CI is reached via qemu NAT on DHCP, so no test saves a real nameserver, gateway or interface change (addresses are
 * RFC 5737), nor Deny All or Allow Specific, which would cut image pulls. The form's save stores DHCP values as
 * static (`fixtures/network-config.ts`), so `afterEach` restores the config after every test, pass or fail.
 */
import {
  findActivityLabel, type NetworkSettings, readNetworkConfig, restoreNetworkConfig,
} from '../fixtures/network-config';
import {
  addChips,
  chooseOutboundServices,
  discardNetworkSettings,
  networkSaveTimeoutMs,
  openNetworkSettings,
  saveNetworkSettings,
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

/**
 * The outbound activity the Allow All Except test denies, by its value. ACME is
 * certificate issuing, which nothing on the CI appliance does, so denying it
 * for one test cuts nothing the suite needs — unlike the apps catalog or image
 * pulls.
 */
const deniedActivity = 'acme';

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

test('an admin allows all outbound activity except one service, and it is kept', async ({ page, api }) => {
  const start = baseline();
  const form = networkConfigLocators.form;
  const serviceLabel = await findActivityLabel(api, deniedActivity);
  if (serviceLabel === undefined) {
    throw new Error(`network.configuration.activity_choices offers no "${deniedActivity}"`);
  }
  // Allow All, stored as an empty deny list. Anything else and the radio below starts elsewhere.
  expect(start.activity).toEqual({ type: 'DENY', activities: [] });

  await openNetworkSettings(page, start.hostname);
  await expect(page.locator(form.outboundActivity('Allow All'))).toBeChecked();
  await expect(page.locator(form.outboundServices)).toBeHidden();

  await page.locator(form.outboundActivity('Allow All Except')).click();
  await chooseOutboundServices(page, [serviceLabel]);
  await saveNetworkSettings(page);

  await expect(page.locator(networkConfigLocators.card.outboundNetwork)).toHaveText(
    `Allow all except: ${deniedActivity}`,
  );
  // Still a deny list, now naming the service. An allow list here would have cut everything else.
  expect((await readNetworkConfig(api)).activity).toEqual({ type: 'DENY', activities: [deniedActivity] });

  // The form loads the stored list back into the radio and the select.
  await openNetworkSettings(page, start.hostname);
  await expect(page.locator(form.outboundActivity('Allow All Except'))).toBeChecked();
  await expect(page.locator(form.outboundServices)).toContainText(serviceLabel);
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
