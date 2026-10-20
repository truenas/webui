/**
 * Stories: on the Audit page under System, an admin switches the Service selector, searches the log
 * by username and by an advanced query on the event, mistypes an advanced query, opens a record's
 * details, and exports the log as CSV and as JSON.
 *
 * ## The records
 *
 * Every expected record is read from `audit.query`, never written down. Most tests sign a
 * throwaway administrator in over the API and look for that account's newest record, so the
 * record is one this test made and its user is one no other record names. The admin's own
 * `user.create` for that account lands just before it, under the suite admin's name, and that is
 * what each search has to filter out: every filter assertion first checks the unfiltered list shows
 * something the filter must remove, so it cannot pass on a list that was already narrow.
 *
 * The Service test cannot make a record of another service over the API. It switches to whichever
 * of System, Sudo and SMB already holds records, or to an empty System log when none does, and in
 * both cases checks the newest middleware record leaves the list.
 *
 * ## Export
 *
 * Export runs `audit.export` with the search showing, and the browser receives a gzipped tar
 * holding the report in the chosen format. The test searches for the throwaway account first, so
 * the report is small, and checks a member of the archive names the record's audit id.
 *
 * ## Teardown
 *
 * The throwaway account is deleted before and after every test. Its records stay: the audit log
 * cannot be edited, and they expire with the retention like any other.
 */
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import type { Page } from '@playwright/test';
import {
  findNewestAuditRecord, findNewestUserAuditRecord, hasAuditRecords, type AuditServiceKey,
} from '../fixtures/audit';
import { ensureSignInAdministratorPresent, ensureUserAbsent } from '../fixtures/users';
import {
  chooseAuditService, exportAuditLog, runBasicAuditSearch, typeAdvancedAuditQuery,
} from '../flows/audit';
import { goToAudit } from '../flows/navigation';
import { auditLocators, type AuditRowKey } from '../locators/audit';
import { connectAndLogin, type E2eApiClient } from '../support/api/client';
import { tarMembers } from '../support/archive';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import type { TargetConfig } from '../support/config';
import { expect, test } from '../support/fixtures';

/** Not `bob`, a `roleAdmins` account or `e2e_session_admin`, which other specs create and delete. */
const auditUser = {
  username: 'e2e_audit_user',
  /** Meets the appliance's complexity rules; not a credential of any real account. */
  password: 'Audit-E2E-Passw0rd!',
};

/** The page counts the records before it loads the first page of them. */
const listLoadTimeoutMs = 30_000;

/** A ceiling for middleware to write the sign-in to the audit database. Not a wait. */
const recordWrittenTimeoutMs = 30_000;

/** The Service selector's label for each service, from `auditServiceLabels`. */
const serviceLabels: Record<AuditServiceKey, string> = {
  MIDDLEWARE: 'Middleware',
  SMB: 'SMB',
  SUDO: 'Sudo',
  SYSTEM: 'System',
};

/**
 * Signs the throwaway administrator in over the API and returns the record that left.
 *
 * The client is closed at once: a client left open signs in again by itself when its socket
 * reopens, and would keep adding records under that name.
 */
async function recordThrowawaySignIn(api: E2eApiClient, config: TargetConfig): Promise<AuditRowKey> {
  await ensureSignInAdministratorPresent(api, auditUser);
  const client = await connectAndLogin({ ...config, ...auditUser });
  client.close();

  let record: AuditRowKey | undefined;
  await expect.poll(
    async () => {
      record = await findNewestUserAuditRecord(api, auditUser.username);
      return record;
    },
    {
      message: `audit.query should hold a record made by "${auditUser.username}" after it signed in`,
      timeout: recordWrittenTimeoutMs,
    },
  ).toBeDefined();
  if (!record) {
    throw new Error(`audit.query has no record made by "${auditUser.username}".`);
  }

  return record;
}

/** The distinct values the listed rows show in one column, sorted. */
async function shownValues(page: Page, cells: string): Promise<string[]> {
  const texts = await page.locator(cells).allTextContents();
  return [...new Set(texts.map((text) => text.trim()))].sort((left, right) => left.localeCompare(right));
}

async function cleanUp(api: E2eApiClient): Promise<void> {
  await runCleanupSteps([
    [`delete the user "${auditUser.username}"`, () => ensureUserAbsent(api, auditUser.username)],
  ]);
}

test.beforeEach(async ({ api }) => {
  await cleanUp(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`user "${auditUser.username}"`)) {
    return;
  }
  await cleanUp(api);
});

test('switching the Service selector lists only that service\'s records', async ({ page, api }) => {
  const middlewareRecord = await findNewestAuditRecord(api);
  if (!middlewareRecord) {
    throw new Error('audit.query has no recent middleware record with a user and an event to look for.');
  }
  // Switch to a service that holds a record if there is one. A fresh appliance may have audited no
  // sudo, SMB or system activity yet, and nothing over the API can make it, so System with an empty
  // log is the fallback: the middleware record leaving the list still proves the switch reloaded it.
  const candidates = await Promise.all(
    (['SYSTEM', 'SUDO', 'SMB'] as const).map(async (service) => ({
      service,
      hasRecords: await hasAuditRecords(api, service),
    })),
  );
  const withRecords = candidates.find(({ hasRecords }) => hasRecords);
  const label = serviceLabels[withRecords?.service ?? 'SYSTEM'];

  await goToAudit(page);
  await expect(page.locator(auditLocators.list.row(middlewareRecord))).toBeVisible({ timeout: listLoadTimeoutMs });
  await expect.poll(
    () => shownValues(page, auditLocators.list.anyService),
    { message: 'the log should open on Middleware\'s records' },
  ).toEqual([serviceLabels.MIDDLEWARE]);

  await chooseAuditService(page, label);

  await expect(page.locator(auditLocators.list.row(middlewareRecord))).toHaveCount(0, { timeout: listLoadTimeoutMs });
  await expect.poll(
    () => shownValues(page, auditLocators.list.anyService),
    { message: `every listed record should be ${label}'s`, timeout: listLoadTimeoutMs },
  ).toEqual(withRecords ? [label] : []);
});

test('a basic search for a username lists only that user\'s records', async ({ page, api, config }) => {
  const record = await recordThrowawaySignIn(api, config);

  await goToAudit(page);
  await expect(page.locator(auditLocators.list.row(record))).toBeVisible({ timeout: listLoadTimeoutMs });
  await expect.poll(
    () => shownValues(page, auditLocators.list.anyUser),
    { message: `before the search, the log should also list "${config.username}", who created the account` },
  ).toContain(config.username);

  await runBasicAuditSearch(page, auditUser.username);

  await expect.poll(
    () => shownValues(page, auditLocators.list.anyUser),
    { message: `every listed record should be "${auditUser.username}"'s`, timeout: listLoadTimeoutMs },
  ).toEqual([auditUser.username]);
  await expect(page.locator(auditLocators.list.row(record))).toBeVisible();
});

test('an advanced query on the event lists only that event\'s records', async ({ page, api, config }) => {
  const record = await recordThrowawaySignIn(api, config);

  await goToAudit(page);
  await expect(page.locator(auditLocators.list.row(record))).toBeVisible({ timeout: listLoadTimeoutMs });
  await expect.poll(
    async () => (await shownValues(page, auditLocators.list.anyEvent)).some((event) => event !== record.event),
    { message: `before the query, the log should also list an event other than ${record.event}` },
  ).toBe(true);

  await typeAdvancedAuditQuery(page, `Event = "${record.event}"`);
  await expect(page.locator(auditLocators.search.queryError)).toBeHidden();
  await page.locator(auditLocators.search.run).click();

  await expect.poll(
    () => shownValues(page, auditLocators.list.anyEvent),
    { message: `every listed record should be a ${record.event}`, timeout: listLoadTimeoutMs },
  ).toEqual([record.event]);
  await expect(page.locator(auditLocators.list.row(record))).toBeVisible();
});

test('a malformed advanced query shows the query error', async ({ page }) => {
  await goToAudit(page);

  // A condition with no value: the grammar wants `Property Comparator Value`.
  await typeAdvancedAuditQuery(page, 'Event =');

  await expect(page.locator(auditLocators.search.queryError)).toContainText('Syntax error');
});

test('clicking a record opens its details', async ({ page, api, config }) => {
  // The page opens Log Details on its first row by itself, so the record clicked must not be the
  // newest. The throwaway account's sign-in is newer than the suite admin's own `user.create` for
  // it, so the admin's newest record sits below a row the page selects instead.
  await recordThrowawaySignIn(api, config);
  const record = await findNewestUserAuditRecord(api, config.username);
  if (!record) {
    throw new Error(`audit.query has no record made by "${config.username}", who created "${auditUser.username}".`);
  }

  await goToAudit(page);
  await expect(page.locator(auditLocators.list.row(record))).toBeVisible({ timeout: listLoadTimeoutMs });
  await expect(page.locator(auditLocators.details.auditId)).toBeVisible();
  await expect(page.locator(auditLocators.details.auditId)).not.toHaveText(record.audit_id);

  await page.locator(auditLocators.list.user(record)).click();

  await expect(page.locator(auditLocators.details.auditId)).toHaveText(record.audit_id);
  await expect(page.locator(auditLocators.details.user)).toHaveText(config.username);
  await expect(page.locator(auditLocators.details.event)).toHaveText(record.event);
  await expect(page.locator(auditLocators.details.service)).toHaveText(serviceLabels.MIDDLEWARE);
});

for (const format of ['CSV', 'JSON'] as const) {
  test(`exporting as ${format} downloads a report holding the record`, async ({ page, api, config }) => {
    const record = await recordThrowawaySignIn(api, config);

    await goToAudit(page);
    await runBasicAuditSearch(page, auditUser.username);
    await expect(page.locator(auditLocators.list.row(record))).toBeVisible({ timeout: listLoadTimeoutMs });

    const download = await exportAuditLog(page, format);

    expect(download.suggestedFilename()).toBe(`audit_report.${format.toLowerCase()}.tgz`);
    const archive = gunzipSync(await readFile(await download.path()));
    const reports = tarMembers(archive).map(({ data }) => data.toString('utf8'));
    expect(reports).toContainEqual(expect.stringContaining(record.audit_id));
  });
}
