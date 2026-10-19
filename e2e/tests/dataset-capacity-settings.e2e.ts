/**
 * Stories: an admin sets and removes a dataset's own quotas, reservations and quota warning
 * threshold from the Space Management card, and the form refuses a quota below 1 GiB.
 *
 * Every save is asserted on the card and through `pool.dataset.query`. The API check is the
 * stronger one: the sizes are typed as `2 GiB` and have to reach middleware as byte counts, and the
 * form sends only the fields that changed, so a field it dropped would still look right on the
 * card until the next reload.
 *
 * The dataset is the spec's own and is recreated around every test, so no quota or reservation
 * outlives it. A leaked reservation would hold pool space from every later test.
 */
import { readCapacity, setCapacity } from '../fixtures/dataset-capacity';
import { ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { openCapacitySettings } from '../flows/dataset-capacity';
import { saveDatasetForm } from '../flows/storage';
import { datasetCapacityLocators } from '../locators/dataset-capacity';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const mib = 1024 * 1024;
const gib = 1024 * mib;

/** Under the shared pool. */
const datasetLeaf = 'e2e_capacity';

/** What the first story sets through the form, and what the second provisions before removing. */
const configured = {
  refquota: 2 * gib,
  quota: 3 * gib,
  refreservation: gib,
  reservation: gib,
  refquotaWarning: 70,
};

/** `helptextDatasetForm.quotaTooSmall`. */
const quotaTooSmallMessage = 'Quota size is too small. Enter a value of 1 GiB or larger.';

const card = datasetCapacityLocators.card;
const form = datasetCapacityLocators.form;

test.beforeEach(async ({ api, pool }) => {
  const dataset = `${pool}/${datasetLeaf}`;
  await ensureDatasetAbsent(api, dataset);
  await ensureDatasetPresent(api, dataset);
});

test.afterEach(async ({ api, pool }) => {
  const dataset = `${pool}/${datasetLeaf}`;
  if (leavingTestData(`the dataset "${dataset}"`)) {
    return;
  }

  await runCleanupSteps([
    [`remove the dataset "${dataset}"`, () => ensureDatasetAbsent(api, dataset)],
  ]);
});

test('an admin sets quotas, reservations and a quota warning on a dataset', async ({ page, api, pool }) => {
  const dataset = `${pool}/${datasetLeaf}`;

  await openCapacitySettings(page, dataset);
  await page.locator(form.refquota).fill('2 GiB');
  await page.locator(form.quota).fill('3 GiB');
  await page.locator(form.refreservation).fill('1 GiB');
  await page.locator(form.reservation).fill('1 GiB');
  // Ticked on a fresh dataset, which disables the input. Middleware reports a threshold the pool
  // root holds as LOCAL, so under such a root the box starts unticked and this changes nothing.
  await page.locator(form.refquotaWarningInherit).setChecked(false);
  await page.locator(form.refquotaWarning).fill('70');
  await saveDatasetForm(page);

  // The quota for the dataset and its children takes precedence on the card when both are set.
  await expect(page.locator(card.appliedQuota)).toHaveText('3 GiB (applies to descendants)');
  await expect(page.locator(card.reservedForDataset)).toHaveText('1 GiB');
  await expect(page.locator(card.reservedForDatasetAndChildren)).toHaveText('1 GiB');

  expect(await readCapacity(api, dataset)).toEqual({
    refquota: configured.refquota,
    quota: configured.quota,
    refreservation: configured.refreservation,
    reservation: configured.reservation,
    refquotaWarning: String(configured.refquotaWarning),
  });
});

test('an admin removes the quotas and reservations, and the threshold is inherited again', async ({
  page, api, pool,
}) => {
  const dataset = `${pool}/${datasetLeaf}`;
  const { refquotaWarning: inheritedWarning } = await readCapacity(api, pool);
  // Otherwise inheriting it again would read the same as keeping it.
  expect(inheritedWarning).not.toBe(String(configured.refquotaWarning));
  await setCapacity(api, dataset, configured);

  await openCapacitySettings(page, dataset);
  // Seen first, so that its going away below is the save and not a card still loading.
  await expect(page.locator(card.appliedQuota)).toBeVisible();
  await expect(page.locator(form.refquotaWarningInherit)).not.toBeChecked();

  await page.locator(form.refquota).fill('');
  await page.locator(form.quota).fill('');
  await page.locator(form.refreservation).fill('');
  await page.locator(form.reservation).fill('');
  await page.locator(form.refquotaWarningInherit).setChecked(true);
  await saveDatasetForm(page);

  await expect(page.locator(card.appliedQuota)).toBeHidden();
  await expect(page.locator(card.reservedForDataset)).toBeHidden();
  await expect(page.locator(card.reservedForDatasetAndChildren)).toBeHidden();

  // A cleared size is sent as `0`, and Inherit as `INHERIT`, which drops the local value.
  expect(await readCapacity(api, dataset)).toEqual({
    refquota: 0,
    quota: 0,
    refreservation: 0,
    reservation: 0,
    refquotaWarning: inheritedWarning,
  });
});

test('the form refuses a quota below 1 GiB, and nothing is sent', async ({ page, api, pool }) => {
  const dataset = `${pool}/${datasetLeaf}`;

  await openCapacitySettings(page, dataset);
  // Not shown for an unset quota, so a message afterwards is this refusal.
  await expect(page.locator(form.refquotaField)).not.toContainText(quotaTooSmallMessage);

  await page.locator(form.refquota).fill('512 MiB');
  await page.locator(form.refquota).blur();

  await expect(page.locator(form.refquotaField)).toContainText(quotaTooSmallMessage);
  await expect(page.locator(form.save)).toBeDisabled();
  expect((await readCapacity(api, dataset)).refquota).toBe(0);
});
