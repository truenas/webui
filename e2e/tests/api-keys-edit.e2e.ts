/**
 * Stories: an admin edits an API key from the API Keys page under Credentials >
 * Users — renames it, resets it, gives it an expiry and takes it away — and is
 * refused a rename onto a name another key holds.
 *
 * Each is asserted on the row and through `api_key.query`, and every one runs
 * beside a bystander key on the same account that must come through untouched.
 * The bystander is also what lets the Access card link to the page at all.
 *
 * Whether a key still works is asked of middleware directly: one API-key
 * sign-in attempt per key, over a fresh connection. Middleware no longer
 * reports a key's hash in readable form, so that attempt is the only way to
 * tell a reset key from a renamed one.
 *
 * `api-keys.e2e.ts` covers create and delete.
 */
import {
  apiKeyExpiryMs, createApiKeyWithSecret, ensureApiKeyAbsent, ensureApiKeyPresent, findApiKey,
} from '../fixtures/api-keys';
import { ensureUserAbsent, ensureUserPresent } from '../fixtures/users';
import {
  discardApiKeyEdit, editApiKey, openUserApiKeys, resetApiKey, submitApiKeyEdit,
} from '../flows/api-keys';
import { apiKeyLocators } from '../locators/api-keys';
import { errorDialogLocators } from '../locators/dialogs';
import { signsInWithApiKey, type E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps, type CleanupStep } from '../support/cleanup';
import { errorDialogClose } from '../support/constants';
import { expect, test } from '../support/fixtures';
import { slowCallTimeoutMs } from '../support/timeouts';

/** Distinct from `api-keys.e2e.ts`'s and the S3 specs' owners. */
const owner = 'apikeyeditor';

/** The key each test edits. */
const targetKey = 'e2e-api-key-edit-target';

/** What the rename test calls it afterwards. */
const renamedKey = 'e2e-api-key-edit-renamed';

/** The key that must survive whatever is done to the target. */
const bystanderKey = 'e2e-api-key-edit-bystander';

const allKeys = [targetKey, renamedKey, bystanderKey];

/** Every key a test can leave on the owner, but not the owner itself. */
async function removeKeys(api: E2eApiClient): Promise<void> {
  await runCleanupSteps(allKeys.map((name): CleanupStep => [
    `remove the API key "${name}"`, () => ensureApiKeyAbsent(api, name),
  ]));
}

// The owner is created once for the file: it only holds the keys here, and
// each account costs middleware about a second to create and another to
// delete. The keys stay per test. A failed test restarts the worker, which
// runs afterAll and then beforeAll again, so a retry still starts clean.
test.beforeAll(async ({ api }) => {
  // Keys before their owner, so no key is left behind on an account that is gone.
  await removeKeys(api);
  await ensureUserAbsent(api, owner);
  await ensureUserPresent(api, owner, { administrator: true });
});

test.beforeEach(async ({ api }) => {
  await removeKeys(api);
  await ensureApiKeyPresent(api, { name: bystanderKey, username: owner });
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`API keys ${allKeys.join(', ')}`)) {
    return;
  }
  await removeKeys(api);
});

test.afterAll(async ({ api }) => {
  if (leavingTestData(`user "${owner}"`)) {
    return;
  }
  await runCleanupSteps([
    [`delete the user "${owner}"`, () => ensureUserAbsent(api, owner)],
  ]);
});

test('an admin renames an API key, and the key itself keeps working', async ({ page, api, config }) => {
  const secret = await createApiKeyWithSecret(api, { name: targetKey, username: owner });
  const before = await findApiKey(api, targetKey);
  const bystanderBefore = await findApiKey(api, bystanderKey);

  await openUserApiKeys(page, owner);
  await editApiKey(page, targetKey, { name: renamedKey });

  await expect(page.locator(apiKeyLocators.row(targetKey))).toBeHidden();
  await expect(page.locator(apiKeyLocators.username(renamedKey))).toHaveText(owner);

  expect(await findApiKey(api, targetKey)).toBeUndefined();
  expect(await findApiKey(api, renamedKey)).toMatchObject({
    id: before?.id,
    username: owner,
    revoked: false,
    expires_at: null,
  });

  // A rename that quietly reset the key would pass every check above.
  expect(
    await signsInWithApiKey(config, { username: owner, key: secret }),
    'the key no longer signs in after a rename',
  ).toBe(true);

  expect(await findApiKey(api, bystanderKey)).toEqual(bystanderBefore);
});

test('an admin resets an API key, is shown the new one once, and the old one stops working', async ({
  page, api, config,
}) => {
  const oldSecret = await createApiKeyWithSecret(api, { name: targetKey, username: owner });
  const target = await findApiKey(api, targetKey);
  const bystanderBefore = await findApiKey(api, bystanderKey);

  await openUserApiKeys(page, owner);
  const shown = await resetApiKey(page, targetKey);

  // Compared as booleans so a failure never prints a key into the report.
  expect(shown.length > 0, 'the dialog showed an empty key').toBe(true);
  expect(shown.startsWith(`${target?.id}-`), 'the dialog showed a key that is not this one').toBe(true);
  expect(shown !== oldSecret, 'the dialog showed the old key again').toBe(true);

  expect(await findApiKey(api, targetKey)).toMatchObject({ id: target?.id, username: owner, revoked: false });

  expect(
    await signsInWithApiKey(config, { username: owner, key: oldSecret }),
    'the old key still signs in after a reset',
  ).toBe(false);
  expect(
    await signsInWithApiKey(config, { username: owner, key: shown }),
    'the key the dialog showed does not sign in',
  ).toBe(true);

  expect(await findApiKey(api, bystanderKey)).toEqual(bystanderBefore);
});

test('an admin gives a non-expiring API key an expiry date, and then takes it away', async ({ page, api }) => {
  await ensureApiKeyPresent(api, { name: targetKey, username: owner });
  const bystanderBefore = await findApiKey(api, bystanderKey);

  // A few months out: the form's minimum is today, and middleware refuses a
  // date in the past.
  const expiresOn = new Date();
  expiresOn.setMonth(expiresOn.getMonth() + 3);

  await openUserApiKeys(page, owner);
  await editApiKey(page, targetKey, { expiresOn });

  await expect(page.locator(apiKeyLocators.expiresOn(targetKey))).not.toHaveText(/never/i);

  // The form sends the browser's local midnight of the chosen day. The browser
  // and this runner share a host and no `timezoneId` is set, so reading the
  // stored instant in local time gives back the day that was typed.
  const storedMs = apiKeyExpiryMs(await findApiKey(api, targetKey));
  expect(storedMs, 'middleware stored no expiry for the key').not.toBeNull();
  const stored = new Date(storedMs ?? 0);
  expect([stored.getFullYear(), stored.getMonth(), stored.getDate()]).toEqual([
    expiresOn.getFullYear(), expiresOn.getMonth(), expiresOn.getDate(),
  ]);

  await editApiKey(page, targetKey, { expiresOn: null });

  await expect(page.locator(apiKeyLocators.expiresOn(targetKey))).toHaveText('Never');
  expect(await findApiKey(api, targetKey)).toMatchObject({ expires_at: null });

  expect(await findApiKey(api, bystanderKey)).toEqual(bystanderBefore);
});

test('renaming an API key onto another key\'s name is refused', async ({ page, api }) => {
  await ensureApiKeyPresent(api, { name: targetKey, username: owner });
  const target = await findApiKey(api, targetKey);
  const bystanderBefore = await findApiKey(api, bystanderKey);

  await openUserApiKeys(page, owner);
  // The edit form has no name-in-use validator, unlike the add form, so this
  // reaches middleware. It files the refusal under `api_key_update`, which
  // names no field, so the form reports it in the error dialog.
  await submitApiKeyEdit(page, targetKey, { name: bystanderKey });

  await expect(page.locator(errorDialogLocators.message)).toContainText('name must be unique', {
    timeout: slowCallTimeoutMs,
  });
  await page.locator(errorDialogClose).click();
  await expect(page.locator(errorDialogLocators.title)).toBeHidden();

  // Refused means the panel is still there to correct the name in.
  await expect(page.locator(apiKeyLocators.form.save)).toBeVisible();
  await discardApiKeyEdit(page);

  expect(await findApiKey(api, targetKey)).toMatchObject({ id: target?.id });
  expect(await findApiKey(api, bystanderKey)).toEqual(bystanderBefore);
});
