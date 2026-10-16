/**
 * Stories: the links on a user's Access card, under Credentials > Users — adding
 * an API key for a user who has none, viewing the keys of one who has, and
 * downloading a user's SSH public key.
 *
 * Each link is offered only in some states, so each test sets the state up over
 * the API and checks the link against it: "Add API Key" for a user with no key,
 * "View API Keys" once they hold one, "Download Public Key" only while they have
 * an `sshpubkey`. Locking and the one-time password are in
 * `unauthenticated/user-sign-in-controls.e2e.ts`, because their claims are about
 * signing in afterwards.
 *
 * Both accounts are administrators because the card offers "Add API Key" only to
 * a user holding a role, and the API key form lists no one else.
 */
import { readFile } from 'node:fs/promises';
import { ensureApiKeyAbsent, ensureApiKeyPresent, findApiKey } from '../fixtures/api-keys';
import { datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { ensureUserAbsent, ensureUserPresent, giveUserPublicKey } from '../fixtures/users';
import { openUserApiKeys } from '../flows/api-keys';
import { addApiKeyFromAccessCard, downloadUserPublicKey, openUserDetails } from '../flows/users';
import { apiKeyLocators } from '../locators/api-keys';
import { usersLocators } from '../locators/users';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/**
 * The account each test is about, and a second one that must not be mistaken for it.
 *
 * Neither name contains the other: "View API Keys" filters the list with a
 * case-insensitive match on the username *or* the key name, so a name that
 * contained the other would let the bystander's keys through and the filter
 * would look broken when it was not.
 */
const owner = 'detailsowner';
const bystander = 'detailsbystander';

/** Created through the Access card, never over the API — that is the thing under test. */
const createdKey = 'e2e-details-created';

/** Provisioned over the API, one per account, for the filtered list to tell apart. */
const ownerKey = 'e2e-details-owned';
const bystanderKey = 'e2e-details-other';

const allKeys = [createdKey, ownerKey, bystanderKey];

/**
 * The dataset the key owner's home is made in. Middleware stores an SSH key only
 * for a user whose home is on a dataset (see `giveUserPublicKey`).
 */
const homeLeaf = 'e2e-details-home';

/**
 * Keys before their owners, so no key is left behind on an account that is gone,
 * and the home dataset after the accounts, so none is left living in it.
 */
async function cleanUp(api: E2eApiClient, pool: string): Promise<void> {
  await runCleanupSteps([
    ...allKeys.map((name): [string, () => Promise<void>] => [
      `remove the API key "${name}"`, () => ensureApiKeyAbsent(api, name),
    ]),
    [`delete the user "${owner}"`, () => ensureUserAbsent(api, owner)],
    [`delete the user "${bystander}"`, () => ensureUserAbsent(api, bystander)],
    [`remove the dataset "${pool}/${homeLeaf}"`, () => ensureDatasetAbsent(api, `${pool}/${homeLeaf}`)],
  ]);
}

/**
 * Removed before each test as well as after, so an interrupted run leaves the
 * next one able to start, and unconditionally so a failure still cleans up.
 */
test.beforeEach(async ({ api, pool }) => {
  await cleanUp(api, pool);
  await ensureUserPresent(api, owner, { administrator: true });
  await ensureUserPresent(api, bystander, { administrator: true });
});

test.afterEach(async ({ api, pool }) => {
  const keys = allKeys.join(', ');
  if (leavingTestData(`API keys ${keys}, users "${owner}", "${bystander}" and dataset "${pool}/${homeLeaf}"`)) {
    return;
  }
  await cleanUp(api, pool);
});

test('Add API Key on a user with none creates a key for that user', async ({ page, api }) => {
  await openUserDetails(page, owner);

  await addApiKeyFromAccessCard(page, { name: createdKey, username: owner });

  // The form opens with the account already picked. The appliance's record is
  // what says the pick was this user and not the signed-in admin, which is
  // where the form opens when nothing is preset.
  expect(await findApiKey(api, createdKey)).toMatchObject({ username: owner, revoked: false });

  // The card reloads the user, and a user holding a key is offered the list instead.
  await expect(page.locator(usersLocators.viewApiKeys(owner))).toBeVisible();
  await expect(page.locator(usersLocators.addApiKey(owner))).toBeHidden();
});

test('View API Keys opens the list filtered to that user', async ({ page, api }) => {
  await ensureApiKeyPresent(api, { name: ownerKey, username: owner });
  await ensureApiKeyPresent(api, { name: bystanderKey, username: bystander });

  await openUserApiKeys(page, owner);

  await expect(page.locator(apiKeyLocators.row(ownerKey))).toBeVisible();
  await expect(page.locator(apiKeyLocators.username(ownerKey))).toHaveText(owner);
  // Asserted after the owner's row is on screen, so the list has loaded and this
  // is the filter at work rather than a page that has not rendered yet.
  await expect(page.locator(apiKeyLocators.row(bystanderKey))).toBeHidden();
});

test('Download Public Key is offered only for a user with an SSH key', async ({ page, api, pool }) => {
  await ensureDatasetPresent(api, `${pool}/${homeLeaf}`);
  const publicKey = await giveUserPublicKey(api, owner, datasetMountPath(`${pool}/${homeLeaf}`));

  await test.step('a user without a key is not offered the link', async () => {
    // `openUserDetails` waits on this user's own SSH line, so the card on screen
    // is the bystander's when the link's absence is checked.
    await openUserDetails(page, bystander);
    await expect(page.locator(usersLocators.sshAccess(bystander))).toHaveText('No SSH Access');
    await expect(page.locator(usersLocators.downloadPublicKey(bystander))).toBeHidden();
  });

  await test.step('a user with one downloads exactly that key', async () => {
    await openUserDetails(page, owner);

    const download = await downloadUserPublicKey(page, owner);

    expect(download.suggestedFilename()).toBe(`${owner}_public_key_rsa`);
    expect((await readFile(await download.path(), 'utf8')).trim()).toBe(publicKey.trim());
  });
});
