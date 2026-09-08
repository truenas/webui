/**
 * Stories: looking after an access key that already exists.
 *
 * An administrator rotates a key's secret and deletes a key, both from the row
 * menu under Credentials. Each starts from a key the API created — minting one
 * through the UI is `s3.e2e.ts`'s story.
 *
 * Rotation is the interesting one: middleware issues a new secret under the
 * same access key id and shows it once. The dialog is the only place the new
 * secret ever appears, so the test reads it there and compares it with the
 * secret the API handed out at creation.
 */
import {
  ensureS3AccessKeysAbsent, findS3AccessKeys, provisionS3AccessKey,
} from '../fixtures/s3';
import { ensureUserAbsent, ensureUserPresent } from '../fixtures/users';
import { deleteS3AccessKey, rotateS3AccessKey } from '../flows/s3';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Distinct from the other S3 specs' owner; see `s3-bucket-management.e2e.ts`. */
const owner = 'keyowner';
const accessKey = 'e2e-s3-managed-key';

/** The secret middleware issued at creation; the one rotation must replace. */
let createdSecret: string | null;

async function cleanUp(api: E2eApiClient): Promise<void> {
  await runCleanupSteps([
    ['remove the access keys', () => ensureS3AccessKeysAbsent(api, owner)],
    ['delete the owner', () => ensureUserAbsent(api, owner)],
  ]);
}

test.beforeEach(async ({ api }) => {
  await cleanUp(api);
  await ensureUserPresent(api, owner);
  createdSecret = (await provisionS3AccessKey(api, { name: accessKey, username: owner })).secret;
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`access key "${accessKey}" and user "${owner}"`)) {
    return;
  }
  await cleanUp(api);
});

test('an admin rotates an access key and is shown the new secret once', async ({ page, api }) => {
  const [before] = await findS3AccessKeys(api, owner);
  expect(before?.access_key).toBeDefined();

  const shown = await rotateS3AccessKey(page, accessKey);

  expect(shown.accessKeyId).toBe(before?.access_key);
  // Compared as booleans so a failure never prints a secret into the report.
  expect(shown.secretAccessKey.length > 0, 'the dialog showed an empty secret').toBe(true);
  expect(shown.secretAccessKey === createdSecret, 'rotation showed the old secret again').toBe(false);

  const [after] = await findS3AccessKeys(api, owner);
  expect(after).toMatchObject({ name: accessKey, access_key: before?.access_key, enabled: true });
});

test('an admin deletes an access key', async ({ page, api }) => {
  await deleteS3AccessKey(page, accessKey);

  expect(await findS3AccessKeys(api, owner)).toHaveLength(0);
});
