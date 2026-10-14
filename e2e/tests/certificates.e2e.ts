/**
 * Stories: an admin creates a certificate signing request through the Add CSR
 * wizard on Credentials > Certificates, and deletes one from its row on the CSR
 * card, and the appliance holds what they did.
 *
 * Each action is asserted twice: the card's row says the screen believed it,
 * `certificate.query` says the appliance did it — and carries the request itself,
 * which is the evidence that a key pair was generated and a CSR signed with it.
 *
 * The delete runs beside a second CSR that must come through untouched. Every row
 * carries its own Delete button, so a row-targeting bug deletes the wrong request
 * without failing anything else.
 */
import {
  countCsrs, ensureCertificateAbsent, ensureCsrPresent, findCertificate, type CsrSeed,
} from '../fixtures/certificates';
import { addCsr, deleteCsr, type CsrSubject } from '../flows/certificates';
import { csrCardPageSize, csrLocators } from '../locators/certificates';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Created through the wizard, never over the API — that is the thing under test. */
const createdName = 'e2e-csr-created';

const createdSubject: CsrSubject = {
  state: 'Tennessee',
  city: 'Maryville',
  organization: 'iXsystems E2E',
  email: 'e2e-csr@example.com',
  common: 'e2e-csr-created.example.com',
  san: ['e2e-csr-created.example.com'],
};

/** Provisioned over the API so there is something to delete. */
const target: CsrSeed = {
  name: 'e2e-csr-target', common: 'e2e-csr-target.example.com', san: ['e2e-csr-target.example.com'],
};

/** The CSR that must survive whatever is done to the target. */
const bystander: CsrSeed = {
  name: 'e2e-csr-bystander', common: 'e2e-csr-bystander.example.com', san: ['e2e-csr-bystander.example.com'],
};

const allNames = [createdName, target.name, bystander.name];

async function removeEverything(api: E2eApiClient): Promise<void> {
  await runCleanupSteps(allNames.map((name): [string, () => Promise<void>] => [
    `remove the CSR ${name}`, () => ensureCertificateAbsent(api, name),
  ]));
}

/**
 * Fails up front when the card cannot show every row a test needs.
 *
 * The card lists four CSRs, oldest first, before its pager — see `csrCardPageSize`.
 * A fresh appliance holds none; failing here says why rather than timing out on a
 * hidden row.
 */
async function requireRoomOnCard(api: E2eApiClient, adding: number): Promise<void> {
  const existing = await countCsrs(api);
  expect(
    existing + adding <= csrCardPageSize,
    `the card lists ${csrCardPageSize} CSRs, this test adds ${adding}, the appliance has ${existing}`,
  ).toBe(true);
}

/**
 * Removed before each test as well as after, so an interrupted run leaves the
 * next one able to start, and unconditionally so a failure still cleans up.
 */
test.beforeEach(async ({ api }) => {
  await removeEverything(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the CSRs ${allNames.join(', ')}`)) {
    return;
  }

  await removeEverything(api);
});

test('an admin creates a certificate signing request, and the appliance really has one', async ({ page, api }) => {
  const { list } = csrLocators;
  await requireRoomOnCard(api, 1);

  await addCsr(page, createdName, createdSubject);

  await expect(page.locator(list.name(createdName))).toHaveText(createdName);
  await expect(page.locator(list.common(createdName))).toHaveText(createdSubject.common);
  await expect(page.locator(list.san(createdName))).toContainText(createdSubject.san[0]);

  // A signed request in PEM is what the wizard exists to produce; the subject
  // fields come back parsed out of it, so they are what was really signed.
  const created = await findCertificate(api, createdName);
  expect(created).toMatchObject({
    name: createdName,
    cert_type_CSR: true,
    CSR: expect.stringContaining('-----BEGIN CERTIFICATE REQUEST-----'),
    common: createdSubject.common,
    organization: createdSubject.organization,
    state: createdSubject.state,
    city: createdSubject.city,
    email: createdSubject.email,
    country: 'US',
  });
  // Middleware may store a SAN with its `DNS:` type in front, so the host is matched within it.
  expect(created?.san).toEqual([expect.stringContaining(createdSubject.san[0])]);
});

test('deleting a certificate signing request from its row removes the one that was picked', async ({ page, api }) => {
  await requireRoomOnCard(api, 2);
  await ensureCsrPresent(api, target);
  await ensureCsrPresent(api, bystander);
  const bystanderBefore = await findCertificate(api, bystander.name);

  await deleteCsr(page, target.name);

  // Polled rather than read once: a row can also be hidden while the card is
  // between loads, which proves nothing.
  await expect.poll(() => findCertificate(api, target.name)).toBeUndefined();

  // The whole point of the second CSR: the card looks right either way.
  await expect(page.locator(csrLocators.list.row(bystander.name))).toBeVisible();
  expect(await findCertificate(api, bystander.name)).toMatchObject({
    id: bystanderBefore?.id,
    CSR: bystanderBefore?.CSR,
  });
});
