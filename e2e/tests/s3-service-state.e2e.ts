/**
 * Stories: the S3 service as the dashboard card shows it.
 *
 * An administrator adds a bucket while the service is already running, which
 * the app takes in its stride — no "Start S3 Service" prompt — and then stops
 * the service with the switch in the card's header. Separately, an
 * administrator sets the managed root dataset the service creates
 * protocol-made buckets under, and sees the bucket form default to it.
 *
 * Every other S3 journey starts from a stopped service; this file is the one
 * that starts from a running one, so the other branch of the post-save check
 * is exercised too, and the header switch — which nothing else touches — is
 * shown to call `service.control` for real.
 */
import {
  ensureDatasetAbsent, ensureDatasetPresent, ensureS3BucketAbsent, ensureS3BucketPresent, ensureS3ServiceRunning,
  ensureS3ServiceStopped, queryS3Service, readS3Config, setS3ManagedRootDataset,
} from '../fixtures/s3';
import { ensureUserAbsent, ensureUserPresent } from '../fixtures/users';
import {
  closeBucketPanel, createS3BucketWithObjectLock, openBucketCreator, readBucketParentDataset,
  setS3ManagedRootDatasetFromCard, toggleS3ServiceFromCard,
} from '../flows/s3';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const owner = 'stateowner';
const parentDataset = 'e2e_s3_state';
/** Created over the API, so the service has something to serve before it is started. */
const firstBucket = 'e2e-s3-first';
/** Created through the UI while the service runs. */
const secondBucket = 'e2e-s3-second';
const managedRoot = 'e2e_s3_root';
const retentionDays = 7;

/** How long `service.control` gets to land after the header switch. */
const serviceStopTimeoutMs = 60_000;

async function cleanUp(api: E2eApiClient, pool: string): Promise<void> {
  await runCleanupSteps([
    ['stop the S3 service', () => ensureS3ServiceStopped(api)],
    ['clear the managed root dataset', () => setS3ManagedRootDataset(api, '')],
    ['remove the second bucket', () => ensureS3BucketAbsent(api, secondBucket)],
    ['remove the first bucket', () => ensureS3BucketAbsent(api, firstBucket)],
    ['delete the parent dataset', () => ensureDatasetAbsent(api, `${pool}/${parentDataset}`)],
    ['delete the managed root dataset', () => ensureDatasetAbsent(api, `${pool}/${managedRoot}`)],
    ['delete the owner', () => ensureUserAbsent(api, owner)],
  ]);
}

test.beforeEach(async ({ api, pool }) => {
  await cleanUp(api, pool);
  await ensureUserPresent(api, owner);
  await ensureDatasetPresent(api, `${pool}/${parentDataset}`);
});

test.afterEach(async ({ api, pool }) => {
  if (leavingTestData(`buckets "${firstBucket}" and "${secondBucket}", their datasets, and user "${owner}"`)) {
    return;
  }
  await cleanUp(api, pool);
});

test('an admin adds a bucket to a running service and stops it from the card', async ({ page, api, pool }) => {
  const parent = `${pool}/${parentDataset}`;
  await ensureS3BucketPresent(api, { name: firstBucket, parentDataset: parent, owner });
  await ensureS3ServiceRunning(api);

  await test.step('create a bucket without being offered to start the service', async () => {
    await createS3BucketWithObjectLock(page, {
      name: secondBucket, parentDataset: parent, owner, retentionDays,
    }, { serviceRunning: true });
  });

  await test.step('stop the service with the card header switch', async () => {
    await toggleS3ServiceFromCard(page);

    // Polled: the switch fires a job and the card re-reads the state after it.
    await expect.poll(async () => {
      try {
        return (await queryS3Service(api))?.state;
      } catch {
        return undefined;
      }
    }, {
      timeout: serviceStopTimeoutMs,
      message: 'S3 service never reached STOPPED after the header switch',
    }).toBe('STOPPED');
  });
});

test('an admin sets the managed root dataset and new buckets default to it', async ({ page, api, pool }) => {
  const root = `${pool}/${managedRoot}`;
  // Middleware never creates the root; it has to exist before it is named.
  await ensureDatasetPresent(api, root);

  const service = await queryS3Service(api);
  if (!service) {
    throw new Error('The S3 service row is missing, so this appliance has no S3 to configure.');
  }

  await test.step('name the dataset in the service configuration', async () => {
    await setS3ManagedRootDatasetFromCard(page, service.id, root);
    expect((await readS3Config(api)).managed_root_dataset).toBe(root);
  });

  // The bucket form reads the service configuration when it opens and offers
  // the managed root as the parent, which is the whole point of naming one.
  await test.step('see it offered as the parent of a new bucket', async () => {
    await openBucketCreator(page);
    await expect.poll(() => readBucketParentDataset(page)).toBe(root);
    await closeBucketPanel(page);
  });
});
