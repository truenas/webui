/**
 * Stories: an admin downloads a certificate, and a certificate signing request,
 * from its row on Credentials > Certificates, and gets the files the appliance
 * holds.
 *
 * One click on Download saves two files: the certificate or request, and its
 * private key. Each is a `core.download` of `filesystem.get` on the path the
 * record names. Each file is compared with what `certificate.query` returns for
 * that record, so a download of the wrong path, the wrong row, or an empty file
 * fails here.
 *
 * Both records are seeded over the API under names only this spec uses. The
 * downloads stay in Playwright's output directory. Nothing is written on the
 * appliance besides the seeds.
 */
import { readFile } from 'node:fs/promises';
import type { Download } from '@playwright/test';
import {
  countCertificates,
  countCsrs,
  ensureCertificateAbsent,
  ensureCsrPresent,
  ensureImportedCertificatePresent,
  findCertificate,
  type CsrSeed,
} from '../fixtures/certificates';
import { testCertificatePem, testPrivateKeyPem } from '../fixtures/test-certificate';
import { downloadFromRow } from '../flows/certificates';
import {
  certificateCardPageSize, certificateLocators, csrCardPageSize, csrLocators,
} from '../locators/certificates';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Imported over the API so there is a certificate to download. */
const certificateName = 'e2e-cert-download';

/** Created over the API so there is a request to download. */
const csr: CsrSeed = {
  name: 'e2e-csr-download', common: 'e2e-csr-download.example.com', san: ['e2e-csr-download.example.com'],
};

const allNames = [certificateName, csr.name];

async function removeEverything(api: E2eApiClient): Promise<void> {
  await runCleanupSteps(allNames.map((name): [string, () => Promise<void>] => [
    `remove the certificate or CSR ${name}`, () => ensureCertificateAbsent(api, name),
  ]));
}

/**
 * Middleware hands a stored PEM back re-exported, which can end it with a newline
 * the original does not have, so files and records are compared trimmed.
 */
async function readTrimmed(download: Download): Promise<string> {
  return (await readFile(await download.path(), 'utf8')).trim();
}

/**
 * Removed before each test as well as after, so an interrupted run leaves the
 * next one able to start, and unconditionally so a failure still cleans up.
 */
test.beforeEach(async ({ api }) => {
  await removeEverything(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the certificate ${certificateName} and the CSR ${csr.name}`)) {
    return;
  }

  await removeEverything(api);
});

test('Download on a certificate saves the certificate and its key as the appliance holds them', async ({ page, api }) => {
  const { card } = certificateLocators;
  // The card lists four, oldest first, before its pager. Failing here says why
  // rather than timing out on a hidden row.
  const existing = await countCertificates(api);
  expect(
    existing + 1 <= certificateCardPageSize,
    `the card lists ${certificateCardPageSize} certificates, this test adds 1, the appliance has ${existing}`,
  ).toBe(true);
  await ensureImportedCertificatePresent(api, certificateName);

  const [certificateFile, keyFile] = await downloadFromRow(
    page,
    { menu: card.rowMenu(certificateName), download: card.rowMenuDownload(certificateName) },
    [`${certificateName}.crt`, `${certificateName}.key`],
  );

  const record = await findCertificate(api, certificateName);
  expect(record?.certificate, 'certificate.query should return the certificate it imported').toBeTruthy();
  expect(record?.privatekey, 'certificate.query should return the key it imported').toBeTruthy();

  const certificateText = await readTrimmed(certificateFile);
  const keyText = await readTrimmed(keyFile);
  expect(certificateText).toBe(record?.certificate?.trim());
  expect(keyText).toBe(record?.privatekey?.trim());
  // The record is the reference. This says it is also what was imported, which
  // `certificates-import.e2e.ts` shows middleware keeps apart from whitespace.
  expect(certificateText).toBe(testCertificatePem);
  expect(keyText).toBe(testPrivateKeyPem);
});

test('Download on a CSR saves the request and its key as the appliance holds them', async ({ page, api }) => {
  const { list } = csrLocators;
  const existing = await countCsrs(api);
  expect(
    existing + 1 <= csrCardPageSize,
    `the card lists ${csrCardPageSize} CSRs, this test adds 1, the appliance has ${existing}`,
  ).toBe(true);
  await ensureCsrPresent(api, csr);

  const [requestFile, keyFile] = await downloadFromRow(
    page,
    { menu: list.rowMenu(csr.name), download: list.rowMenuDownload(csr.name) },
    [`${csr.name}.csr`, `${csr.name}.key`],
  );

  const record = await findCertificate(api, csr.name);
  expect(record?.CSR, 'certificate.query should return the request it generated').toBeTruthy();
  expect(record?.privatekey, 'certificate.query should return the key it generated').toBeTruthy();

  const requestText = await readTrimmed(requestFile);
  expect(requestText).toBe(record?.CSR?.trim());
  expect(requestText.startsWith('-----BEGIN CERTIFICATE REQUEST-----')).toBe(true);
  expect(await readTrimmed(keyFile)).toBe(record?.privatekey?.trim());
});
