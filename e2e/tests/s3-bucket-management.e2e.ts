/**
 * Stories: looking after a bucket that already exists.
 *
 * An administrator grants a user and a group access to a bucket, disables a
 * bucket from the dashboard, and deletes one. Each starts from a bucket the
 * API created — creating it through the UI is `s3.e2e.ts`'s story, and a
 * broken bucket form should not read as a broken row menu.
 *
 * What only an appliance can answer here: that the principal pickers list the
 * real accounts, that a saved grant comes back with the uid and gid middleware
 * resolved, that the row toggle's `sharing.s3.update` took, and that deleting
 * a bucket leaves its dataset in place — the promise the delete dialog makes.
 */
import { firstValueFrom, timeout } from 'rxjs';
import {
  ensureDatasetAbsent, ensureDatasetPresent, ensureS3AccessKeysAbsent, ensureS3BucketAbsent,
  ensureS3BucketPresent, ensureS3ServiceStopped, findS3Bucket, s3PoolLifecycle,
} from '../fixtures/s3';
import {
  ensureGroupAbsent, ensureGroupPresent, ensureUserAbsent, ensureUserPresent,
} from '../fixtures/users';
import {
  addBucketGrant, deleteBucketFromDashboard, openBucketEditor, saveSidePanel, showAdvancedBucketOptions,
  toggleBucketEnabled,
} from '../flows/s3';
import type { E2eApiClient } from '../support/api/client';
import { runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';
import { readTimeoutMs } from '../support/timeouts';

const owner = 'bucketowner';
/** A second account, so the grant is to someone other than the owner. */
const reader = 'bucketreader';
const group = 'bucketgroup';
const parentDataset = 'e2e_s3';
const bucket = 'e2e-s3-managed';

const keepTestData = process.env.TN_KEEP_TEST_DATA === '1';

/** How long the toggle's `sharing.s3.update` gets to land. */
const updateTimeoutMs = 30_000;

const s3Pool = s3PoolLifecycle();

/** The pool the parent dataset lives under, resolved in `beforeEach`. */
let pool: string;

async function cleanUp(api: E2eApiClient): Promise<void> {
  await runCleanupSteps([
    ['stop the S3 service', () => ensureS3ServiceStopped(api)],
    ['remove the access keys', () => ensureS3AccessKeysAbsent(api, owner)],
    ['remove the bucket', () => ensureS3BucketAbsent(api, bucket)],
    ['delete the parent dataset', async () => {
      if (pool) {
        await ensureDatasetAbsent(api, `${pool}/${parentDataset}`);
      }
    }],
    ['delete the group', () => ensureGroupAbsent(api, group)],
    ['delete the reader', () => ensureUserAbsent(api, reader)],
    ['delete the owner', () => ensureUserAbsent(api, owner)],
  ]);
}

test.beforeEach(async ({ api }) => {
  pool = await s3Pool.provide(api);
  await cleanUp(api);
  await ensureUserPresent(api, owner);
  await ensureUserPresent(api, reader);
  await ensureGroupPresent(api, group);
  await ensureDatasetPresent(api, `${pool}/${parentDataset}`);
  await ensureS3BucketPresent(api, { name: bucket, parentDataset: `${pool}/${parentDataset}`, owner });
});

test.afterEach(async ({ api }) => {
  if (keepTestData) {
    console.warn(`TN_KEEP_TEST_DATA=1 — leaving bucket "${bucket}", its datasets, and the accounts.`);
    return;
  }
  await cleanUp(api);
});

test.afterAll(async ({ api }) => {
  await s3Pool.release(api, keepTestData);
});

test('an admin grants a user and a group access to a bucket', async ({ page, api }) => {
  await test.step('add the grants in the bucket editor', async () => {
    await openBucketEditor(page, bucket);
    await showAdvancedBucketOptions(page);
    await addBucketGrant(page, { principalType: 'USER', principal: reader, access: 'READONLY' });
    await addBucketGrant(page, { principalType: 'GROUP', principal: group, access: 'READWRITE' });
    await saveSidePanel(page);
  });

  // The pickers show names; middleware stores ids. Whether the two line up is
  // exactly what the mocked unit spec cannot check.
  await test.step('confirm the grants name the right principals', async () => {
    const [readerAccount] = await firstValueFrom(
      api.api.query('user.query', [['username', '=', reader]]).pipe(timeout(readTimeoutMs)),
    );
    const [groupAccount] = await firstValueFrom(
      api.api.query('group.query', [['group', '=', group]]).pipe(timeout(readTimeoutMs)),
    );
    const saved = await findS3Bucket(api, bucket);

    expect(saved?.grants).toEqual(expect.arrayContaining([
      expect.objectContaining({ principal_type: 'USER', xid: readerAccount?.uid, access: 'READONLY' }),
      expect.objectContaining({ principal_type: 'GROUP', xid: groupAccount?.gid, access: 'READWRITE' }),
    ]));
    expect(saved?.grants).toHaveLength(2);
  });
});

test('an admin disables a bucket from the dashboard', async ({ page, api }) => {
  await toggleBucketEnabled(page, bucket);

  // The toggle fires `sharing.s3.update` and reloads the list; polled because
  // the row flips before the call returns (the cell reverts on error).
  await expect.poll(async () => (await findS3Bucket(api, bucket))?.enabled, {
    timeout: updateTimeoutMs,
    message: 'the bucket was not disabled after the row toggle',
  }).toBe(false);
});

test('an admin deletes a bucket and its data stays', async ({ page, api }) => {
  await deleteBucketFromDashboard(page, bucket);

  expect(await findS3Bucket(api, bucket)).toBeUndefined();

  // The delete dialog promises the dataset and every object in it are left in
  // place. Middleware keeping that promise is the part worth checking.
  const [dataset] = await firstValueFrom(
    api.api.query('pool.dataset.query', [['id', '=', `${pool}/${parentDataset}/${bucket}`]])
      .pipe(timeout(readTimeoutMs)),
  );
  expect(dataset, 'deleting the bucket removed its dataset, which the dialog says it leaves').toBeDefined();
});
