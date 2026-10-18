/**
 * Stories: an admin who backs out of the encryption warning gets an unencrypted pool on Review;
 * and an admin creates a software-encrypted pool through the wizard, downloads its key, and the
 * appliance holds a pool whose root is encrypted with that kind of key.
 *
 * Picking "Software Encryption (ZFS)" on the General step raises a warning that has to be
 * accepted, and cancelling it puts the radio back to None. On submit the wizard sends
 * `encryption: true` with a generated key, and once the create job is done it opens the Download
 * Encryption Key dialog. That dialog cannot be dismissed, and its Done stays disabled until the key
 * file has been downloaded. A user who loses that file loses the pool, so the file's name and
 * contents are checked, not only that a download happened.
 *
 * One disk, as a stripe: the subject is encryption, not topology. The wizard warns about a stripe
 * data vdev, which `pool-wizard-validation.e2e.ts` covers and this file does not check.
 *
 * The pool is removed before and after every test, whatever happened. Teardown is over the API,
 * so a Download Key dialog left open by a failure does not get in its way.
 *
 * Not covered: SED pools, which need SED disks and an entitlement; switching the pool root's key
 * to a passphrase and locking it, which is the root dataset's Encryption card; and importing an
 * encrypted pool with its key file.
 */
import { readFile } from 'node:fs/promises';
import {
  ensurePoolAbsent, findDataset, findPool, requireUnusedDisks,
} from '../fixtures/storage';
import {
  configureAutomatedVdevs, confirmDestructiveAction, downloadPoolKey, goToReview, leaveGeneralStep,
  startPoolWizard, submitEncryptedPool,
} from '../flows/storage';
import { confirmDialogLocators } from '../locators/dialogs';
import { downloadKeyDialogLocators, poolWizardLocators } from '../locators/storage';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const encryptedPool = 'e2e_wizard_encrypted';

const noEncryption = 'None';
const softwareEncryption = 'Software Encryption (ZFS)';

/** A generated key: 32 random bytes, written as hex. */
const hexKey = /^[0-9a-f]{64}$/i;

test.beforeEach(async ({ api }) => {
  await ensurePoolAbsent(api, encryptedPool);
  await requireUnusedDisks(api, 1);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the pool ${encryptedPool}`)) {
    return;
  }

  await runCleanupSteps([
    [`remove the pool "${encryptedPool}"`, () => ensurePoolAbsent(api, encryptedPool)],
  ]);
});

test('cancelling the encryption warning leaves the pool unencrypted', async ({ page, api }) => {
  await startPoolWizard(page);
  await page.locator(poolWizardLocators.name).fill(encryptedPool);

  const none = page.locator(poolWizardLocators.encryptionType(noEncryption));
  const software = page.locator(poolWizardLocators.encryptionType(softwareEncryption));
  await expect(none).toBeChecked();

  await software.click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  // Picked, until the warning is answered. This is what makes the None below a change.
  await expect(software).toBeChecked();

  await page.locator(confirmDialogLocators.cancel).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeHidden();
  await expect(none).toBeChecked();
  await expect(software).not.toBeChecked();

  await leaveGeneralStep(page);
  await configureAutomatedVdevs(page, 'data', { layout: 'Stripe', width: 1, vdevs: 1 });
  await goToReview(page, 'data');

  // Review lists Encryption only when it is not None. The second test shows it does render.
  await expect(page.locator(poolWizardLocators.reviewPoolName)).toContainText(encryptedPool);
  await expect(page.locator(poolWizardLocators.reviewEncryption)).toHaveCount(0);

  expect(await findPool(api, encryptedPool)).toBeUndefined();
});

test('an admin creates a software-encrypted pool and downloads its key', async ({ page, api }, testInfo) => {
  await startPoolWizard(page);
  await page.locator(poolWizardLocators.name).fill(encryptedPool);

  const software = page.locator(poolWizardLocators.encryptionType(softwareEncryption));
  await software.click();
  // "I Understand" is gated on its tick box, the same as a destructive confirmation.
  await confirmDestructiveAction(page);
  await expect(page.locator(confirmDialogLocators.title)).toBeHidden();
  await expect(software).toBeChecked();

  await leaveGeneralStep(page);
  await configureAutomatedVdevs(page, 'data', { layout: 'Stripe', width: 1, vdevs: 1 });
  await goToReview(page, 'data');
  await expect(page.locator(poolWizardLocators.reviewEncryption)).toContainText('Software (ZFS)');

  await submitEncryptedPool(page);

  const done = page.locator(downloadKeyDialogLocators.done);
  await expect(done).toBeDisabled();

  const download = await downloadPoolKey(page);
  const keyFileName = `dataset_${encryptedPool}_keys.json`;
  expect(download.suggestedFilename()).toBe(keyFileName);

  // Kept with the test's other output, never in the repository.
  const keyFile = testInfo.outputPath(keyFileName);
  await download.saveAs(keyFile);
  const keys = JSON.parse(await readFile(keyFile, 'utf8')) as Record<string, unknown>;
  // The file maps each encrypted dataset in the pool to its key, and the pool's root is one.
  expect(keys[encryptedPool]).toMatch(hexKey);

  await expect(done).toBeEnabled();
  await done.click();
  await expect(page.locator(downloadKeyDialogLocators.title)).toBeHidden();
  await expect(page).toHaveURL(/\/storage\/?$/);

  expect(await findDataset(api, encryptedPool)).toMatchObject({
    encrypted: true,
    encryption_root: encryptedPool,
    key_format: { value: 'HEX' },
    locked: false,
    key_loaded: true,
  });
  expect(await findPool(api, encryptedPool)).toMatchObject({ status: 'ONLINE' });
});
