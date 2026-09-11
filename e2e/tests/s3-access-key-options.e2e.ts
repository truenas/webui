/**
 * Stories: the access key options beyond a plain, non-expiring key.
 *
 * An administrator mints a key that may manage buckets for an account that is
 * allowed to; is refused the same for an account that is not; and mints a key
 * with an expiry date. Each creates its key through the UI, since the options
 * are the form's, and `s3.e2e.ts` already covers the plain case.
 *
 * What only an appliance can answer: that the role check behind Manage
 * Buckets is real and lands in the form, and that a typed date arrives at
 * middleware as the day that was typed.
 */
import { ensureS3AccessKeysAbsent, findS3AccessKeys } from '../fixtures/s3';
import { ensureUserAbsent, ensureUserPresent } from '../fixtures/users';
import { attemptRefusedS3AccessKey, createS3AccessKey } from '../flows/s3';
import { s3AccessKeyLocators } from '../locators/s3';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Holds SHARING_S3_WRITE through builtin_administrators; may manage buckets. */
const administrator = 'keyadmin';
/** A plain account with no roles; may not. */
const plainUser = 'keyuser';
const managerKey = 'e2e-s3-manager-key';
const refusedKey = 'e2e-s3-refused-key';
const expiringKey = 'e2e-s3-expiring-key';

/** Well clear of a timezone's worth of drift between the browser's day and middleware's. */
const dayToleranceMs = 36 * 60 * 60 * 1000;

/**
 * A middleware timestamp as milliseconds. The generated client types
 * `expires_at` as a string; the wire shape is `{ $date: <ms> }`, which the UI
 * reads. Both are accepted so the assertion survives either.
 */
function timestampMs(value: unknown): number | undefined {
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  if (value && typeof value === 'object' && '$date' in value && typeof value.$date === 'number') {
    return value.$date;
  }
  return undefined;
}

async function cleanUp(api: E2eApiClient): Promise<void> {
  await runCleanupSteps([
    ['remove the administrator keys', () => ensureS3AccessKeysAbsent(api, administrator)],
    ['remove the plain user keys', () => ensureS3AccessKeysAbsent(api, plainUser)],
    ['delete the administrator', () => ensureUserAbsent(api, administrator)],
    ['delete the plain user', () => ensureUserAbsent(api, plainUser)],
  ]);
}

test.beforeEach(async ({ api }) => {
  await cleanUp(api);
  await ensureUserPresent(api, administrator, { administrator: true });
  await ensureUserPresent(api, plainUser);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the access keys and users "${administrator}" and "${plainUser}"`)) {
    return;
  }
  await cleanUp(api);
});

test('an admin mints a key that may manage buckets for an account allowed to', async ({ page, api }) => {
  await createS3AccessKey(page, { name: managerKey, username: administrator, manageBuckets: true });

  await expect(page.locator(s3AccessKeyLocators.rowManageBuckets(managerKey))).toHaveText(/yes/i);

  const [key] = await findS3AccessKeys(api, administrator);
  expect(key).toMatchObject({ name: managerKey, manage_buckets: true, enabled: true });
});

test('the form refuses Manage Buckets for an account that cannot hold it', async ({ page, api }) => {
  await attemptRefusedS3AccessKey(page, { name: refusedKey, username: plainUser, manageBuckets: true });

  // Refused means refused: nothing was created behind the error.
  expect(await findS3AccessKeys(api, plainUser)).toHaveLength(0);
});

test('an admin mints a key that expires on a chosen day', async ({ page, api }) => {
  const expiresOn = new Date();
  expiresOn.setFullYear(expiresOn.getFullYear() + 1);

  await createS3AccessKey(page, { name: expiringKey, username: plainUser, expiresOn });

  // The list shows the expiry relative to now, whatever the wording; what it
  // must not say is that the key never expires.
  const expiry = page.locator(s3AccessKeyLocators.rowExpiry(expiringKey));
  await expect(expiry).toBeVisible();
  await expect(expiry).not.toHaveText(/never/i);

  const [key] = await findS3AccessKeys(api, plainUser);
  expect(key?.name).toBe(expiringKey);
  const storedAt = timestampMs(key?.expires_at);
  expect(storedAt, 'middleware stored no expiry for the key').toBeDefined();
  expect(Math.abs((storedAt ?? 0) - expiresOn.getTime())).toBeLessThan(dayToleranceMs);
});
