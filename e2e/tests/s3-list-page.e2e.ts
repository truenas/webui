/**
 * Stories: the full S3 bucket list, reached from the title of the Object
 * Storage (S3) Buckets card on the Shares dashboard.
 *
 * The list shows columns the card does not — the bucket's dataset among them —
 * and has a search over name, dataset and owner, which filters nothing until
 * the rows have loaded. Its row tag goes through lodash, unlike the card's; see
 * `locators/s3.ts`.
 *
 * The S3 service stays stopped: a bucket is configuration, and deleting one
 * needs nothing serving it.
 */
import {
  ensureS3BucketAbsent, ensureS3BucketPresent, ensureS3ServiceStopped, findS3Bucket,
} from '../fixtures/s3';
import { ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { ensureUserAbsent, ensureUserPresent } from '../fixtures/users';
import { confirmTaskDelete, searchTaskList } from '../flows/data-protection';
import { openS3BucketList } from '../flows/s3';
import { s3BucketLocators } from '../locators/s3';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/**
 * Names distinct from the other S3 specs', deliberately: each file's cleanup
 * deletes its parent dataset recursively and its owner by name.
 */
const owner = 'pageowner';
const parentDataset = 'e2e_s3_page';
const targetBucket = 'e2e-s3-page-target';
const bystanderBucket = 'e2e-s3-page-bystander';

const allBuckets = [targetBucket, bystanderBucket];

async function cleanUp(api: E2eApiClient, pool: string): Promise<void> {
  await runCleanupSteps([
    ['stop the S3 service', () => ensureS3ServiceStopped(api)],
    ...allBuckets.map((name): [string, () => Promise<void>] => [
      `remove the bucket ${name}`, () => ensureS3BucketAbsent(api, name),
    ]),
    ['delete the parent dataset', () => ensureDatasetAbsent(api, `${pool}/${parentDataset}`)],
    ['delete the owner', () => ensureUserAbsent(api, owner)],
  ]);
}

test.beforeEach(async ({ api, pool }) => {
  await cleanUp(api, pool);
});

test.afterEach(async ({ api, pool }) => {
  if (leavingTestData(`buckets ${allBuckets.join(', ')}, dataset "${parentDataset}" and user ${owner}`)) {
    return;
  }

  await cleanUp(api, pool);
});

test('the S3 card title opens the full bucket list, where search narrows and Delete removes the bucket that was picked', async ({
  page,
  api,
  pool,
}) => {
  await ensureUserPresent(api, owner);
  await ensureDatasetPresent(api, `${pool}/${parentDataset}`);
  for (const name of allBuckets) {
    await ensureS3BucketPresent(api, { name, parentDataset: `${pool}/${parentDataset}`, owner });
  }

  const { list } = s3BucketLocators;
  await openS3BucketList(page);

  // Waited on before typing: the search matches nothing until the rows are in.
  await expect(page.locator(list.row(targetBucket))).toBeVisible();
  await expect(page.locator(list.row(bystanderBucket))).toBeVisible();
  await expect(page.locator(list.dataset(targetBucket))).toHaveText(`${pool}/${parentDataset}/${targetBucket}`);

  await searchTaskList(page, 'page-target');
  await expect(page.locator(list.row(targetBucket))).toBeVisible();
  await expect(page.locator(list.row(bystanderBucket))).toBeHidden();

  await page.locator(list.menu(targetBucket)).click();
  await page.locator(list.delete(targetBucket)).click();
  await confirmTaskDelete(page, list.row(targetBucket));

  expect(await findS3Bucket(api, targetBucket)).toBeUndefined();
  expect(await findS3Bucket(api, bystanderBucket)).toBeDefined();
});
