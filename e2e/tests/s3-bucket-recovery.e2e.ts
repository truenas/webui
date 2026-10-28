/**
 * Stories: registering a bucket again from a dataset that still holds it.
 *
 * Deleting a bucket leaves its dataset, its objects and a config backup in place; the Recover panel on the full
 * bucket list reads that backup back. An administrator recovers a bucket deleted by mistake, and recovers two at
 * once where another bucket has since taken one's name — that one fails on its own, and comes back once renamed.
 * An administrator who instead tries to add the bucket again is offered its recovery by the Add form.
 *
 * What only an appliance can answer here: that the backup middleware writes when a bucket is saved is there to
 * find once the bucket is gone, that a recovery puts the bucket back on its own dataset under its old owner, and
 * that middleware's per-dataset answer reaches the screen — a clash refuses one row, not the request.
 *
 * The S3 service stays stopped: a recovery is configuration, and needs nothing serving it.
 */
import {
  ensureS3BucketAbsent, ensureS3BucketOrphaned, ensureS3BucketPresent, ensureS3ServiceStopped, findS3Bucket,
} from '../fixtures/s3';
import { ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { ensureUserAbsent, ensureUserPresent } from '../fixtures/users';
import {
  openS3BucketRecovery, recoverBucketFromCreator, renameBucketToRecover, selectBucketsToRecover,
  submitBucketRecovery, submitBucketRecoveryExpectingFailure,
} from '../flows/s3';
import { s3BucketLocators } from '../locators/s3';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/**
 * Names distinct from the other S3 specs', deliberately: each file's cleanup deletes its parent datasets
 * recursively and its owner by name.
 */
const owner = 'recoverowner';
const parentDataset = 'e2e_s3_recover';
/** Holds the bucket that takes the clashing name, apart from the orphans so it is never offered for recovery. */
const takerParentDataset = 'e2e_s3_recover_taker';

/** Deleted, and recovered as it was. */
const keptBucket = 'e2e-s3-recover-kept';
/** Deleted, then its name taken by another bucket before it is recovered. */
const clashingBucket = 'e2e-s3-recover-clash';
/** What the clashing bucket is recovered as. */
const renamedBucket = 'e2e-s3-recover-renamed';

const allBuckets = [keptBucket, clashingBucket, renamedBucket];

async function cleanUp(api: E2eApiClient, pool: string): Promise<void> {
  await runCleanupSteps([
    ['stop the S3 service', () => ensureS3ServiceStopped(api)],
    ...allBuckets.map((name): [string, () => Promise<void>] => [
      `remove the bucket ${name}`, () => ensureS3BucketAbsent(api, name),
    ]),
    // The orphans' datasets go with their parent, and their config backups with them — so a recovery panel
    // opened by a later run does not offer them.
    ['delete the parent dataset', () => ensureDatasetAbsent(api, `${pool}/${parentDataset}`)],
    ['delete the taker parent dataset', () => ensureDatasetAbsent(api, `${pool}/${takerParentDataset}`)],
    ['delete the owner', () => ensureUserAbsent(api, owner)],
  ]);
}

test.beforeEach(async ({ api, pool }) => {
  await cleanUp(api, pool);
  await ensureUserPresent(api, owner);
  await ensureDatasetPresent(api, `${pool}/${parentDataset}`);
});

test.afterEach(async ({ api, pool }) => {
  if (leavingTestData(`buckets ${allBuckets.join(', ')}, datasets "${parentDataset}" and `
    + `"${takerParentDataset}" and user ${owner}`)) {
    return;
  }
  await cleanUp(api, pool);
});

test('an admin recovers a deleted bucket, and it comes back on its own dataset', async ({ page, api, pool }) => {
  const keptDataset = `${pool}/${parentDataset}/${keptBucket}`;
  await ensureS3BucketOrphaned(api, { name: keptBucket, parentDataset: `${pool}/${parentDataset}`, owner });

  await openS3BucketRecovery(page, keptDataset);
  // Prefilled from the backup, which is all the panel has to go on.
  await expect(page.locator(s3BucketLocators.recover.name(keptDataset))).toHaveValue(keptBucket);
  await expect(page.locator(s3BucketLocators.recover.owner(keptDataset))).toHaveValue(owner);

  await selectBucketsToRecover(page, [keptDataset]);
  await submitBucketRecovery(page);

  // The list reloads when the panel closes.
  await expect(page.locator(s3BucketLocators.list.row(keptBucket))).toBeVisible();

  const recovered = await findS3Bucket(api, keptBucket);
  expect(recovered?.dataset, 'the bucket was not registered on the dataset it was recovered from')
    .toBe(keptDataset);
  expect(recovered?.owner).toBe(owner);
});

test('a bucket whose name was taken fails on its own and recovers once renamed', async ({ page, api, pool }) => {
  const keptDataset = `${pool}/${parentDataset}/${keptBucket}`;
  const clashingDataset = `${pool}/${parentDataset}/${clashingBucket}`;
  await ensureS3BucketOrphaned(api, { name: keptBucket, parentDataset: `${pool}/${parentDataset}`, owner });
  await ensureS3BucketOrphaned(api, { name: clashingBucket, parentDataset: `${pool}/${parentDataset}`, owner });
  await ensureDatasetPresent(api, `${pool}/${takerParentDataset}`);
  await ensureS3BucketPresent(api, { name: clashingBucket, parentDataset: `${pool}/${takerParentDataset}`, owner });

  await openS3BucketRecovery(page, clashingDataset);
  await selectBucketsToRecover(page, [keptDataset, clashingDataset]);

  await test.step('recover both: the clash is refused, the other comes back', async () => {
    await submitBucketRecoveryExpectingFailure(page, clashingDataset);

    // What came back drops out of the panel; what failed keeps its fields for the retry.
    await expect(page.locator(s3BucketLocators.recover.bucket(keptDataset))).toBeHidden();
    await expect(page.locator(s3BucketLocators.recover.name(clashingDataset))).toBeVisible();

    expect((await findS3Bucket(api, keptBucket))?.dataset).toBe(keptDataset);
    // The bucket that took the name is untouched.
    expect((await findS3Bucket(api, clashingBucket))?.dataset)
      .toBe(`${pool}/${takerParentDataset}/${clashingBucket}`);
  });

  await test.step('rename the refused bucket and recover it', async () => {
    await renameBucketToRecover(page, clashingDataset, renamedBucket);
    await submitBucketRecovery(page);

    await expect(page.locator(s3BucketLocators.list.row(renamedBucket))).toBeVisible();

    const renamed = await findS3Bucket(api, renamedBucket);
    expect(renamed?.dataset, 'the renamed bucket was not registered on the dataset it was recovered from')
      .toBe(clashingDataset);
    expect(renamed?.owner).toBe(owner);
  });
});

test('adding a bucket over a deleted one offers its recovery instead', async ({ page, api, pool }) => {
  const keptDataset = `${pool}/${parentDataset}/${keptBucket}`;
  await ensureS3BucketOrphaned(api, { name: keptBucket, parentDataset: `${pool}/${parentDataset}`, owner });

  await recoverBucketFromCreator(page, { name: keptBucket, parentDataset: `${pool}/${parentDataset}` });
  // Scoped to the one dataset, whatever else the appliance has orphaned.
  await expect(page.locator(s3BucketLocators.recover.anyBucket)).toHaveCount(1);
  await expect(page.locator(s3BucketLocators.recover.owner(keptDataset))).toHaveValue(owner);

  await submitBucketRecovery(page);

  // The dashboard card reloads once the swapped-in panel closes, as it would after a create.
  await expect(page.locator(s3BucketLocators.dashboardRowName(keptBucket))).toBeVisible();

  const recovered = await findS3Bucket(api, keptBucket);
  expect(recovered?.dataset, 'the bucket was not registered on the dataset it was recovered from')
    .toBe(keptDataset);
  expect(recovered?.owner).toBe(owner);
});
