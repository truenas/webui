/**
 * Stories: the pool wizard refuses a name already in use, a name ZFS rejects and a pool with no
 * data vdev, and it warns about a stripe data vdev but still allows it.
 *
 * These checks all run in the browser: the name validators in `general-wizard-step.component.ts`
 * and the rules in `pool-manager-validation.service.ts`. So middleware's own tests do not cover
 * them. No test here creates a pool. Each one stops before Create Pool, and all but the
 * reserved-name test check through `pool.query` that the pool they named was not made.
 *
 * The General step's Next is bound to `form.invalid`, and both name validators are async. While
 * they run the form is PENDING, which is not invalid, so Next reads enabled. That is why a test
 * that expects Next to be disabled first waits for the field's error text: only then has the
 * validator answered. Going the other way, back to an accepted name, nothing on screen marks the
 * answer, so that test waits for `pool.validate_name`'s reply on the page's socket.
 *
 * Not covered: mixed disk sizes and capacity warnings (the CI disks are all the same), dRAID
 * warnings, special and dedup redundancy warnings, and the exported-pool and duplicate-serial
 * disk warnings.
 */
import { ensurePoolAbsent, findPool, requireUnusedDisks } from '../fixtures/storage';
import {
  configureAutomatedVdevs, goToReview, openPoolWizard, startPoolWizard,
} from '../flows/storage';
import { poolWizardLocators } from '../locators/storage';
import { apiCallsTo } from '../support/api-calls';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

// For the first test: the only sign that the name check has answered a valid name.
test.use({ recordApiCalls: true });

/** Names a passing run never creates. Removed before and after each test in case one was. */
const uniquePool = 'e2e_wizard_unique';
const emptyPool = 'e2e_wizard_empty';
const stripePool = 'e2e_wizard_stripe';
const pools = [uniquePool, emptyPool, stripePool];

/**
 * A reserved vdev word. libzfs's `pool_namecheck` refuses `mirror`, which is what
 * `pool.validate_name` calls through `truenas_pylibzfs.name_is_valid`.
 */
const reservedName = 'mirror';

/** Called by the Name field's async validator once the value has settled for 300 ms. */
const validateNameMethod = 'pool.validate_name';

const validationTimeoutMs = 15_000;

test.beforeEach(async ({ api }) => {
  for (const pool of pools) {
    await ensurePoolAbsent(api, pool);
  }
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the pools ${pools.join(', ')}`)) {
    return;
  }

  await runCleanupSteps(pools.map((pool): [string, () => Promise<void>] => [
    `remove the pool "${pool}"`, () => ensurePoolAbsent(api, pool),
  ]));
});

test('the wizard refuses a pool name that is already in use', async ({ page, api, pool }) => {
  await startPoolWizard(page);
  const name = page.locator(poolWizardLocators.name);
  const nameField = page.locator(poolWizardLocators.nameField);
  const next = page.locator(poolWizardLocators.next);

  // A free name first. The form opens with an empty, required name, so Next starts disabled,
  // and a refusal asserted straight away would pass without the name check having run.
  await name.fill(uniquePool);
  await name.blur();
  await expect(next).toBeEnabled();

  await name.fill(pool);
  await name.blur();
  await expect(nameField).toContainText('already in use', { timeout: validationTimeoutMs });
  await expect(next).toBeDisabled();

  // Back to a free name. Here the PENDING window would hide a refusal: the error clears and Next
  // enables before either validator has answered. So wait for `pool.validate_name`, the slower of
  // the two, to answer this value before reading the field.
  const validationsBefore = apiCallsTo(page, validateNameMethod).length;
  await name.fill(uniquePool);
  await name.blur();
  await expect.poll(
    () => apiCallsTo(page, validateNameMethod).slice(validationsBefore).map((call) => call.answer),
    { timeout: validationTimeoutMs },
  ).toContain('result');
  await expect(nameField).not.toContainText('already in use');
  await expect(next).toBeEnabled();

  // Nothing was made, and the pool whose name was taken is still there.
  expect(await findPool(api, uniquePool)).toBeUndefined();
  expect(await findPool(api, pool)).toBeDefined();
});

test('the wizard refuses a pool name that ZFS rejects', async ({ page }) => {
  await startPoolWizard(page);
  const name = page.locator(poolWizardLocators.name);
  const nameField = page.locator(poolWizardLocators.nameField);
  const next = page.locator(poolWizardLocators.next);

  await name.fill(uniquePool);
  await name.blur();
  await expect(next).toBeEnabled();

  // This one is a round trip: the validator calls `pool.validate_name`, and the field shows
  // its refusal, whether that comes back as `false` or as a validation error.
  await name.fill(reservedName);
  await name.blur();
  await expect(nameField).toContainText('Invalid pool name', { timeout: validationTimeoutMs });
  await expect(next).toBeDisabled();
});

test('the wizard will not create a pool with no data vdev', async ({ page, api }) => {
  await openPoolWizard(page, emptyPool);

  // Straight to Review, with nothing chosen on the Data step.
  await goToReview(page, 'data');

  await expect(
    page.locator(poolWizardLocators.reviewWarnings).filter({ hasText: 'At least 1 data VDEV is required.' }),
  ).toHaveCount(1);
  await expect(page.locator(poolWizardLocators.createPool)).toBeDisabled();
  await expect(page.locator(poolWizardLocators.inspectVdevs)).toHaveCount(0);

  expect(await findPool(api, emptyPool)).toBeUndefined();
});

test('the wizard warns about a stripe data vdev, and still allows it', async ({ page, api }) => {
  await requireUnusedDisks(api, 1);
  const stripeWarning = 'A stripe data VDEV is highly discouraged';

  await openPoolWizard(page, stripePool);

  // No layout chosen yet, so no warning. This is what makes the next check about the stripe.
  await expect(page.locator(poolWizardLocators.dataStepWarning)).toHaveCount(0);

  await configureAutomatedVdevs(page, 'data', { layout: 'Stripe', width: 1, vdevs: 1 });
  await expect(page.locator(poolWizardLocators.dataStepWarning)).toContainText(stripeWarning);

  await goToReview(page, 'data');
  await expect(
    page.locator(poolWizardLocators.reviewWarnings).filter({ hasText: stripeWarning }),
  ).toHaveCount(1);
  // With a vdev, Inspect VDEVs is there. This is what shows its absence in the test above is real.
  await expect(page.locator(poolWizardLocators.inspectVdevs)).toBeVisible();
  // A warning, not an error: Create Pool stays enabled. It is never clicked.
  await expect(page.locator(poolWizardLocators.createPool)).toBeEnabled();

  expect(await findPool(api, stripePool)).toBeUndefined();
});
