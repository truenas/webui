/**
 * Stories: the bucket options behind Advanced Options.
 *
 * An administrator switches a bucket to the Multiprotocol permissions model,
 * and separately turns versioning on with snapshot versions, a listing cap
 * and an opaque ETag. Both start from a bucket the API created.
 *
 * What only an appliance can answer: that choosing Multiprotocol folds the
 * ownership to Object Writer on screen *and* in what middleware stores, and
 * that the versioning options the form sends are the ones that come back.
 * The unit spec mocks the fold; middleware performs it too, and the two have
 * to agree.
 */
import {
  ensureDatasetAbsent, ensureDatasetPresent, ensureS3BucketAbsent, ensureS3BucketPresent, ensureS3ServiceStopped,
  findS3Bucket,
} from '../fixtures/s3';
import { ensureUserAbsent, ensureUserPresent } from '../fixtures/users';
import {
  expectObjectOwnershipShown, openBucketEditor, saveBucketEditor, setBucketPermissionsModel,
  setBucketVersioningOptions, showAdvancedBucketOptions,
} from '../flows/s3';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Distinct from the other S3 specs' names; see `s3-bucket-management.e2e.ts`. */
const owner = 'optionsowner';
const parentDataset = 'e2e_s3_options';
const bucket = 'e2e-s3-options';

const versioning = {
  snapshotVersions: ['auto-%Y-%m-%d'],
  snapshotVersionsMax: 5,
  multipartEtag: 'MINTED',
} as const;

async function cleanUp(api: E2eApiClient, pool: string): Promise<void> {
  await runCleanupSteps([
    ['stop the S3 service', () => ensureS3ServiceStopped(api)],
    ['remove the bucket', () => ensureS3BucketAbsent(api, bucket)],
    ['delete the parent dataset', () => ensureDatasetAbsent(api, `${pool}/${parentDataset}`)],
    ['delete the owner', () => ensureUserAbsent(api, owner)],
  ]);
}

test.beforeEach(async ({ api, pool }) => {
  await cleanUp(api, pool);
  await ensureUserPresent(api, owner);
  await ensureDatasetPresent(api, `${pool}/${parentDataset}`);
  await ensureS3BucketPresent(api, { name: bucket, parentDataset: `${pool}/${parentDataset}`, owner });
});

test.afterEach(async ({ api, pool }) => {
  if (leavingTestData(`bucket "${bucket}", its datasets, and user "${owner}"`)) {
    return;
  }
  await cleanUp(api, pool);
});

test('an admin switches a bucket to Multiprotocol and object ownership follows', async ({ page, api }) => {
  await test.step('choose Multiprotocol in the bucket editor', async () => {
    await openBucketEditor(page, bucket);
    await showAdvancedBucketOptions(page);
    await setBucketPermissionsModel(page, 'MULTIPROTOCOL');
    // The fold is the form's, before anything is saved: a Multiprotocol bucket
    // can only be Object Writer, and the select says so at once.
    await expectObjectOwnershipShown(page, 'Object Writer');
    await saveBucketEditor(page);
  });

  await test.step('confirm middleware stores the folded ownership', async () => {
    const saved = await findS3Bucket(api, bucket);
    expect(saved).toMatchObject({ permissions_model: 'MULTIPROTOCOL', object_ownership: 'OBJECT_WRITER' });
  });
});

test('an admin turns on versioning with snapshot versions and an opaque ETag', async ({ page, api }) => {
  await test.step('set the versioning options in the bucket editor', async () => {
    await openBucketEditor(page, bucket);
    await showAdvancedBucketOptions(page);
    await setBucketVersioningOptions(page, versioning);
    await saveBucketEditor(page);
  });

  await test.step('confirm middleware holds them', async () => {
    const saved = await findS3Bucket(api, bucket);
    expect(saved).toMatchObject({
      versioning: 'ENABLED',
      snapshot_versions: [...versioning.snapshotVersions],
      snapshot_versions_max: versioning.snapshotVersionsMax,
      multipart_etag: versioning.multipartEtag,
    });
  });
});
