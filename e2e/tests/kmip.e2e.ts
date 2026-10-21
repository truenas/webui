/**
 * Stories: an admin reaches Credentials > KMIP and reads its state, saves a
 * server, port and certificate with KMIP left disabled, and has an attempt to
 * enable it refused.
 *
 * There is no KMIP server on CI, so nothing here connects to one. With
 * `enabled: false`, `kmip.update` checks the port, writes the row and starts
 * nothing (`plugins/kmip/config.py`), which is why the first save lands.
 *
 * The enable is refused before any connection is tried, and not for the reason
 * the server name suggests: `kmip.update` requires a `certificate_authority`
 * whenever KMIP is enabled, and this page has no control for one. So the
 * refusal is "Please specify a valid id.", filed under
 * `kmip_update.certificate_authority` — a refusal the UI cannot avoid. That
 * test skips on an appliance whose KMIP row already holds a certificate
 * authority, since the page sends none and so keeps it. The `.invalid` server
 * stays as a second guard: RFC 2606 reserves the name, so a connection test
 * would fail on DNS rather than reach anything.
 *
 * The page does not reload after a save, so its key status reflects what was
 * read on arrival. Each stored value is read back by leaving through the
 * sidebar and coming back, and over the API.
 */
import { ensureCertificateAbsent, ensureImportedCertificatePresent, findCertificate, findCertificateById } from '../fixtures/certificates';
import { entitlementFeature, isNotDenied } from '../fixtures/entitlements';
import {
  isKmipSyncPending,
  type KmipSettings,
  kmipSaveTimeoutMs,
  kmipSettingsOf,
  readKmipConfig,
  restoreKmipConfig,
} from '../fixtures/kmip';
import { pickKmipCertificate, waitForKmipPage } from '../flows/kmip';
import { goToCertificates, goToKmip } from '../flows/navigation';
import { errorDialogLocators } from '../locators/dialogs';
import { jobDialogLocators } from '../locators/encryption';
import { kmipLocators } from '../locators/kmip';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { errorDialogClose } from '../support/constants';
import { expect, test } from '../support/fixtures';

const certificateName = 'e2e-kmip';
const server = 'kmip.e2e.invalid';
const port = 5697;

/** `kmip.update`'s refusal of an enabled configuration with no certificate authority. */
const missingCertificateAuthorityMessage = 'Please specify a valid id.';

/**
 * What the appliance held before the first test in this file changed it.
 *
 * Read once per worker, as `startingDebugKernel` is in `kernel-settings.e2e.ts`:
 * a second read after a failed restore would record this file's own value as the
 * appliance's.
 */
let startingKmip: KmipSettings | undefined;
let startedEnabled: boolean | undefined;

/**
 * Puts the starting configuration back, then removes the certificate — in that
 * order, because middleware is likely to refuse deleting a certificate that
 * `kmip.config` still names.
 *
 * Guarded: Playwright runs `afterEach` even when `beforeEach` skipped or threw
 * before reading, and an appliance that started enabled is never written to.
 */
async function cleanUp(api: E2eApiClient): Promise<void> {
  const settings = startingKmip;
  if (settings === undefined || startedEnabled !== false) {
    return;
  }

  await runCleanupSteps([
    ['restore the KMIP configuration', () => restoreKmipConfig(api, settings)],
    ['remove the e2e-kmip certificate', () => ensureCertificateAbsent(api, certificateName)],
  ]);
}

test.beforeEach(async ({ api, entitlements }) => {
  // The sidebar entry is hidden, and `kmip.update` refuses an enable, when KMIP is denied.
  test.skip(
    !isNotDenied(entitlements, entitlementFeature.kmip),
    `the ${entitlementFeature.kmip} entitlement is denied on this appliance`,
  );

  if (startingKmip === undefined) {
    const config = await readKmipConfig(api);
    startingKmip = kmipSettingsOf(config);
    startedEnabled = config.enabled;
  }
  // Never overwrite a working KMIP configuration: restoring it would mean disabling it.
  test.skip(startedEnabled === true, 'KMIP is already enabled on this appliance');

  await cleanUp(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData('the KMIP configuration and the e2e-kmip certificate')) {
    return;
  }

  await cleanUp(api);
});

test('an admin reaches KMIP from the sidebar and sees it disabled, with nothing to sync', async ({
  page,
  api,
  entitlements,
}) => {
  const starting = await readKmipConfig(api);
  expect(starting.enabled).toBe(false);
  expect(await isKmipSyncPending(api)).toBe(false);

  await goToKmip(page);
  await waitForKmipPage(page);

  await expect(page.locator(kmipLocators.status.disabled)).toBeVisible();
  await expect(page.locator(kmipLocators.status.pendingSync)).toHaveCount(0);
  await expect(page.locator(kmipLocators.status.synced)).toHaveCount(0);
  await expect(page.locator(kmipLocators.syncKeys)).toBeDisabled();
  await expect(page.locator(kmipLocators.clearSyncKeys)).toBeDisabled();

  const form = kmipLocators.form;
  await expect(page.locator(form.server)).toHaveValue(starting.server ?? '');
  await expect(page.locator(form.port)).toHaveValue(String(starting.port));
  if (starting.manage_zfs_keys) {
    await expect(page.locator(form.manageZfsKeys)).toBeChecked();
  } else {
    await expect(page.locator(form.manageZfsKeys)).not.toBeChecked();
  }
  await expect(page.locator(form.enabled)).not.toBeChecked();

  if (starting.certificate !== null) {
    const certificate = await findCertificateById(api, starting.certificate);
    expect(certificate, `the certificate kmip.config names (id ${starting.certificate}) exists`).toBeDefined();
    await expect(page.locator(form.certificate)).toContainText(certificate?.name ?? '');
  }

  const sedShown = isNotDenied(entitlements, entitlementFeature.sed);
  await expect(page.locator(form.manageSedDisks)).toHaveCount(sedShown ? 1 : 0);
});

test('an admin saves a server, port and certificate with KMIP left disabled, and the appliance keeps them', async ({
  page,
  api,
}) => {
  const form = kmipLocators.form;
  await ensureImportedCertificatePresent(api, certificateName);
  const certificate = await findCertificate(api, certificateName);
  expect(certificate, `the ${certificateName} certificate was imported`).toBeDefined();

  await goToKmip(page);
  await waitForKmipPage(page);

  await page.locator(form.server).fill(server);
  await page.locator(form.port).fill(String(port));
  await pickKmipCertificate(page, certificateName);
  await expect(page.locator(form.enabled)).not.toBeChecked();
  await expect(page.locator(form.validate)).not.toBeChecked();
  await expect(page.locator(form.changeServer)).not.toBeChecked();
  await expect(page.locator(form.forceClear)).not.toBeChecked();

  await page.locator(form.save).click();

  // The job may finish before its dialog is ever seen, so the stored value is what is waited on.
  await expect.poll(async () => (await readKmipConfig(api)).server, { timeout: kmipSaveTimeoutMs }).toBe(server);
  await expect(page.locator(jobDialogLocators.title)).toBeHidden({ timeout: kmipSaveTimeoutMs });
  await expect(page.locator(errorDialogLocators.title)).toHaveCount(0);

  // The page keeps what it read on arrival, so the stored state is read by coming back.
  await goToCertificates(page);
  await goToKmip(page);
  await waitForKmipPage(page);

  await expect(page.locator(form.server)).toHaveValue(server);
  await expect(page.locator(form.port)).toHaveValue(String(port));
  await expect(page.locator(form.certificate)).toContainText(certificateName);
  await expect(page.locator(kmipLocators.status.disabled)).toBeVisible();

  expect(await readKmipConfig(api)).toMatchObject({
    server,
    port,
    certificate: certificate?.id,
    enabled: false,
  });
});

test('enabling KMIP from the page, with no certificate authority stored, is refused and changes nothing', async ({
  page,
  api,
}) => {
  const form = kmipLocators.form;
  // With one stored, middleware would go on to try the connection, and refuse with a different message.
  test.skip(
    startingKmip?.certificate_authority !== null,
    'a KMIP certificate authority is already stored on this appliance',
  );
  await ensureImportedCertificatePresent(api, certificateName);
  const starting = await readKmipConfig(api);

  await goToKmip(page);
  await waitForKmipPage(page);

  await page.locator(form.server).fill(server);
  await pickKmipCertificate(page, certificateName);
  await page.locator(form.enabled).click();
  await expect(page.locator(form.enabled)).toBeChecked();
  await page.locator(form.validate).click();
  await expect(page.locator(form.validate)).toBeChecked();

  await page.locator(form.save).click();

  await expect(page.locator(errorDialogLocators.message)).toContainText(missingCertificateAuthorityMessage, {
    timeout: kmipSaveTimeoutMs,
  });
  await page.locator(errorDialogClose).click();
  await expect(page.locator(errorDialogLocators.title)).toBeHidden();
  await expect(page.locator(jobDialogLocators.title)).toBeHidden();

  await goToCertificates(page);
  await goToKmip(page);
  await waitForKmipPage(page);

  await expect(page.locator(form.server)).toHaveValue(starting.server ?? '');
  await expect(page.locator(form.enabled)).not.toBeChecked();
  await expect(page.locator(kmipLocators.status.disabled)).toBeVisible();

  expect(await readKmipConfig(api)).toEqual(starting);
  expect(await isKmipSyncPending(api)).toBe(false);
});
