/**
 * Stories: an admin adds, edits and deletes an NTP server from the NTP Servers
 * card on System > Advanced Settings, and the appliance holds what they did.
 *
 * Each save is asserted twice, the way the other Advanced Settings specs do it:
 * the card's row says the screen believed it, `system.ntpserver.query` says the
 * appliance did it — and carries IBurst, which the test leaves alone.
 *
 * Edit and delete each run beside a second server that must come through
 * untouched: the row's actions sit in a kebab menu, so an action belongs to
 * whichever row's menu was opened, and a row-targeting bug changes the wrong
 * server without failing anything else.
 *
 * Every address is unreachable on purpose, so every save goes through Force —
 * see `fixtures/ntp-servers.ts`.
 */
import { ensureNtpServerAbsent, ensureNtpServerPresent, findNtpServer } from '../fixtures/ntp-servers';
import {
  deleteNtpServer, forceSaveNtpServerForm, openAddNtpServerForm, openEditNtpServerForm,
} from '../flows/ntp-servers';
import { ntpServerLocators, type NtpServerRowKey } from '../locators/ntp-servers';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Created through the form, never over the API — that is the thing under test. */
const createdAddress = '192.0.2.11';

/** Provisioned over the API so there is something to edit or delete. */
const target: NtpServerRowKey = { address: '192.0.2.12', minpoll: 6, maxpoll: 10 };

/** The server that must survive whatever is done to the target. */
const bystander: NtpServerRowKey = { address: '192.0.2.13', minpoll: 6, maxpoll: 10 };

const allAddresses = [createdAddress, target.address, bystander.address];

/** Both servers over the API: acting on one from the card is the thing under test. */
async function seedTargetAndBystander(api: E2eApiClient): Promise<void> {
  await ensureNtpServerPresent(api, target);
  await ensureNtpServerPresent(api, bystander);
}

/**
 * Removed before each test as well as after, so an interrupted run leaves the
 * next one able to start, and unconditionally so a failure still cleans up.
 */
test.beforeEach(async ({ api }) => {
  for (const address of allAddresses) {
    await ensureNtpServerAbsent(api, address);
  }
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the NTP servers at ${allAddresses.join(', ')}`)) {
    return;
  }

  await runCleanupSteps(allAddresses.map((address): [string, () => Promise<void>] => [
    `remove the NTP server at ${address}`, () => ensureNtpServerAbsent(api, address),
  ]));
});

test('an admin adds an NTP server, and the appliance really has one', async ({ page, api }) => {
  const created: NtpServerRowKey = { address: createdAddress, minpoll: 5, maxpoll: 9 };

  await openAddNtpServerForm(page);
  await page.locator(ntpServerLocators.form.address).fill(created.address);
  await page.locator(ntpServerLocators.form.prefer).click();
  await page.locator(ntpServerLocators.form.minpoll).fill(String(created.minpoll));
  await page.locator(ntpServerLocators.form.maxpoll).fill(String(created.maxpoll));
  await forceSaveNtpServerForm(page);

  // The row tag carries both intervals, so finding the row at all says the card
  // read back the ones that were typed.
  await expect(page.locator(ntpServerLocators.card.address(created))).toHaveText(created.address);
  await expect(page.locator(ntpServerLocators.card.prefer(created))).toHaveText('Yes');
  await expect(page.locator(ntpServerLocators.card.burst(created))).toHaveText('No');

  expect(await findNtpServer(api, created.address)).toMatchObject({
    address: created.address,
    prefer: true,
    minpoll: created.minpoll,
    maxpoll: created.maxpoll,
    // Untouched in the form, so they have to come back out as its defaults.
    burst: false,
    iburst: true,
  });
});

test('editing an NTP server from the card changes the server that was picked', async ({ page, api }) => {
  await seedTargetAndBystander(api);
  const before = await findNtpServer(api, target.address);
  const edited: NtpServerRowKey = { ...target, maxpoll: 11 };

  await openEditNtpServerForm(page, target);
  await page.locator(ntpServerLocators.form.burst).click();
  // Ticked on the seeded server, so a stored `iburst: false` can only have come from this click.
  await page.locator(ntpServerLocators.form.iburst).click();
  await page.locator(ntpServerLocators.form.maxpoll).fill(String(edited.maxpoll));
  await forceSaveNtpServerForm(page);

  // Max Poll is in the row tag, so the edited row answers only under its new ids.
  await expect(page.locator(ntpServerLocators.card.maxPoll(edited))).toHaveText(String(edited.maxpoll));
  await expect(page.locator(ntpServerLocators.card.burst(edited))).toHaveText('Yes');
  await expect(page.locator(ntpServerLocators.card.row(target))).toBeHidden();

  // The same record, by id: an update, not a delete and a create that happen to
  // leave the card looking the same.
  expect(await findNtpServer(api, target.address)).toMatchObject({
    id: before?.id,
    burst: true,
    iburst: false,
    maxpoll: edited.maxpoll,
    // Left alone on edit, so they have to come back out the way they went in.
    prefer: false,
    minpoll: target.minpoll,
  });

  expect(await findNtpServer(api, bystander.address)).toMatchObject({
    burst: false,
    iburst: true,
    prefer: false,
    minpoll: bystander.minpoll,
    maxpoll: bystander.maxpoll,
  });
});

test('deleting an NTP server from the card removes the server that was picked', async ({ page, api }) => {
  await seedTargetAndBystander(api);

  await deleteNtpServer(page, target);

  // Polled rather than read once: a row can also be hidden while the table is
  // between loads, which proves nothing.
  await expect.poll(() => findNtpServer(api, target.address)).toBeUndefined();

  // The whole point of the second server: the card looks right either way.
  await expect(page.locator(ntpServerLocators.card.row(bystander))).toBeVisible();
  expect(await findNtpServer(api, bystander.address)).toMatchObject({ maxpoll: bystander.maxpoll });
});
