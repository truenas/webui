/**
 * Story: an admin opens the Audit page under System and it lists what middleware recorded.
 *
 * The page lists middleware's records, newest first. The spec reads the newest record that has a
 * user and an event from `audit.query` before it opens the page, so that record is on the first
 * page the app loads, behind only what was recorded in the seconds between. Its row has to be
 * there, carrying the same user and event. A row id ends in the record's UUID, so the row cannot
 * be one the page made up or one left over from an earlier run.
 *
 * Signing in and opening the page record events of their own, which is why the record is not
 * expected to be the first row.
 *
 * Nothing is created, so there is no teardown. The audit settings on System > Advanced Settings
 * are `audit-settings.e2e.ts`.
 */
import { findNewestAuditRecord } from '../fixtures/audit';
import { goToAudit } from '../flows/navigation';
import { auditLocators } from '../locators/audit';
import { expect, test } from '../support/fixtures';

/** The page counts the records before it loads the first page of them. */
const listLoadTimeoutMs = 30_000;

test('an admin opens Audit, and it lists the newest middleware record', async ({ page, api }) => {
  const record = await findNewestAuditRecord(api);
  if (!record) {
    throw new Error('audit.query has no recent middleware record with a user and an event to look for.');
  }

  await goToAudit(page);

  await expect(page.locator(auditLocators.list.row(record))).toBeVisible({ timeout: listLoadTimeoutMs });
  await expect(page.locator(auditLocators.list.user(record))).toHaveText(record.username);
  await expect(page.locator(auditLocators.list.event(record))).toHaveText(record.event);
});
