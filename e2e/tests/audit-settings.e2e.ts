/**
 * Stories: an admin changes the audit settings from the Audit card on
 * System > Advanced Settings, and the appliance keeps what they saved.
 *
 * Each save is asserted twice, the way the other Advanced Settings specs do it:
 * the card's readouts say the screen believed it, `audit.config` says the
 * appliance did it.
 *
 * One test changes every field, starting from the defaults, and sets a
 * reservation and a quota. The other starts with both set and takes them away
 * again, which the card shows as `None`. Between them, every field is changed.
 *
 * The settings are one config record, so there is nothing to delete afterwards.
 * Teardown writes middleware's defaults back. See `fixtures/audit.ts`.
 */
import { auditBaseline, readAuditSettings, setAuditSettings } from '../fixtures/audit';
import { fillAuditForm, openAuditForm, saveAuditForm } from '../flows/audit';
import { auditLocators } from '../locators/audit';
import { leavingTestData } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Written before each test as well as after, so an interrupted run leaves the next one able to start. */
test.beforeEach(async ({ api }) => {
  await setAuditSettings(api, auditBaseline);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData('the audit settings as the test left them')) {
    return;
  }

  await setAuditSettings(api, auditBaseline);
});

test('an admin changes every audit setting, and the appliance keeps them', async ({ page, api }) => {
  const changed = {
    retention: 14,
    reservation: 1,
    quota: 2,
    quota_fill_warning: 60,
    quota_fill_critical: 90,
  };

  await openAuditForm(page, auditBaseline.retention);
  await fillAuditForm(page, changed);
  await saveAuditForm(page);

  await expect(page.locator(auditLocators.card.retention)).toHaveText('14 days');
  await expect(page.locator(auditLocators.card.reservation)).toHaveText('1 GiB');
  await expect(page.locator(auditLocators.card.quota)).toHaveText('2 GiB');
  await expect(page.locator(auditLocators.card.quotaFillWarning)).toHaveText('60%');
  await expect(page.locator(auditLocators.card.quotaFillCritical)).toHaveText('90%');

  expect(await readAuditSettings(api)).toEqual(changed);
});

/**
 * Written in a hook, like the second syslog test, so the starting state is in
 * place before `page` signs in and before anything in the app has read it. The
 * file-level `beforeEach` runs first, so this lands on top of it.
 */
test.describe('starting with a reservation and a quota', () => {
  const start = {
    retention: 30,
    reservation: 1,
    quota: 3,
    quota_fill_warning: 70,
    quota_fill_critical: 85,
  };

  test.beforeEach(async ({ api }) => {
    await setAuditSettings(api, start);
  });

  test('an admin removes the reservation and the quota', async ({ page, api }) => {
    const changed = {
      retention: 10,
      reservation: 0,
      quota: 0,
      quota_fill_warning: 65,
      quota_fill_critical: 80,
    };

    await openAuditForm(page, start.retention);
    await expect(page.locator(auditLocators.card.reservation)).toHaveText('1 GiB');
    await expect(page.locator(auditLocators.card.quota)).toHaveText('3 GiB');
    // The values the API wrote are in the form. That is what makes clearing them a real edit.
    await expect(page.locator(auditLocators.form.quota)).toHaveValue('3');

    await fillAuditForm(page, changed);
    await saveAuditForm(page);

    await expect(page.locator(auditLocators.card.retention)).toHaveText('10 days');
    await expect(page.locator(auditLocators.card.reservation)).toHaveText('None');
    await expect(page.locator(auditLocators.card.quota)).toHaveText('None');
    await expect(page.locator(auditLocators.card.quotaFillWarning)).toHaveText('65%');
    await expect(page.locator(auditLocators.card.quotaFillCritical)).toHaveText('80%');

    expect(await readAuditSettings(api)).toEqual(changed);
  });
});
