/**
 * Story: an admin opens System > Audit and it lists what middleware recorded. The newest record with a user and
 * event is read from `audit.query` before the page opens, so its row (id ending in the record's UUID) must be on
 * the first page with the same user and event. It need not be the first row: signing in and opening the page
 * record events of their own. Nothing is created, so there is no teardown; settings are `audit-settings.e2e.ts`.
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
