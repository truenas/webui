/**
 * Stories: an admin with no Storj account finds TrueCloud Backup on Data
 * Protection, opens its full list from the card, and starts adding a task — and
 * the form will not take one with its required fields left empty.
 *
 * Nothing here saves a task. `cloud_backup.create` initializes a restic
 * repository on Storj before it stores anything (see `fixtures/cloud-backup.ts`),
 * so a task needs a real account and a bucket, and neither the card's rows nor a
 * task's details page can be reached without one. What is left is what an
 * appliance with no task shows, which is also every appliance this suite boots.
 *
 * Read-only against the appliance beyond the shared pool, so there is nothing to
 * tear down.
 */
import { countCloudBackupTasks } from '../fixtures/cloud-backup';
import { leaveFieldEmpty, openCloudBackupForm, openCloudBackupList } from '../flows/cloud-backup';
import { goToDataProtection } from '../flows/navigation';
import { cloudBackupLocators } from '../locators/cloud-backup';
import type { E2eApiClient } from '../support/api/client';
import { expect, test } from '../support/fixtures';

/**
 * What a field shows once its required validator has refused it. Matched loosely
 * because the wording is the form field's, from the component library, and
 * names the field it sits under.
 */
const requiredMessage = /required/i;

/**
 * Fails up front when the appliance already holds a task.
 *
 * Both empty states render only when there is none, and this spec cannot remove
 * one: deleting a task someone made is not a test's business, and making one
 * needs Storj. Failing here says why rather than timing out on a missing banner.
 */
async function requireNoTasks(api: E2eApiClient): Promise<void> {
  const existing = await countCloudBackupTasks(api);
  expect(existing, `the empty state needs an appliance with no TrueCloud Backup task, and it has ${existing}`)
    .toBe(0);
}

/**
 * Data Protection shows its cards only on an appliance with a pool; with none it
 * shows a "create a pool" page instead. Asked of the `pool` fixture rather than
 * left to whichever earlier spec built one: that pool goes with the worker, and
 * a failure just before this spec replaces the worker. Run 39052613548.
 */
test.beforeEach(({ pool }) => {
  expect(pool).toBeTruthy();
});

test('the TrueCloud Backup card shows its empty state when there is no task', async ({ page, api }) => {
  await requireNoTasks(api);

  await goToDataProtection(page);

  const { card } = cloudBackupLocators;
  await expect(page.locator(card.empty)).toBeVisible();
  // The footer's Add renders either way; this checks the empty state did not displace it.
  await expect(page.locator(card.add)).toBeVisible();
});

test('the card title opens the full TrueCloud Backup list, empty too', async ({ page, api }) => {
  await requireNoTasks(api);

  await openCloudBackupList(page);

  // The list page's own empty state, which has its own id: the card's is gone with the route.
  await expect(page.locator(cloudBackupLocators.list.empty)).toBeVisible();
});

test('the TrueCloud Backup form refuses each required field left empty', async ({ page }) => {
  const { form } = cloudBackupLocators;

  await openCloudBackupForm(page);

  // The Storj onboarding banner heads the form only while adding.
  await expect(page.locator(form.createStorjAccount)).toBeVisible();
  // Every required field opens empty, so nothing can be saved yet.
  await expect(page.locator(form.save)).toBeDisabled();

  const requiredFields: { name: string; input: string; field: string; value: string }[] = [
    {
      name: 'Name', input: form.description, field: form.descriptionField, value: 'E2E cloud backup',
    },
    {
      name: 'Keep Last', input: form.keepLast, field: form.keepLastField, value: '3',
    },
    {
      name: 'Password', input: form.password, field: form.passwordField, value: 'e2e-backup-password',
    },
  ];

  for (const {
    name, input, field, value,
  } of requiredFields) {
    // Not shown before the field is touched, so a message afterwards is this refusal.
    await expect(page.locator(field), `${name} before it was touched`).not.toContainText(requiredMessage);

    await leaveFieldEmpty(page, input);
    await expect(page.locator(field), `${name} left empty`).toContainText(requiredMessage);

    // And withdrawn once the field has a value, so it is the validator speaking
    // and not a label that always says "required".
    await page.locator(input).fill(value);
    await expect(page.locator(field), `${name} filled in`).not.toContainText(requiredMessage);
  }

  // The source path, the credential and the bucket are still unset — the last
  // two can only be had from Storj — so Save stays held down.
  await expect(page.locator(form.save)).toBeDisabled();
});
