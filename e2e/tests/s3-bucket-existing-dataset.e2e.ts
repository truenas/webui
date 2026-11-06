/**
 * Story: an administrator serves a dataset SMB already shares read-write as a read-only S3 bucket ("Existing
 * Dataset (Read-only)"), then reopens the bucket's editor and its filesystem ACL.
 *
 * Only an appliance shows middleware storing the bucket with the `DATASET` layout on that dataset, with the form's
 * Multiprotocol model and Object Writer ownership and no versioning options, and the ACL editor opening on the
 * dataset itself (there's no `s3data` directory). The unit spec mocks the create; the two have to agree.
 */
import { ensureS3BucketAbsent, ensureS3ServiceStopped, findS3Bucket } from '../fixtures/s3';
import { ensureDatasetAbsent, ensureSmbDatasetPresent } from '../fixtures/storage';
import { ensureUserAbsent, ensureUserPresent } from '../fixtures/users';
import {
  closeBucketEditor, expectObjectOwnershipShown, openBucketEditor, openBucketFilesystemAcl,
  openExistingDatasetBucketCreator, saveExistingDatasetBucket, showAdvancedBucketOptions,
} from '../flows/s3';
import { permissionsLocators } from '../locators/permissions';
import { s3BucketLocators } from '../locators/s3';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Distinct from the other S3 specs' names; see `s3-bucket-management.e2e.ts`. */
const owner = 'datasetowner';
/** The dataset the bucket serves. Its own, not under a parent: the bucket takes it as it is. */
const sharedDataset = 'e2e_s3_existing';
const bucket = 'e2e-s3-existing';

async function cleanUp(api: E2eApiClient, pool: string): Promise<void> {
  await runCleanupSteps([
    ['stop the S3 service', () => ensureS3ServiceStopped(api)],
    // Deleting a bucket never touches its dataset, so the dataset goes separately and after it.
    ['remove the bucket', () => ensureS3BucketAbsent(api, bucket)],
    ['delete the dataset', () => ensureDatasetAbsent(api, `${pool}/${sharedDataset}`)],
    ['delete the owner', () => ensureUserAbsent(api, owner)],
  ]);
}

test.beforeEach(async ({ api, pool }) => {
  await cleanUp(api, pool);
  // The SMB preset stands in for a dataset another protocol already shares, and gives it the NFSv4 ACL the
  // ACL editor opens straight onto.
  await ensureSmbDatasetPresent(api, `${pool}/${sharedDataset}`);
  await ensureUserPresent(api, owner);
});

test.afterEach(async ({ api, pool }) => {
  if (leavingTestData(`bucket "${bucket}", dataset "${sharedDataset}" and user "${owner}"`)) {
    return;
  }
  await cleanUp(api, pool);
});

test('an admin serves an existing dataset read-only over S3', async ({ page, api, pool }) => {
  const dataset = `${pool}/${sharedDataset}`;
  const { form } = s3BucketLocators;

  await test.step('choose Existing Dataset, and the options it rules out go away', async () => {
    await openExistingDatasetBucketCreator(page);
    await expect(page.locator(form.objectLock)).toBeHidden();
  });

  await test.step('add the bucket on the dataset', async () => {
    await saveExistingDatasetBucket(page, { name: bucket, dataset, owner });
  });

  await test.step('confirm middleware stores it on that dataset, read-only', async () => {
    expect(await findS3Bucket(api, bucket)).toMatchObject({
      layout: 'DATASET',
      dataset,
      owner,
      permissions_model: 'MULTIPROTOCOL',
      object_ownership: 'OBJECT_WRITER',
      versioning: 'OFF',
      snapshot_versions: [],
      object_lock: false,
    });
  });

  await test.step('the editor says the dataset is served read-only and offers nothing it rules out', async () => {
    await openBucketEditor(page, bucket);
    await expect(page.locator(form.datasetField)).toContainText('Served read-only over S3.');
    await expect(page.locator(form.objectLock)).toBeHidden();

    await showAdvancedBucketOptions(page);
    await expectObjectOwnershipShown(page, 'Object Writer');
    await expect(page.locator(form.versioning)).toBeHidden();
    await expect(page.locator(form.snapshotVersions)).toBeHidden();
    await closeBucketEditor(page);
  });

  await test.step('Edit Filesystem ACL opens on the dataset itself', async () => {
    await openBucketFilesystemAcl(page, bucket);
    await expect(page.locator(permissionsLocators.aclEditor.path)).toHaveText(`/mnt/${dataset}`);
  });
});
