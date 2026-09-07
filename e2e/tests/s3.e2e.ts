/**
 * Stories: S3 as a backup target.
 *
 * An administrator publishes a bucket with object lock from the Shares
 * dashboard, starting the S3 service when the app offers to; and separately
 * mints an access key for the account that will write to it, taking the
 * secret off the one dialog that ever shows it.
 *
 * Two independent tests rather than one chain (R1.2): the key does not need
 * the bucket, and a broken bucket form should not read as a broken key form.
 * Everything they merely depend on — a pool, the parent dataset, the account,
 * a stopped S3 service — comes from the API.
 */
import {
  ensureDatasetAbsent, ensureDatasetPresent, ensureS3AccessKeysAbsent, ensureS3BucketAbsent,
  ensureS3ServiceStopped, findS3AccessKeys, findS3Bucket, providePool, queryS3Service,
  s3OwnedPoolName,
} from '../fixtures/s3';
import { ensurePoolAbsent } from '../fixtures/storage';
import { ensureUserAbsent, ensureUserPresent } from '../fixtures/users';
import { createS3AccessKey, createS3BucketWithObjectLock } from '../flows/s3';
import type { E2eApiClient } from '../support/api/client';
import { expect, test } from '../support/fixtures';

const owner = 'bucketowner';
/** Under the provided pool; the bucket's own dataset is created beneath it. */
const parentDataset = 'e2e_s3';
const bucket = 'e2e-s3-bucket';
const retentionDays = 30;
const accessKey = 'e2e-s3-key';

const keepTestData = process.env.TN_KEEP_TEST_DATA === '1';

/** How long the S3 service gets to reach RUNNING after the start dialog. */
const serviceStartTimeoutMs = 60_000;

/** Which pool the parent dataset lives under; resolved once the API is up. */
let pool: string;

/**
 * Order matters: the service first, so nothing is serving what is about to be
 * removed; keys before the user, because a key outlives its account; the
 * bucket before its datasets, so the share is never left pointing at a dataset
 * that is gone; the pool last and only if this suite built it.
 *
 * Every step runs even when an earlier one throws, and the failures are
 * reported together — the same reasoning as `fresh-install.e2e.ts`.
 */
async function cleanUp(api: E2eApiClient): Promise<void> {
  const steps: [string, () => Promise<unknown>][] = [
    ['stop the S3 service', () => ensureS3ServiceStopped(api)],
    ['remove the access keys', () => ensureS3AccessKeysAbsent(api, owner)],
    ['remove the bucket', () => ensureS3BucketAbsent(api, bucket)],
    ['delete the parent dataset', () => ensureDatasetAbsent(api, `${pool}/${parentDataset}`)],
    ['delete the owner', () => ensureUserAbsent(api, owner)],
    ['export the pool this suite built', () => ensurePoolAbsent(api, s3OwnedPoolName)],
  ];

  const failures: string[] = [];

  for (const [what, run] of steps) {
    try {
      await run();
    } catch (error) {
      failures.push(`${what} — ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (failures.length > 0) {
    const bulleted = failures.map((failure) => `  • ${failure}`).join('\n');
    throw new Error(`Cleanup did not complete:\n${bulleted}`);
  }
}

test.beforeEach(async ({ api }) => {
  pool = (await providePool(api)).name;
  await cleanUp(api);
  // `cleanUp` may have just exported the suite's own pool; ask again so the
  // dataset below has somewhere to go.
  pool = (await providePool(api)).name;
  await ensureUserPresent(api, owner);
});

test.afterEach(async ({ api }) => {
  if (keepTestData) {
    console.warn(
      `TN_KEEP_TEST_DATA=1 — leaving bucket "${bucket}", dataset "${pool}/${parentDataset}", `
      + `the access keys and user "${owner}", and pool "${s3OwnedPoolName}" if this run built it.`,
    );
    return;
  }
  await cleanUp(api);
});

test('an admin publishes an S3 bucket with object lock and starts the service', async ({ page, api }) => {
  const parent = `${pool}/${parentDataset}`;
  await ensureDatasetPresent(api, parent);

  await page.goto('./');

  await test.step('create the bucket from the Shares dashboard', async () => {
    await createS3BucketWithObjectLock(page, {
      name: bucket, parentDataset: parent, owner, retentionDays,
    });
  });

  // Through the API, deliberately: the screens confirmed a row appeared, and
  // this asks whether the bucket is really configured the way the form
  // promised. Versioning and the retention mode are not even visible in basic
  // mode — object lock is meant to set both — so only middleware can say.
  await test.step('confirm the bucket is locked, versioned and served', async () => {
    const created = await findS3Bucket(api, bucket);

    expect(created).toBeDefined();
    expect(created).toMatchObject({
      dataset: `${parent}/${bucket}`,
      owner,
      enabled: true,
      object_lock: true,
      versioning: 'ENABLED',
      object_lock_default_mode: 'COMPLIANCE',
      object_lock_default_days: retentionDays,
    });

    // Polled: starting a service is a job that completes after the dialog
    // closes, and a single sample would race it (R8.3). The read is caught so
    // a query cut short by the service reconfiguring counts as one attempt,
    // not as the poll aborting.
    await expect.poll(async () => {
      try {
        return (await queryS3Service(api))?.state;
      } catch {
        return undefined;
      }
    }, {
      timeout: serviceStartTimeoutMs,
      message: 'S3 service never reached RUNNING after the start dialog',
    }).toBe('RUNNING');
  });
});

test('an admin mints a non-expiring S3 access key and is shown the secret once', async ({ page, api }) => {
  await page.goto('./');

  const shown = await test.step('create the key under Credentials', async () => {
    return createS3AccessKey(page, { name: accessKey, username: owner });
  });

  await test.step('confirm the key exists for that user and matches what was shown', async () => {
    expect(shown.accessKeyId).not.toBe('');
    expect(shown.secretAccessKey).not.toBe('');

    const keys = await findS3AccessKeys(api, owner);

    expect(keys).toHaveLength(1);
    expect(keys[0]).toMatchObject({
      name: accessKey,
      username: owner,
      access_key: shown.accessKeyId,
      enabled: true,
      expires_at: null,
    });
  });
});
