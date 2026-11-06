/**
 * Story: the delete-dataset confirmation gate (name typed back plus Confirm tick) cannot be bypassed by Enter.
 * The dialog's form has one text input and no submit button, which HTML submits on Enter, so the disabled button
 * alone does not enforce the gate and unit tests cannot see it. Claims are about the keyboard, each checked through
 * `pool.dataset.query`: an open or closed dialog is no evidence either way. "Enter still submits a completed form"
 * matters too, since a guard that always blocked Enter would pass the first two tests.
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

  // Completing the confirmation is the tell: the bug closed the dialog once its delete succeeded, so a dialog that
  // still accepts the name and enables its button was not submitted by the keypress. It is also a round trip
  // through the app, so any delete the keypress started has landed before the appliance is asked below; asserting
  // straight after the press would race that call and pass either way.
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

  // Confirm is already ticked here, so correcting the name is round trip
  // enough — and `fillDatasetDeletionConfirmation` must NOT be used, because
  // its own click would toggle that tick back off. Reaching an enabled button
  // proves the dialog survived the keypress.
  await page.locator(deleteDatasetDialogLocators.name).fill(dataset);
  await expect(page.locator(deleteDatasetDialogLocators.submit)).toBeEnabled();

  expect(await findDataset(api, dataset)).toBeDefined();
});

test('a fully confirmed deletion removes the dataset', async ({ page, api, pool }) => {
  const dataset = `${pool}/${target}`;
  await ensureDatasetPresent(api, dataset);
  await ensureDatasetPresent(api, `${pool}/${bystander}`);

  await openDeleteDatasetDialog(page, dataset);
  await fillDatasetDeletionConfirmation(page, dataset);
  await page.locator(deleteDatasetDialogLocators.submit).click();

  await expect.poll(() => tolerating(() => findDataset(api, dataset))).toBeUndefined();
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

  await expect.poll(() => tolerating(() => findDataset(api, dataset))).toBeUndefined();
});

/**
 * Runs a poll generator, turning a rejection into "no answer yet". Playwright awaits an `expect.poll` generator
 * outside its own try/catch, so a rejection aborts the poll instead of costing one attempt (see `readServiceState`
 * in `tests/unauthenticated/fresh-install.e2e.ts`). A transport blip must not read as "the dataset is still there".
 */
async function tolerating<T>(read: () => Promise<T>): Promise<T | undefined> {
  try {
    return await read();
  } catch {
    return undefined;
  }
}
