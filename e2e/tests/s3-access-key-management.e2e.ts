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
  ensureS3AccessKeyPresent, ensureS3AccessKeysAbsent, findS3AccessKeys,
} from '../fixtures/s3';
import { ensureUserAbsent, ensureUserPresent } from '../fixtures/users';
import { deleteS3AccessKey, rotateS3AccessKey } from '../flows/s3';
import type { E2eApiClient } from '../support/api/client';
import { runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const owner = 'bucketowner';
const accessKey = 'e2e-s3-managed-key';

const keepTestData = process.env.TN_KEEP_TEST_DATA === '1';

/** The secret middleware issued at creation; only the creating call ever sees it. */
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
  createdSecret = (await ensureS3AccessKeyPresent(api, { name: accessKey, username: owner })).secret;
});

test.afterEach(async ({ api }) => {
  if (keepTestData) {
    console.warn(`TN_KEEP_TEST_DATA=1 — leaving access key "${accessKey}" and user "${owner}".`);
    return;
  }
  await cleanUp(api);
});

test('an admin rotates an access key and is shown the new secret once', async ({ page, api }) => {
  const [before] = await findS3AccessKeys(api, owner);
  expect(before?.access_key).toBeDefined();

  const shown = await rotateS3AccessKey(page, accessKey);

  expect(shown.accessKeyId).toBe(before?.access_key);
  expect(shown.secretAccessKey).not.toBe('');
  expect(shown.secretAccessKey, 'rotation showed the old secret again').not.toBe(createdSecret);

  const [after] = await findS3AccessKeys(api, owner);
  expect(after).toMatchObject({ name: accessKey, access_key: before?.access_key, enabled: true });
});

test('an admin deletes an access key', async ({ page, api }) => {
  await deleteS3AccessKey(page, accessKey);

  expect(await findS3AccessKeys(api, owner)).toHaveLength(0);
});
