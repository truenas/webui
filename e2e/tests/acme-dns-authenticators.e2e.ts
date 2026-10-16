/**
 * Stories: an admin adds a Cloudflare ACME DNS authenticator on Credentials >
 * Certificates, is stopped from giving it an API token and an API key at once,
 * edits one and deletes one from its row, and the appliance holds what they did.
 *
 * Each action is asserted twice: the card's row says the screen believed it,
 * `acme.dns.authenticator.query` says the appliance did it.
 *
 * The token is a dummy. Middleware checks a Cloudflare authenticator's
 * credentials only for which of token, key and email were given together, and
 * never calls Cloudflare on save — see `fixtures/acme-dns-authenticators.ts`.
 *
 * The edit and the delete each run beside a second authenticator that must come
 * through untouched. Every row has its own Edit and Delete, so a row-targeting
 * bug acts on the wrong one without failing anything else.
 */
import {
  cloudflareAttributes,
  countAcmeDnsAuthenticators,
  ensureAcmeDnsAuthenticatorAbsent,
  ensureCloudflareAuthenticatorPresent,
  findAcmeDnsAuthenticator,
} from '../fixtures/acme-dns-authenticators';
import {
  deleteAcmeDnsAuthenticator,
  openAddAcmeDnsAuthenticatorForm,
  openEditAcmeDnsAuthenticatorForm,
  saveAcmeDnsAuthenticatorForm,
} from '../flows/acme-dns-authenticators';
import { acmeDnsCardPageSize, acmeDnsLocators } from '../locators/acme-dns-authenticators';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Created through the form, never over the API — that is the thing under test. */
const createdName = 'e2e-acme-created';
const createdToken = 'e2e-dummy-token-created';

/** Refused with a token and a key, then saved with the token alone. */
const refusedName = 'e2e-acme-refused';
const refusedToken = 'e2e-dummy-token-refused';
const refusedKey = 'e2e-dummy-global-key';

/** Provisioned over the API so there is something to edit or delete. */
const targetName = 'e2e-acme-target';
const targetToken = 'e2e-dummy-token-target';
const editedToken = 'e2e-dummy-token-edited';

/** The authenticator that must survive whatever is done to the target. */
const bystanderName = 'e2e-acme-bystander';
const bystanderToken = 'e2e-dummy-token-bystander';

const allNames = [createdName, refusedName, targetName, bystanderName];

async function removeEverything(api: E2eApiClient): Promise<void> {
  await runCleanupSteps(allNames.map((name): [string, () => Promise<void>] => [
    `remove the ACME DNS authenticator ${name}`, () => ensureAcmeDnsAuthenticatorAbsent(api, name),
  ]));
}

/**
 * Fails up front when the card cannot show every row a test needs.
 *
 * The card lists four authenticators, oldest first, before its pager — see
 * `acmeDnsCardPageSize`. A fresh appliance holds none; failing here says why
 * rather than timing out on a hidden row.
 */
async function requireRoomOnCard(api: E2eApiClient, adding: number): Promise<void> {
  const existing = await countAcmeDnsAuthenticators(api);
  expect(
    existing + adding <= acmeDnsCardPageSize,
    `the card lists ${acmeDnsCardPageSize} authenticators, this test adds ${adding}, the appliance has ${existing}`,
  ).toBe(true);
}

/**
 * Removed before each test as well as after, so an interrupted run leaves the
 * next one able to start, and unconditionally so a failure still cleans up.
 */
test.beforeEach(async ({ api }) => {
  await removeEverything(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the ACME DNS authenticators ${allNames.join(', ')}`)) {
    return;
  }

  await removeEverything(api);
});

test('a Cloudflare authenticator added with an API token is stored with that token', async ({ page, api }) => {
  const { card, form } = acmeDnsLocators;
  await requireRoomOnCard(api, 1);

  await openAddAcmeDnsAuthenticatorForm(page);
  await page.locator(form.name).fill(createdName);
  await page.locator(form.apiToken).fill(createdToken);
  await saveAcmeDnsAuthenticatorForm(page);

  await expect(page.locator(card.name(createdName))).toHaveText(createdName);
  await expect(page.locator(card.authenticator(createdName))).toHaveText('cloudflare');

  const created = await findAcmeDnsAuthenticator(api, createdName);
  expect(cloudflareAttributes(created)).toMatchObject({
    authenticator: 'cloudflare',
    api_token: createdToken,
  });
});

test('the form refuses an API token together with an API key, and saves the token alone', async ({ page, api }) => {
  const { form } = acmeDnsLocators;
  await requireRoomOnCard(api, 1);

  await openAddAcmeDnsAuthenticatorForm(page);
  await page.locator(form.name).fill(refusedName);
  await page.locator(form.apiToken).fill(refusedToken);
  await page.locator(form.apiKey).fill(refusedKey);

  // Name and token alone are a valid form, so the key is the only thing that
  // can have made it invalid.
  await expect(page.locator(form.mutuallyExclusive)).toContainText('not both');
  await expect(page.locator(form.save)).toBeDisabled();

  await page.locator(form.apiKey).fill('');
  await expect(page.locator(form.mutuallyExclusive)).toBeHidden();
  await expect(page.locator(form.save)).toBeEnabled();
  await saveAcmeDnsAuthenticatorForm(page);

  // The key typed and then cleared must not have reached the appliance.
  const saved = cloudflareAttributes(await findAcmeDnsAuthenticator(api, refusedName));
  expect(saved?.api_token).toBe(refusedToken);
  expect(saved?.api_key ?? null).toBeNull();
});

test('editing an authenticator changes that authenticator and leaves the other alone', async ({ page, api }) => {
  const { form } = acmeDnsLocators;
  await requireRoomOnCard(api, 2);
  await ensureCloudflareAuthenticatorPresent(api, targetName, targetToken);
  await ensureCloudflareAuthenticatorPresent(api, bystanderName, bystanderToken);
  const targetBefore = await findAcmeDnsAuthenticator(api, targetName);
  const bystanderBefore = await findAcmeDnsAuthenticator(api, bystanderName);
  expect(targetBefore).toBeDefined();
  expect(bystanderBefore).toBeDefined();

  await openEditAcmeDnsAuthenticatorForm(page, targetName);
  await expect(page.locator(form.apiToken)).toHaveValue(targetToken);
  await page.locator(form.apiToken).fill(editedToken);
  await saveAcmeDnsAuthenticatorForm(page);

  const targetAfter = await findAcmeDnsAuthenticator(api, targetName);
  expect(targetAfter?.id).toBe(targetBefore?.id);
  expect(cloudflareAttributes(targetAfter)?.api_token).toBe(editedToken);

  // The whole point of the second authenticator: the card looks right either way.
  expect(await findAcmeDnsAuthenticator(api, bystanderName)).toEqual(bystanderBefore);
});

test('deleting an authenticator from its row removes the one that was picked', async ({ page, api }) => {
  await requireRoomOnCard(api, 2);
  await ensureCloudflareAuthenticatorPresent(api, targetName, targetToken);
  await ensureCloudflareAuthenticatorPresent(api, bystanderName, bystanderToken);
  const bystanderBefore = await findAcmeDnsAuthenticator(api, bystanderName);
  expect(bystanderBefore).toBeDefined();

  await deleteAcmeDnsAuthenticator(page, targetName);

  // Polled rather than read once: a row can also be hidden while the card is
  // between loads, which proves nothing.
  await expect.poll(() => findAcmeDnsAuthenticator(api, targetName)).toBeUndefined();

  await expect(page.locator(acmeDnsLocators.card.row(bystanderName))).toBeVisible();
  expect(await findAcmeDnsAuthenticator(api, bystanderName)).toEqual(bystanderBefore);
});
