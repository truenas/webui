/**
 * Stories: an admin imports a certificate with its private key from the
 * Certificates card on Credentials > Certificates, edits one, views its
 * certificate and key, and deletes one from its row, and the appliance holds
 * what they did.
 *
 * Every certificate here is the checked-in test certificate and key in
 * `fixtures/test-certificate.ts`, under a different name each time.
 *
 * Each save is asserted twice: the card's row says the screen believed it,
 * `certificate.query` says the appliance did it — and carries the PEM and the
 * trusted-store flag, which the card does not show.
 *
 * Edit and delete each run beside a second certificate that must come through
 * untouched. Every row has its own Edit and Delete in its own row menu, so a
 * row-targeting bug changes the wrong certificate without failing anything else.
 */
import {
  countCertificates,
  ensureCertificateAbsent,
  ensureImportedCertificatePresent,
  findCertificate,
  findCertificateById,
} from '../fixtures/certificates';
import { testCertificateCommon, testCertificatePem, testPrivateKeyPem } from '../fixtures/test-certificate';
import {
  deleteCertificate,
  importCertificate,
  openEditCertificateForm,
  saveCertificateForm,
  viewCertificatePem,
} from '../flows/certificates';
import { certificateCardPageSize, certificateLocators } from '../locators/certificates';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Imported through the form, never over the API — that is the thing under test. */
const importedName = 'e2e-cert-imported';

/** Imported over the API so there is something to edit, view or delete. */
const targetName = 'e2e-cert-target';

/** What the edit renames the target to. */
const renamedName = 'e2e-cert-renamed';

/** The certificate that must survive whatever is done to the target. */
const bystanderName = 'e2e-cert-bystander';

const allNames = [importedName, targetName, renamedName, bystanderName];

async function removeEverything(api: E2eApiClient): Promise<void> {
  await runCleanupSteps(allNames.map((name): [string, () => Promise<void>] => [
    `remove the certificate ${name}`, () => ensureCertificateAbsent(api, name),
  ]));
}

/**
 * Fails up front when the card cannot show every row a test needs.
 *
 * The card lists four certificates, oldest first, before its pager — see
 * `certificateCardPageSize`. A fresh appliance holds one; failing here says why
 * rather than timing out on a hidden row.
 */
async function requireRoomOnCard(api: E2eApiClient, adding: number): Promise<void> {
  const existing = await countCertificates(api);
  expect(
    existing + adding <= certificateCardPageSize,
    `the card lists ${certificateCardPageSize} certificates, this test adds ${adding}, the appliance has ${existing}`,
  ).toBe(true);
}

/**
 * Middleware hands an imported key back re-exported, which ends it with a
 * newline the checked-in one does not have, so PEM is compared without the
 * whitespace around it.
 */
function trimmed(pem: string | null | undefined): string | undefined {
  return pem?.trim();
}

/**
 * Removed before each test as well as after, so an interrupted run leaves the
 * next one able to start, and unconditionally so a failure still cleans up.
 */
test.beforeEach(async ({ api }) => {
  await removeEverything(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the certificates ${allNames.join(', ')}`)) {
    return;
  }

  await removeEverything(api);
});

test('an admin imports a certificate with its key, and the appliance stores both as pasted', async ({ page, api }) => {
  const { card } = certificateLocators;
  await requireRoomOnCard(api, 1);

  await importCertificate(page, {
    name: importedName,
    certificate: testCertificatePem,
    privateKey: testPrivateKeyPem,
  });

  await expect(page.locator(card.name(importedName))).toHaveText(importedName);
  // Parsed out of the PEM by middleware, so the card showing it says the
  // certificate itself arrived, not just a name.
  await expect(page.locator(card.common(importedName))).toHaveText(testCertificateCommon);

  const imported = await findCertificate(api, importedName);
  expect(imported).toMatchObject({
    name: importedName,
    cert_type_CSR: false,
    common: testCertificateCommon,
    add_to_trusted_store: false,
  });
  expect(trimmed(imported?.certificate)).toBe(testCertificatePem);
  expect(trimmed(imported?.privatekey)).toBe(testPrivateKeyPem);
});

test('editing a certificate from its row changes its name and trusted-store flag', async ({ page, api }) => {
  const { card, editForm } = certificateLocators;
  await requireRoomOnCard(api, 2);
  await ensureImportedCertificatePresent(api, targetName);
  await ensureImportedCertificatePresent(api, bystanderName);
  const before = await findCertificate(api, targetName);
  const bystanderBefore = await findCertificate(api, bystanderName);

  await openEditCertificateForm(page, targetName);
  await page.locator(editForm.name).fill(renamedName);
  await page.locator(editForm.addToTrustedStore).check();
  await saveCertificateForm(page);

  // The name is in the row tag, so the edited row answers only under its new ids.
  await expect(page.locator(card.name(renamedName))).toHaveText(renamedName);
  await expect(page.locator(card.row(targetName))).toBeHidden();

  // The same record, by id: an update, not a delete and an import that happen to
  // leave the card looking the same. The flag is not on the card at all.
  expect(before).toBeDefined();
  expect(await findCertificateById(api, before?.id ?? -1)).toMatchObject({
    name: renamedName,
    add_to_trusted_store: true,
  });

  expect(await findCertificate(api, bystanderName)).toMatchObject({
    id: bystanderBefore?.id,
    add_to_trusted_store: false,
  });
});

test('View Certificate and View Key show the PEM that was imported', async ({ page, api }) => {
  await requireRoomOnCard(api, 1);
  await ensureImportedCertificatePresent(api, targetName);

  await openEditCertificateForm(page, targetName);

  // Both open the same dialog, so what it holds is the only thing that tells
  // which one was asked for.
  expect(trimmed(await viewCertificatePem(page, 'certificate'))).toBe(testCertificatePem);
  expect(trimmed(await viewCertificatePem(page, 'key'))).toBe(testPrivateKeyPem);
});

test('deleting a certificate from its row removes the one that was picked', async ({ page, api }) => {
  await requireRoomOnCard(api, 2);
  await ensureImportedCertificatePresent(api, targetName);
  await ensureImportedCertificatePresent(api, bystanderName);
  const bystanderBefore = await findCertificate(api, bystanderName);

  await deleteCertificate(page, targetName);

  // Polled rather than read once: a row can also be hidden while the card is
  // between loads, which proves nothing.
  await expect.poll(() => findCertificate(api, targetName)).toBeUndefined();

  // The whole point of the second certificate: the card looks right either way.
  await expect(page.locator(certificateLocators.card.row(bystanderName))).toBeVisible();
  expect(await findCertificate(api, bystanderName)).toMatchObject({ id: bystanderBefore?.id });
});
