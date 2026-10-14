/**
 * Stories: an admin creates an API key for a user and deletes one, from the
 * API Keys page under Credentials > Users, and the appliance holds what they did.
 *
 * Each is asserted twice, the way the other list specs do it: the row says the
 * screen believed it, `api_key.query` says the appliance did it — and carries
 * what the list shows differently or not at all, like the expiry and who the
 * key belongs to.
 *
 * Both run beside a second key on the same account that must come through
 * untouched. It is also what gets either test to the page at all: the Access
 * card links to a user's keys only once the user has one.
 *
 * The account is an administrator because the form's user picker lists only
 * local users holding a role; a plain account would never be offered.
 */
import { ensureApiKeyAbsent, ensureApiKeyPresent, findApiKey } from '../fixtures/api-keys';
import { ensureUserAbsent, ensureUserPresent } from '../fixtures/users';
import { createApiKey, deleteApiKey, openUserApiKeys } from '../flows/api-keys';
import { apiKeyLocators } from '../locators/api-keys';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Distinct from the S3 specs' owners, so no other spec's teardown removes it. */
const owner = 'apikeyowner';

/** Created through the form, never over the API — that is the thing under test. */
const createdKey = 'e2e-api-key-created';

/** Provisioned over the API so there is something to delete. */
const targetKey = 'e2e-api-key-target';

/** The key that must survive whatever is done to the others. */
const bystanderKey = 'e2e-api-key-bystander';

const allKeys = [createdKey, targetKey, bystanderKey];

/** Keys before their owner, so no key is left behind on an account that is gone. */
async function cleanUp(api: E2eApiClient): Promise<void> {
  await runCleanupSteps([
    ...allKeys.map((name): [string, () => Promise<void>] => [
      `remove the API key "${name}"`, () => ensureApiKeyAbsent(api, name),
    ]),
    [`delete the user "${owner}"`, () => ensureUserAbsent(api, owner)],
  ]);
}

/**
 * Removed before each test as well as after, so an interrupted run leaves the
 * next one able to start, and unconditionally so a failure still cleans up.
 */
test.beforeEach(async ({ api }) => {
  await cleanUp(api);
  await ensureUserPresent(api, owner, { administrator: true });
  await ensureApiKeyPresent(api, { name: bystanderKey, username: owner });
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`API keys ${allKeys.join(', ')} and user "${owner}"`)) {
    return;
  }
  await cleanUp(api);
});

test('an admin creates an API key for a user and is shown it once', async ({ page, api }) => {
  await openUserApiKeys(page, owner);

  const shown = await createApiKey(page, { name: createdKey, username: owner });

  await expect(page.locator(apiKeyLocators.username(createdKey))).toHaveText(owner);

  const created = await findApiKey(api, createdKey);
  expect(created).toMatchObject({
    username: owner,
    revoked: false,
    // The form's default, Non-expiring, left as it was.
    expires_at: null,
  });

  // Middleware hands a key out as `<id>-<secret>`, so the prefix ties what the
  // dialog showed to this record. Compared as booleans so a failure never
  // prints a key into the report.
  expect(shown.length > 0, 'the dialog showed an empty key').toBe(true);
  expect(shown.startsWith(`${created?.id}-`), 'the dialog showed a key that is not this one').toBe(true);

  await expect(page.locator(apiKeyLocators.row(bystanderKey))).toBeVisible();
  expect(await findApiKey(api, bystanderKey)).toBeDefined();
});

test('an admin deletes the API key they picked, and only that one', async ({ page, api }) => {
  await ensureApiKeyPresent(api, { name: targetKey, username: owner });

  await openUserApiKeys(page, owner);
  await deleteApiKey(page, targetKey);

  expect(await findApiKey(api, targetKey)).toBeUndefined();

  // The whole point of the second key: the list looks right either way.
  await expect(page.locator(apiKeyLocators.row(bystanderKey))).toBeVisible();
  expect(await findApiKey(api, bystanderKey)).toBeDefined();
});
