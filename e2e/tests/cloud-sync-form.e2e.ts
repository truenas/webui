/**
 * Stories: the full cloud sync form, reached from the wizard's Advanced Options. An admin dry-runs
 * a task that was never saved, and cannot until the form is complete. And an admin points an S3
 * credential at the appliance's own S3 service, then saves a push task to a bucket picked from the
 * form's list.
 *
 * The form's Dry Run is not the card's: it sends the unsaved task to `cloudsync.sync_onetime`
 * rather than a saved one's id to `cloudsync.sync` (`cloud-sync-tasks.e2e.ts` covers that one), so
 * `core.get_jobs` is where a run that really happened shows up, and `cloudsync.query` is where
 * nothing having been saved does.
 *
 * The S3 remote is this appliance too. With no listeners configured the S3 service serves plain
 * HTTP on port 9000 on every address, and rclone runs on the appliance, so `127.0.0.1:9000` reaches
 * it with no certificate involved. The bucket select is filled from `cloudsync.list_buckets` over
 * that credential and falls back to a free-text input when the call fails, so which of the two
 * renders is the UI's own report of whether it worked.
 *
 * The access key's secret is typed into the page, so it lands in a published trace. It is minted
 * per test and deleted after it, so nothing still valid outlives the job (see `e2e/CLAUDE.md`).
 */
import {
  countCloudCredentials,
  ensureCloudCredentialAbsent,
  ensureS3CloudCredentialPresent,
  findCloudCredential,
  listCloudCredentialBuckets,
  s3Fields,
} from '../fixtures/cloud-credentials';
import {
  cloudSyncRunTimeoutMs,
  countCloudSyncTasks,
  ensureCloudSyncTasksAbsent,
  ensureLoopbackSftpCredentialAbsent,
  ensureLoopbackSftpCredentialPresent,
  findCloudSyncOnetimeJobIds,
  findCloudSyncOnetimeRuns,
  findCloudSyncTask,
  findCloudSyncTasks,
  findFileNames,
  findRemoteFileNames,
  loopbackCredentialName,
  loopbackProviderLabel,
  runCloudSyncTask,
  writeFileOnAppliance,
} from '../fixtures/cloud-sync';
import {
  ensureS3AccessKeysAbsent,
  ensureS3BucketAbsent,
  ensureS3BucketPresent,
  ensureS3ServiceRunning,
  ensureS3ServiceStopped,
  provisionS3AccessKey,
  readS3Config,
  resetS3ListenersAndCertificate,
  restoreS3Config,
  type S3ConfigEntry,
} from '../fixtures/s3';
import { datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { ensureUserAbsent, ensureUserPresent } from '../fixtures/users';
import {
  cloudCredentialCardPageSize,
  fillS3Credential,
  openAddCloudCredentialForm,
  saveCloudCredentialForm,
  verifyCloudCredential,
} from '../flows/cloud-credentials';
import {
  cloudSyncCardPageSize,
  discardCloudSyncForm,
  dryRunCloudSyncForm,
  fillCloudSyncFormPush,
  openCloudSyncAdvancedForm,
  saveCloudSyncForm,
} from '../flows/cloud-sync';
import { cloudCredentialLocators } from '../locators/cloud-credentials';
import { cloudSyncLocators } from '../locators/cloud-sync';
import { errorDialogLocators } from '../locators/dialogs';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Verify's answer is the only signal the form gives for a valid credential — see `verifyCloudCredential`. */
test.use({ recordApiCalls: true });

/** Typed into the form and dry-run, never saved — that nothing is saved is the claim. */
const dryRunDescription = 'E2E cloud sync form dry run';
/** Saved through the form, never over the API. */
const s3TaskDescription = 'E2E cloud sync form s3 push';
const allDescriptions = [dryRunDescription, s3TaskDescription];

/** Made through the credential form in one test, and over the API in the other. */
const s3CredentialName = 'e2e-cloudsync-form-s3';
/** How the credential select and the card name the provider: its title from `cloudsync.providers`. */
const s3ProviderLabel = 'Amazon S3';
/** The appliance's own S3 service, plain HTTP, as rclone on the appliance reaches it. */
const s3Endpoint = 'http://127.0.0.1:9000';
/** The same endpoint as middleware stores it: the form sends it as typed, and it is saved with a trailing slash. */
const s3StoredEndpoint = 'http://127.0.0.1:9000/';

/** Distinct from the other S3 specs' owners, so no spec's cleanup removes another's user. */
const s3Owner = 'cloudsyncs3owner';
const s3AccessKeyName = 'e2e-cloudsync-form-key';
const s3Bucket = 'e2e-cloudsync-form-bucket';
/** The folder in the bucket a push lands in, typed into the form. */
const s3Folder = '/e2e-push';

const sourceLeaf = 'e2e_cloudsync_form_src';
/** The "remote" of the dry run: a folder on the loopback SFTP host, which is this appliance. */
const remoteLeaf = 'e2e_cloudsync_form_remote';
const s3ParentLeaf = 'e2e_cloudsync_form_s3';
const allLeaves = [sourceLeaf, remoteLeaf];

const seededFile = 'e2e-cloudsync-form.txt';

/** The service configuration as `beforeEach` found it, written back after each test. */
let s3ConfigBefore: S3ConfigEntry | undefined;

/** As in `cloud-sync-tasks.e2e.ts`: fails up front when the card cannot show the row a test adds. */
async function requireRoomOnCard(api: E2eApiClient, adding: number): Promise<void> {
  const existing = await countCloudSyncTasks(api);
  expect(
    existing + adding <= cloudSyncCardPageSize,
    `the card lists ${cloudSyncCardPageSize} tasks, this test adds ${adding}, the appliance has ${existing}`,
  ).toBe(true);
}

/**
 * Everything the S3 tests stand on, over the API: a user who owns a bucket and an access key, and
 * the service running with no listeners, which is what makes it serve plain HTTP on port 9000.
 * Started only once the bucket exists — see `ensureS3ServiceRunning`. Returns the key's two halves.
 */
async function setUpS3(api: E2eApiClient, pool: string): Promise<{ accessKeyId: string; secretAccessKey: string }> {
  await ensureUserPresent(api, s3Owner);
  await ensureDatasetPresent(api, `${pool}/${s3ParentLeaf}`);
  await ensureS3BucketPresent(api, { name: s3Bucket, parentDataset: `${pool}/${s3ParentLeaf}`, owner: s3Owner });
  const key = await provisionS3AccessKey(api, { name: s3AccessKeyName, username: s3Owner });
  // Nullable by design (redacted without SHARING_S3_WRITE). Without it there is nothing to sign in with.
  if (!key.secret) {
    throw new Error('middleware returned no secret for the access key, so no credential can sign in with it.');
  }
  await resetS3ListenersAndCertificate(api);
  await ensureS3ServiceRunning(api);

  return { accessKeyId: key.access_key, secretAccessKey: key.secret };
}

/**
 * In the order the ticket's teardown gives: tasks before the credential they use, the credential,
 * the service stopped before its configuration and its bucket go, the bucket before its owner's
 * keys and datasets, and the owner last. Each its own step, so one that fails does not keep the
 * rest from running.
 */
async function cleanUp(api: E2eApiClient, pool: string): Promise<void> {
  const s3Parent = `${pool}/${s3ParentLeaf}`;

  await runCleanupSteps([
    ...allDescriptions.map((description): [string, () => Promise<void>] => [
      `remove the cloud sync tasks "${description}"`, () => ensureCloudSyncTasksAbsent(api, description),
    ]),
    [`remove the cloud credential "${s3CredentialName}"`, () => ensureCloudCredentialAbsent(api, s3CredentialName)],
    // Other S3 specs depend on finding the service stopped and not starting at boot.
    ['stop the S3 service', () => ensureS3ServiceStopped(api)],
    ['restore the S3 service configuration', async () => {
      if (s3ConfigBefore) {
        await restoreS3Config(api, s3ConfigBefore);
      }
    }],
    [`remove the bucket "${s3Bucket}"`, () => ensureS3BucketAbsent(api, s3Bucket)],
    [`remove ${s3Owner}'s access keys`, () => ensureS3AccessKeysAbsent(api, s3Owner)],
    [`remove the dataset "${s3Parent}/${s3Bucket}"`, () => ensureDatasetAbsent(api, `${s3Parent}/${s3Bucket}`)],
    [`remove the dataset "${s3Parent}"`, () => ensureDatasetAbsent(api, s3Parent)],
    ...allLeaves.map((leaf): [string, () => Promise<void>] => [
      `remove the dataset "${pool}/${leaf}"`, () => ensureDatasetAbsent(api, `${pool}/${leaf}`),
    ]),
    [`delete the user "${s3Owner}"`, () => ensureUserAbsent(api, s3Owner)],
  ]);
}

/** As in `cloud-sync-tasks.e2e.ts`: the loopback credential is the file's, not any one test's. */
test.beforeAll(async ({ api }) => {
  for (const description of allDescriptions) {
    await ensureCloudSyncTasksAbsent(api, description);
  }
  await ensureLoopbackSftpCredentialPresent(api);
});

test.beforeEach(async ({ api, pool }) => {
  s3ConfigBefore ??= await readS3Config(api);
  await cleanUp(api, pool);
  for (const leaf of allLeaves) {
    await ensureDatasetPresent(api, `${pool}/${leaf}`);
  }
});

test.afterEach(async ({ api, pool }) => {
  if (leavingTestData(`the cloud sync tasks, the credential "${s3CredentialName}", the bucket "${s3Bucket}", `
    + `its owner "${s3Owner}" and the datasets under ${pool}`)) {
    return;
  }

  await cleanUp(api, pool);
});

test.afterAll(async ({ api }) => {
  if (leavingTestData(`the SFTP credential "${loopbackCredentialName}", its keypair and root's key`)) {
    return;
  }

  await runCleanupSteps([
    ...allDescriptions.map((description): [string, () => Promise<void>] => [
      `remove the cloud sync tasks "${description}"`, () => ensureCloudSyncTasksAbsent(api, description),
    ]),
    ['remove the loopback SFTP credential', () => ensureLoopbackSftpCredentialAbsent(api)],
  ]);
});

test('a dry run from the Add form runs the unsaved task, and saves and copies nothing', async ({ page, api, pool }) => {
  const source = datasetMountPath(`${pool}/${sourceLeaf}`);
  const remote = datasetMountPath(`${pool}/${remoteLeaf}`);
  await writeFileOnAppliance(api, source, seededFile);
  const tasksBefore = await countCloudSyncTasks(api);
  const earlierJobs = await findCloudSyncOnetimeJobIds(api);

  await openCloudSyncAdvancedForm(page);
  await fillCloudSyncFormPush(page, {
    path: source,
    credential: { name: loopbackCredentialName, provider: loopbackProviderLabel },
    remoteFolder: remote,
    description: dryRunDescription,
  });
  await dryRunCloudSyncForm(page);

  // rclone names each file it would have copied, so `named` is what tells a dry run that saw the
  // file from one that found nothing. Polled with the state: middleware reports SUCCESS first and
  // attaches the log in a later update.
  await expect.poll(
    async () => (await findCloudSyncOnetimeRuns(api, earlierJobs)).map((run) => ({
      state: run.state,
      dryRun: run.dryRun,
      description: run.description,
      named: run.logs.includes(seededFile),
    })),
    { timeout: cloudSyncRunTimeoutMs },
  ).toEqual([{
    state: 'SUCCESS', dryRun: true, description: dryRunDescription, named: true,
  }]);
  // A dry run neither saves the task nor copies anything: the same push run for real would.
  expect(await countCloudSyncTasks(api)).toBe(tasksBefore);
  expect(await findCloudSyncTasks(api, dryRunDescription)).toEqual([]);
  expect(await findFileNames(api, remote)).toEqual([]);

  await discardCloudSyncForm(page);
  expect(await findCloudSyncTasks(api, dryRunDescription)).toEqual([]);
});

test('Dry Run stays disabled while the form is incomplete', async ({ page, api, pool }) => {
  const { form } = cloudSyncLocators;
  const tasksBefore = await countCloudSyncTasks(api);
  const earlierJobs = await findCloudSyncOnetimeJobIds(api);

  await openCloudSyncAdvancedForm(page);
  // Everything the dry run above had except Description, which the form requires and never fills itself.
  await fillCloudSyncFormPush(page, {
    path: datasetMountPath(`${pool}/${sourceLeaf}`),
    credential: { name: loopbackCredentialName, provider: loopbackProviderLabel },
    remoteFolder: datasetMountPath(`${pool}/${remoteLeaf}`),
  });
  await expect(page.locator(form.dryRun)).toBeDisabled();
  await expect(page.locator(form.save)).toBeDisabled();

  // Description is the only thing missing, so filling it is what enables both.
  await page.locator(form.description).fill(dryRunDescription);
  await expect(page.locator(form.dryRun)).toBeEnabled();
  await expect(page.locator(form.save)).toBeEnabled();

  await discardCloudSyncForm(page);

  expect(await findCloudSyncOnetimeRuns(api, earlierJobs)).toEqual([]);
  expect(await countCloudSyncTasks(api)).toBe(tasksBefore);
  expect(await findCloudSyncTasks(api, dryRunDescription)).toEqual([]);
});

test('an admin adds an S3 credential pointed at the appliance\'s own S3 service, and Verify accepts it', async ({
  page, api, pool,
}) => {
  const key = await setUpS3(api, pool);
  const credentialsBefore = await countCloudCredentials(api);
  expect(
    credentialsBefore + 1 <= cloudCredentialCardPageSize,
    `the card lists ${cloudCredentialCardPageSize} credentials, the appliance has ${credentialsBefore}`,
  ).toBe(true);

  await openAddCloudCredentialForm(page);
  await fillS3Credential(page, { name: s3CredentialName, ...key, endpoint: s3Endpoint });
  // A refused Verify raises the error dialog; an accepted one only a toast with no id.
  await verifyCloudCredential(page);
  await expect(page.locator(errorDialogLocators.title)).toHaveCount(0);
  await saveCloudCredentialForm(page);

  await expect(page.locator(cloudCredentialLocators.card.name(s3CredentialName))).toHaveText(s3CredentialName);
  await expect(page.locator(cloudCredentialLocators.card.provider(s3CredentialName))).toHaveText(s3ProviderLabel);

  expect(s3Fields(await findCloudCredential(api, s3CredentialName))).toMatchObject({
    type: 'S3',
    access_key_id: key.accessKeyId,
    endpoint: s3StoredEndpoint,
  });
});

test('a push task to that bucket, with the bucket picked from the list, saves and syncs', async ({
  page, api, pool,
}) => {
  const { form, card } = cloudSyncLocators;
  const source = datasetMountPath(`${pool}/${sourceLeaf}`);
  await requireRoomOnCard(api, 1);
  const key = await setUpS3(api, pool);
  const credentialId = await ensureS3CloudCredentialPresent(api, {
    name: s3CredentialName, ...key, endpoint: s3Endpoint,
  });
  await writeFileOnAppliance(api, source, seededFile);
  // What the select's option holds is the bucket's `Path`, which only the same call can say.
  const listed = (await listCloudCredentialBuckets(api, credentialId)).find((bucket) => bucket.Name === s3Bucket);
  expect(listed, `cloudsync.list_buckets does not list "${s3Bucket}"`).toBeDefined();

  await openCloudSyncAdvancedForm(page);
  // The select rendering, and not the free-text fallback, is the form saying `list_buckets` worked.
  await fillCloudSyncFormPush(page, {
    path: source,
    credential: { name: s3CredentialName, provider: s3ProviderLabel },
    bucket: s3Bucket,
    remoteFolder: s3Folder,
    description: s3TaskDescription,
  });
  await expect(page.locator(form.bucket)).toContainText(s3Bucket);
  await expect(page.locator(form.bucketInput)).toHaveCount(0);
  // The schedule is left at the form's default, Daily at midnight. A run that crossed midnight would
  // only add one more sync of the same file.
  await saveCloudSyncForm(page);

  await expect(page.locator(card.description(s3TaskDescription))).toHaveText(s3TaskDescription);

  const task = await findCloudSyncTask(api, s3TaskDescription);
  expect(task).toMatchObject({
    direction: 'PUSH',
    credentials: { id: credentialId },
    path: source,
    attributes: { bucket: listed?.Path, folder: s3Folder },
  });

  // Saving does not sync. Running it over the API checks that what the form saved really does, and
  // the bucket's own listing — through the same credential — is what says the file arrived. The
  // bucket is made empty for each test, so the file there can only be this run's.
  if (!task) {
    throw new Error(`no task "${s3TaskDescription}" was saved`);
  }
  await runCloudSyncTask(api, task.id);
  expect(await findRemoteFileNames(api, task)).toEqual([seededFile]);
});
