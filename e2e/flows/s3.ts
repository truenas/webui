/**
 * S3 bucket and access key creation, driven through the UI.
 */
import { expect, type Page } from '@playwright/test';
import { goToS3AccessKeys, goToShares } from './navigation';
import { s3AccessKeyLocators, s3BucketLocators } from '../locators/s3';

/** Saving a bucket creates its dataset and reconfigures the service; not instant. */
const saveTimeoutMs = 90_000;

/**
 * Picks an account in an `ix-user-picker`.
 *
 * The picker is an autocomplete over a middleware query, so the option is not
 * in the DOM until the typed text has been sent and answered. Typing the whole
 * username narrows the list to it (plus the picker's own "Add New" entry), and
 * clicking the option is what commits the value — the text alone does not.
 */
async function pickUser(page: Page, input: string, option: string, username: string): Promise<void> {
  await page.locator(input).fill(username);
  await page.locator(option).click();
}

export interface NewS3Bucket {
  name: string;
  /** Dataset name, `pool/parent`; the bucket gets `pool/parent/<name>`. */
  parentDataset: string;
  owner: string;
  /** Default retention period of the object lock rule, in days. */
  retentionDays: number;
}

/**
 * Creates a bucket with object lock from the Shares dashboard, and starts the
 * S3 service when the app offers to.
 *
 * Object lock is the basic-mode option the form leads with, because backup
 * targets are what S3 on a NAS is mostly for. Checking it is meant to do three
 * things at once — turn versioning on, default the retention mode to
 * Compliance, and ask for a retention period — and the API check in the test
 * is what confirms the first two, since neither is visible in basic mode.
 *
 * Starting the service matters for the same reason as SMB: a bucket on a
 * stopped service is configuration that serves nothing.
 */
export async function createS3BucketWithObjectLock(page: Page, bucket: NewS3Bucket): Promise<void> {
  await goToShares(page);

  await page.locator(s3BucketLocators.addFromDashboard).click();

  const form = s3BucketLocators.form;
  await expect(page.locator(form.name)).toBeVisible();
  await page.locator(form.name).fill(bucket.name);

  // The picker commits typed text on `change`, which fires on blur — so blur
  // explicitly rather than relying on the next fill to steal focus.
  await page.locator(form.parentDataset).fill(bucket.parentDataset);
  await page.locator(form.parentDataset).blur();

  await pickUser(page, form.owner, form.ownerOption(bucket.owner), bucket.owner);

  // The retention controls only render once object lock is on, so their
  // appearance confirms the box went the intended way rather than blindly
  // toggling whatever state it was in.
  await page.locator(form.objectLock).click();
  await expect(page.locator(form.defaultRetentionMode)).toBeVisible();
  await expect(page.locator(form.defaultRetentionDays)).toBeVisible();
  await page.locator(form.defaultRetentionDays).fill(String(bucket.retentionDays));

  await page.locator(form.save).click();

  // Asserted rather than probed: the fixture stops the service beforehand, so
  // the prompt is part of the journey and its absence is a flow change worth
  // failing on.
  const startService = page.locator(s3BucketLocators.startService);
  await expect(startService).toBeVisible({ timeout: saveTimeoutMs });
  await startService.click();

  await expect(page.locator(form.save)).toBeHidden({ timeout: saveTimeoutMs });
  await expect(page.locator(s3BucketLocators.dashboardRowName(bucket.name))).toBeVisible({
    timeout: saveTimeoutMs,
  });
}

export interface NewS3AccessKey {
  name: string;
  username: string;
}

/** What the credentials dialog showed, read back for the API cross-check. */
export interface ShownS3Credentials {
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * Creates a non-expiring access key under Credentials and reads the credential
 * pair off the one-time dialog.
 *
 * Non-expiring is opt-in: the form asks for a date by default. Ticking the box
 * is checked by the date input disappearing, so a default that flips would
 * fail here rather than quietly producing a key with a date nobody chose.
 *
 * The secret is shown exactly once, which is why it is read here rather than
 * looked up afterwards — nothing on the appliance will show it again.
 */
export async function createS3AccessKey(page: Page, key: NewS3AccessKey): Promise<ShownS3Credentials> {
  await goToS3AccessKeys(page);

  await page.locator(s3AccessKeyLocators.add).click();

  const form = s3AccessKeyLocators.form;
  await expect(page.locator(form.name)).toBeVisible();
  await page.locator(form.name).fill(key.name);

  await pickUser(page, form.user, form.userOption(key.username), key.username);

  await expect(page.locator(form.expiresAt)).toBeVisible();
  await page.locator(form.nonExpiring).click();
  await expect(page.locator(form.expiresAt)).toBeHidden();

  await page.locator(form.save).click();

  const dialog = s3AccessKeyLocators.credentialsDialog;
  await expect(page.locator(dialog.secretAccessKey)).toBeVisible({ timeout: saveTimeoutMs });

  const accessKeyId = await page.locator(dialog.accessKeyId).inputValue();
  const secretAccessKey = await page.locator(dialog.secretAccessKey).inputValue();

  await page.locator(dialog.close).click();
  await expect(page.locator(dialog.secretAccessKey)).toBeHidden();

  await expect(page.locator(s3AccessKeyLocators.rowName(key.name))).toBeVisible({ timeout: saveTimeoutMs });

  return { accessKeyId, secretAccessKey };
}
