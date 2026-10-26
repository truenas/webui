/**
 * Cloud credentials, driven through the UI from Credentials > Backup Credentials.
 */
import { expect, type Page } from '@playwright/test';
import { goToBackupCredentials } from './navigation';
import { selectOption } from './storage';
import { cloudCredentialLocators } from '../locators/cloud-credentials';
import { confirmDialogLocators } from '../locators/dialogs';
import { apiCallsTo } from '../support/api-calls';

/** Saving and deleting a credential are middleware calls, not instant. */
const saveTimeoutMs = 60_000;

/**
 * Verify runs `rclone lsjson` against the remote with a 15 s connect timeout and
 * a 30 s I/O timeout, so this is a ceiling above both, not a wait.
 */
const verifyTimeoutMs = 90_000;

/**
 * How many credentials the card lists before View All — its pager's `pageSize`.
 * Sorted by id, so a credential a test has just made is the first one hidden.
 */
export const cloudCredentialCardPageSize = 5;

/** What the form is filled with: an SFTP credential to the appliance's own loopback. */
export interface LoopbackSftpCredential {
  name: string;
  user: string;
  keypairName: string;
}

/**
 * Presses View All on a freshly loaded card when the appliance holds more
 * credentials than it lists, so every row is in the DOM.
 *
 * The caller passes the count, read over the API, because whether View All
 * renders at all depends on it, and probing the page for the button would race
 * the card's load. Expanded, the card lists as many rows as it held at the click,
 * which stays enough for an edit or a delete: neither adds a credential.
 */
async function showAllCloudCredentials(page: Page, total: number): Promise<void> {
  if (total <= cloudCredentialCardPageSize) {
    return;
  }

  await page.locator(cloudCredentialLocators.card.viewAll).click();
  await expect(page.locator(cloudCredentialLocators.card.collapse)).toBeVisible();
}

/** Opens the add form from the card, starting from the sidebar. */
export async function openAddCloudCredentialForm(page: Page): Promise<void> {
  await goToBackupCredentials(page);

  await page.locator(cloudCredentialLocators.card.add).click();
  await expect(page.locator(cloudCredentialLocators.form.name)).toBeVisible();
}

/**
 * Picks SFTP and fills the open add form in for a credential to `127.0.0.1`.
 *
 * The name goes in after the provider: picking a provider overwrites an untouched
 * name with a default built from the provider's title.
 */
export async function fillLoopbackSftpCredential(
  page: Page,
  { name, user, keypairName }: LoopbackSftpCredential,
): Promise<void> {
  const { form } = cloudCredentialLocators;

  await selectOption(page, form.provider, form.providerOption('SFTP'));
  await expect(page.locator(form.sftp.host)).toBeVisible();

  await page.locator(form.name).fill(name);
  await page.locator(form.sftp.host).fill('127.0.0.1');
  await page.locator(form.sftp.user).fill(user);
  await selectOption(page, form.sftp.privateKey, form.sftp.privateKeyOption(keypairName));
}

/** What the form is filled with for an S3 credential: keys, and the endpoint to send them to. */
export interface S3Credential {
  name: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
}

/**
 * Picks Amazon S3 and fills the open add form in for a credential to this endpoint.
 *
 * The name goes in after the provider, for the same reason as in {@link fillLoopbackSftpCredential}.
 * Endpoint URL is an inline editable, so it is opened before it is filled.
 */
export async function fillS3Credential(
  page: Page,
  {
    name,
    accessKeyId,
    secretAccessKey,
    endpoint,
  }: S3Credential,
): Promise<void> {
  const { form } = cloudCredentialLocators;

  await selectOption(page, form.provider, form.providerOption('Amazon S3'));
  await expect(page.locator(form.s3.accessKeyId)).toBeVisible();

  await page.locator(form.name).fill(name);
  await page.locator(form.s3.accessKeyId).fill(accessKeyId);
  await page.locator(form.s3.secretAccessKey).fill(secretAccessKey);
  await page.locator(form.s3.endpointTrigger).click();
  await page.locator(form.s3.endpoint).fill(endpoint);
}

/**
 * Presses Verify Credential and waits for middleware's answer to have arrived
 * and the form to have acted on it.
 *
 * Both outcomes are an ordinary answer — `valid: false` is a result, not an
 * error — and the form reports them differently: a toast with no `data-test`
 * for a valid credential, the error dialog for one that is not. So this waits
 * on the answer itself, which needs `test.use({ recordApiCalls: true })` in the
 * spec, and then on the button coming back, which happens after the form has
 * raised whichever it was. What the caller then asserts on is the dialog.
 */
export async function verifyCloudCredential(page: Page): Promise<void> {
  const method = 'cloudsync.credentials.verify';
  const verify = page.locator(cloudCredentialLocators.form.verify);
  const earlier = apiCallsTo(page, method).length;

  await expect(verify).toBeEnabled();
  await verify.click();

  await expect.poll(
    () => apiCallsTo(page, method).slice(earlier).map((call) => call.answer),
    { timeout: verifyTimeoutMs },
  ).toEqual(['result']);
  await expect(verify).toBeEnabled();
}

/**
 * Opens the edit form for a credential from its row, starting from the sidebar.
 * `total` is how many credentials the appliance holds — see {@link showAllCloudCredentials}.
 *
 * Waits on the name and the username having been patched in, which is what says
 * the panel is editing *this* credential and its SFTP fields have rendered.
 */
export async function openEditCloudCredentialForm(
  page: Page,
  name: string,
  user: string,
  total: number,
): Promise<void> {
  await goToBackupCredentials(page);
  await showAllCloudCredentials(page, total);

  await page.locator(cloudCredentialLocators.card.edit(name)).click();
  await expect(page.locator(cloudCredentialLocators.form.name)).toHaveValue(name);
  await expect(page.locator(cloudCredentialLocators.form.sftp.user)).toHaveValue(user);
}

/**
 * Saves the form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded — a
 * refusal leaves it open with the error attached.
 */
export async function saveCloudCredentialForm(page: Page): Promise<void> {
  await page.locator(cloudCredentialLocators.form.save).click();
  await expect(page.locator(cloudCredentialLocators.form.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Deletes a credential from its row, starting from the sidebar, and waits for
 * its row to go. `total` is how many credentials the appliance holds, the target
 * included — see {@link showAllCloudCredentials}.
 *
 * The card raises webui's shared confirm through `confirmDelete`, which does not
 * pass `hideCheckbox`, so Delete stays **disabled** until the box is ticked —
 * asserted on the way, so a dialog that lost its gate fails here rather than
 * passing a test that never needed it.
 */
export async function deleteCloudCredential(page: Page, name: string, total: number): Promise<void> {
  await goToBackupCredentials(page);
  await showAllCloudCredentials(page, total);
  await page.locator(cloudCredentialLocators.card.delete(name)).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();

  const confirm = page.locator(confirmDialogLocators.confirm);
  await expect(confirm).toBeDisabled();
  await page.locator(confirmDialogLocators.checkbox).click();
  await expect(confirm).toBeEnabled();

  await confirm.click();
  await expect(page.locator(cloudCredentialLocators.card.row(name))).toBeHidden({ timeout: saveTimeoutMs });
}
