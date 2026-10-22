/**
 * Stories: the bucket options behind Advanced Options.
 *
 * An administrator switches a bucket to the Multiprotocol permissions model,
 * and separately turns versioning on with snapshot versions, a listing cap
 * and an opaque ETag, and on a bucket already versioned forces it back off.
 * All three start from a bucket the API created.
 *
 * What only an appliance can answer: that choosing Multiprotocol folds the
 * ownership to Object Writer on screen *and* in what middleware stores, and
 * that the versioning options the form sends are the ones that come back.
 * The unit spec mocks the fold; middleware performs it too, and the two have
 * to agree.
 */
import { entitlementFeature, isEntitled } from '../fixtures/entitlements';
import {
  ensureS3BucketAbsent, ensureS3BucketPresent, ensureS3ServiceStopped,
  findS3Bucket,
} from '../fixtures/s3';
import { ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { ensureUserAbsent, ensureUserPresent } from '../fixtures/users';
import {
  confirmForceDisableBucketVersioning, expectBucketVersioningOffRefused, expectObjectOwnershipShown, openBucketEditor,
  openForceDisableBucketVersioning, saveBucketEditor, setBucketPermissionsModel, setBucketVersioningOptions,
  showAdvancedBucketOptions,
} from '../flows/s3';
import { confirmDialogLocators } from '../locators/dialogs';
import { s3BucketLocators } from '../locators/s3';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Distinct from the other S3 specs' names; see `s3-bucket-management.e2e.ts`. */
const owner = 'optionsowner';
const parentDataset = 'e2e_s3_options';
const bucket = 'e2e-s3-options';

const versioning = {
  snapshotVersions: ['auto-*'],
  snapshotVersionsMax: 5,
  multipartEtag: 'MINTED',
} as const;

async function cleanUp(api: E2eApiClient, pool: string): Promise<void> {
  await runCleanupSteps([
    ['stop the S3 service', () => ensureS3ServiceStopped(api)],
    ['remove the bucket', () => ensureS3BucketAbsent(api, bucket)],
    ['delete the parent dataset', () => ensureDatasetAbsent(api, `${pool}/${parentDataset}`)],
  ]);
}

/** After `cleanUp`, so no bucket is left that names the owner. */
async function removeOwner(api: E2eApiClient): Promise<void> {
  await runCleanupSteps([
    ['delete the owner', () => ensureUserAbsent(api, owner)],
  ]);
}

// The owner is created once for the file: it only owns the bucket here, and it
// costs middleware about a second to create and another to delete. A failed
// test restarts the worker, which runs `afterAll` and then this again, so a
// retry still starts from a fresh owner.
test.beforeAll(async ({ api, pool }) => {
  await cleanUp(api, pool);
  await removeOwner(api);
  await ensureUserPresent(api, owner);
});

test.beforeEach(async ({ api, pool }) => {
  await cleanUp(api, pool);
  await ensureDatasetPresent(api, `${pool}/${parentDataset}`);
  await ensureS3BucketPresent(api, { name: bucket, parentDataset: `${pool}/${parentDataset}`, owner });
});

test.afterEach(async ({ api, pool }) => {
  if (leavingTestData(`bucket "${bucket}" and its datasets`)) {
    return;
  }
  await cleanUp(api, pool);
});

test.afterAll(async ({ api }) => {
  if (leavingTestData(`user "${owner}"`)) {
    return;
  }
  await removeOwner(api);
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

test('an admin turns on versioning with snapshot versions and an opaque ETag', async ({
  page, api, entitlements,
}) => {
  // Without `S3_VERSIONING` the UI renders the Versioning section dimmed and inert with a Premium
  // tag, so the select this drives is not clickable. See `fixtures/entitlements.ts`.
  test.skip(
    !isEntitled(entitlements, entitlementFeature.s3Versioning),
    'This appliance is not entitled to S3_VERSIONING, so the UI locks the Versioning section.',
  );

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

test('an admin force-disables versioning on a versioned bucket', async ({
  page, api, pool, entitlements,
}) => {
  // Seeding versioning needs the entitlement as well, so the skip comes first. See the test above.
  test.skip(
    !isEntitled(entitlements, entitlementFeature.s3Versioning),
    'This appliance is not entitled to S3_VERSIONING, so versioning cannot be turned on to turn off.',
  );

  const { form } = s3BucketLocators;
  await ensureS3BucketPresent(api, {
    name: bucket,
    parentDataset: `${pool}/${parentDataset}`,
    owner,
    versioning: 'ENABLED',
    snapshotVersions: [...versioning.snapshotVersions],
  });
  // Read before, so OFF and the cleared patterns afterwards are the button's doing.
  const before = await findS3Bucket(api, bucket);
  expect(before).toMatchObject({ versioning: 'ENABLED', snapshot_versions: [...versioning.snapshotVersions] });

  await test.step('the editor refuses Off and offers the forced way instead', async () => {
    await openBucketEditor(page, bucket);
    await showAdvancedBucketOptions(page);
    await expectBucketVersioningOffRefused(page);
    await expect(page.locator(form.versioningField)).toContainText('Versioning cannot be turned off');
  });

  await test.step('force versioning off through its confirm', async () => {
    await openForceDisableBucketVersioning(page);
    await expect(page.locator(confirmDialogLocators.title)).toContainText(
      `Force disable versioning on "${bucket}"?`,
    );
    await expect(page.locator(confirmDialogLocators.confirm)).toHaveText('Force Disable');
    await confirmForceDisableBucketVersioning(page);
  });

  await test.step('confirm middleware turned it off, and nothing asked about the service', async () => {
    expect(await findS3Bucket(api, bucket)).toMatchObject({
      versioning: 'OFF',
      snapshot_versions: [],
      // Not touched by the call: only the patterns are cleared.
      snapshot_versions_max: before?.snapshot_versions_max,
    });
    // A backstop rather than a proof: Save raises this as the editor closes, so by the
    // time the read above has returned a prompt here would already be on screen.
    // Middleware re-renders and restarts S3 on this call; cleanup stops the service
    // first either way.
    await expect(page.locator(s3BucketLocators.doNotStartService)).toBeHidden();
  });
});
