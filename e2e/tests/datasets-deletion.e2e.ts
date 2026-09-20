/**
 * Story: the delete-dataset confirmation gate cannot be bypassed.
 *
 * The dialog asks for two things before it will destroy a dataset — its name
 * typed back, and a Confirm tick — and disables its button until it has both.
 * That disabled button was, for three months, the *only* thing enforcing the
 * gate: the tn-dialog migration moved the dialog's actions outside `<form>`,
 * leaving a form with one text input and no submit button, which is precisely
 * the shape the HTML spec submits when Enter is pressed in a text field. The
 * handler did not re-check validity, so Enter in the name field destroyed the
 * dataset with both gates untouched.
 *
 * Nothing below this layer could see it. The unit tests asserted the button is
 * disabled, and it genuinely was; the browser submitted the form anyway. So the
 * claims here are deliberately about the *keyboard*, not about the button, and
 * each is checked through `pool.dataset.query` — a dialog that stayed open is
 * not evidence the dataset survived, and a dialog that closed is not evidence
 * it went.
 *
 * The pair matters as much as either half. A guard that blocks Enter always
 * would pass the first two tests and break deletion for anyone who does not
 * reach for the mouse, so "Enter still submits a completed form" is a claim in
 * its own right.
 */
import { ensureDatasetAbsent, ensureZvolPresent, ensureDatasetPresent, findDataset } from '../fixtures/storage';
import { fillDatasetDeletionConfirmation, openDeleteDatasetDialog } from '../flows/storage';
import { deleteDatasetDialogLocators } from '../locators/storage';
import { expect, test } from '../support/fixtures';

/** Deleted by the tests that submit, and left behind by the ones that must not. */
const target = 'e2e_delete_target';
/** A sibling nothing here ever confirms, so nothing here may ever remove it. */
const bystander = 'e2e_delete_bystander';

test.beforeEach(async ({ api, pool }) => {
  await ensureDatasetAbsent(api, `${pool}/${target}`);
  await ensureDatasetAbsent(api, `${pool}/${bystander}`);
});

test.afterEach(async ({ api, pool }) => {
  await ensureDatasetAbsent(api, `${pool}/${target}`);
  await ensureDatasetAbsent(api, `${pool}/${bystander}`);
});

test('pressing Enter in the name field does not delete an unconfirmed dataset', async ({ page, api, pool }) => {
  const dataset = `${pool}/${target}`;
  await ensureDatasetPresent(api, dataset);
  await ensureDatasetPresent(api, `${pool}/${bystander}`);

  await openDeleteDatasetDialog(page, dataset);

  // Nothing typed, nothing ticked — the state the dialog opens in.
  await expect(page.locator(deleteDatasetDialogLocators.submit)).toBeDisabled();
  await page.locator(deleteDatasetDialogLocators.name).press('Enter');

  // Completing the confirmation now does double duty, and both halves are
  // needed. It is the tell: the bug closed this dialog the moment its delete
  // succeeded, so a dialog that still accepts the name and still enables its
  // button is one the keypress did not submit. And it is a round trip through
  // the app, so a delete that keypress *had* started has landed by the time
  // the appliance is asked below — asserting straight after the press races
  // the very call it is trying to rule out, and would pass either way.
  await fillDatasetDeletionConfirmation(page, dataset);

  expect(await findDataset(api, dataset)).toBeDefined();
  expect(await findDataset(api, `${pool}/${bystander}`)).toBeDefined();
});

test('pressing Enter in the name field does not delete an unconfirmed zvol', async ({ page, api, pool }) => {
  // A zvol reaches the same dialog by a different route — `isZvol` only changes
  // the wording — and it is the case the bug was reported against.
  const zvol = `${pool}/${target}`;
  await ensureZvolPresent(api, zvol);

  await openDeleteDatasetDialog(page, zvol);

  await expect(page.locator(deleteDatasetDialogLocators.submit)).toBeDisabled();
  await page.locator(deleteDatasetDialogLocators.name).press('Enter');

  await fillDatasetDeletionConfirmation(page, zvol);
  expect(await findDataset(api, zvol)).toBeDefined();
});

test('typing the wrong name and pressing Enter does not delete the dataset', async ({ page, api, pool }) => {
  const dataset = `${pool}/${target}`;
  await ensureDatasetPresent(api, dataset);

  await openDeleteDatasetDialog(page, dataset);

  // A filled-in field is not a satisfied gate: the validator wants this exact
  // name. An emptiness check alone would let this through.
  await page.locator(deleteDatasetDialogLocators.name).fill(`${target}-not-really`);
  await page.locator(deleteDatasetDialogLocators.confirm).click();
  await expect(page.locator(deleteDatasetDialogLocators.submit)).toBeDisabled();

  await page.locator(deleteDatasetDialogLocators.name).press('Enter');

  await fillDatasetDeletionConfirmation(page, dataset);
  expect(await findDataset(api, dataset)).toBeDefined();
});

test('a fully confirmed deletion removes the dataset', async ({ page, api, pool }) => {
  const dataset = `${pool}/${target}`;
  await ensureDatasetPresent(api, dataset);
  await ensureDatasetPresent(api, `${pool}/${bystander}`);

  await openDeleteDatasetDialog(page, dataset);
  await fillDatasetDeletionConfirmation(page, dataset);
  await page.locator(deleteDatasetDialogLocators.submit).click();

  await expect.poll(() => findDataset(api, dataset)).toBeUndefined();
  // Deleting is recursive; it must still stop at the dataset it was given.
  expect(await findDataset(api, `${pool}/${bystander}`)).toBeDefined();
});

test('Enter still submits once both gates are satisfied', async ({ page, api, pool }) => {
  const dataset = `${pool}/${target}`;
  await ensureDatasetPresent(api, dataset);

  await openDeleteDatasetDialog(page, dataset);
  await fillDatasetDeletionConfirmation(page, dataset);

  // The counterweight to the three tests above: the fix re-checks validity
  // rather than swallowing the key, so a completed form still submits from the
  // keyboard.
  await page.locator(deleteDatasetDialogLocators.name).press('Enter');

  await expect.poll(() => findDataset(api, dataset)).toBeUndefined();
});
