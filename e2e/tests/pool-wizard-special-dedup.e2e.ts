/**
 * Stories: an admin creates a pool with a mirrored special vdev and a mirrored dedup vdev through
 * the pool wizard, and the appliance holds both; the wizard warns when a special vdev has less
 * redundancy than the data vdev; and it warns about a stripe dedup vdev.
 *
 * Losing a special or dedup vdev destroys the pool, which is why the wizard gives these two
 * warnings (`validateRedundancyMismatch`, `validateStripeVdevsWarning`). Both are warnings, not
 * errors: Create Pool stays enabled.
 *
 * The Special step's own name is `metadata`, so its buttons and its warning say `metadata` while
 * its Review row, preview row and topology key say `special`.
 *
 * A stripe special or dedup vdev is offered only while the data vdev is a stripe too
 * (`resolveParityLock`), so the stripe test builds a stripe data vdev first. The wizard then warns
 * about both stripes, and the test checks the dedup one.
 *
 * Every test owns its pool by name. Each name is removed before and after every test, whatever
 * happened, because a pool left behind holds its disks. The warning tests stop at Review and create
 * nothing.
 *
 * Not covered: adding a special or dedup vdev to an existing pool from Add VDEV, and its
 * mixed-layout warnings; the Force checkbox on Review; tier labels, which belong to the tiering
 * specs.
 */
import type { Page } from '@playwright/test';
import { readPoolTopology, type TopologyVdev } from '../fixtures/pool';
import { ensurePoolAbsent, findPool, requireUnusedDisks } from '../fixtures/storage';
import {
  configureAutomatedVdevs, goToReview, openPoolWizard, submitPool,
} from '../flows/storage';
import { poolCardLocators, poolWizardLocators } from '../locators/storage';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const specialPool = 'e2e_wizard_special';
const specialWarnPool = 'e2e_wizard_special_warn';
const dedupStripePool = 'e2e_wizard_dedup_stripe';
const pools = [specialPool, specialWarnPool, dedupStripePool];

/** Two each for the data, special and dedup mirrors. */
const specialDisks = 6;
/** Four for the RAIDZ2 data vdev, two for the special mirror. */
const specialWarnDisks = 6;
/** One for the stripe data vdev, one for the stripe dedup. */
const dedupStripeDisks = 2;

const specialMismatchWarning = 'The metadata VDEV redundancy is lower than the data VDEV redundancy';
const dedupMismatchWarning = 'The dedup VDEV redundancy is lower than the data VDEV redundancy';
const dedupStripeWarning = 'A stripe dedup VDEV is highly discouraged';

/** Leaves the Data step and crosses Log, Spare and Cache with nothing chosen, onto Special. */
async function skipToSpecialStep(page: Page): Promise<void> {
  await page.locator(poolWizardLocators.nextStep('data')).click();
  await page.locator(poolWizardLocators.nextStep('log')).click();
  await page.locator(poolWizardLocators.nextStep('spare')).click();
  await page.locator(poolWizardLocators.nextStep('cache')).click();
  await expect(page.locator(poolWizardLocators.diskSize('special'))).toBeVisible();
}

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

const specialTitle = 'an admin creates a pool with a mirrored special vdev and a mirrored dedup vdev, '
  + 'and the appliance holds both';

test(specialTitle, async ({ page, api }) => {
  await requireUnusedDisks(api, specialDisks);

  await openPoolWizard(page, specialPool);
  await configureAutomatedVdevs(page, 'data', { layout: 'Mirror', width: 2, vdevs: 1 });
  await skipToSpecialStep(page);

  await configureAutomatedVdevs(page, 'special', { layout: 'Mirror', width: 2, vdevs: 1 });
  // The preview showing the special mirror is the sign the topology, and so the validation, has
  // caught up. Equal parity to the data mirror, so no warning.
  await expect(page.locator(poolWizardLocators.configPreview('special'))).toContainText('1 × MIRROR | 2 ×');
  await expect(page.locator(poolWizardLocators.metadataStepWarning)).toHaveCount(0);
  await page.locator(poolWizardLocators.nextStep('special')).click();

  await configureAutomatedVdevs(page, 'dedup', { layout: 'Mirror', width: 2, vdevs: 1 });
  await expect(page.locator(poolWizardLocators.configPreview('dedup'))).toContainText('1 × MIRROR | 2 ×');
  await expect(page.locator(poolWizardLocators.dedupStepWarning)).toHaveCount(0);
  await goToReview(page, 'dedup');

  await expect(page.locator(poolWizardLocators.reviewCategory('data'))).toContainText('1 × MIRROR | 2 ×');
  await expect(page.locator(poolWizardLocators.reviewCategory('special'))).toContainText('1 × MIRROR | 2 ×');
  await expect(page.locator(poolWizardLocators.reviewCategory('dedup'))).toContainText('1 × MIRROR | 2 ×');
  await expect(
    page.locator(poolWizardLocators.reviewWarnings).filter({ hasText: specialMismatchWarning }),
  ).toHaveCount(0);
  await expect(
    page.locator(poolWizardLocators.reviewWarnings).filter({ hasText: dedupMismatchWarning }),
  ).toHaveCount(0);

  await submitPool(page);

  await expect(page.locator(poolCardLocators.name(specialPool))).toBeVisible();
  await expect(page.locator(poolCardLocators.vdevs(specialPool, 'special'))).toContainText('1 x MIRROR | 2 wide');
  await expect(page.locator(poolCardLocators.vdevs(specialPool, 'dedup'))).toContainText('1 x MIRROR | 2 wide');

  const topology = await readPoolTopology(api, specialPool);
  const shape = (vdevs: TopologyVdev[]): { type: string; width: number }[] => (
    vdevs.map((vdev) => ({ type: vdev.type, width: vdev.children.length }))
  );
  expect(shape(topology.data)).toEqual([{ type: 'MIRROR', width: 2 }]);
  expect(shape(topology.special)).toEqual([{ type: 'MIRROR', width: 2 }]);
  expect(shape(topology.dedup)).toEqual([{ type: 'MIRROR', width: 2 }]);

  // Six different disks: neither step handed out a disk another step had already taken.
  const members = [...topology.data, ...topology.special, ...topology.dedup]
    .flatMap((vdev) => vdev.children.map((child) => child.disk));
  expect(new Set(members.filter(Boolean)).size).toBe(specialDisks);
});

test('the wizard warns about a special vdev with less redundancy than RAIDZ2 data', async ({ page, api }) => {
  await requireUnusedDisks(api, specialWarnDisks);

  await openPoolWizard(page, specialWarnPool);
  await configureAutomatedVdevs(page, 'data', { layout: 'RAIDZ2', width: 4, vdevs: 1 });
  await skipToSpecialStep(page);

  // No special vdev chosen yet, so no warning. This is what makes the next check about the mirror.
  await expect(page.locator(poolWizardLocators.metadataStepWarning)).toHaveCount(0);

  await configureAutomatedVdevs(page, 'special', { layout: 'Mirror', width: 2, vdevs: 1 });
  await expect(page.locator(poolWizardLocators.metadataStepWarning)).toContainText(specialMismatchWarning);

  await goToReview(page, 'special');
  await expect(page.locator(poolWizardLocators.reviewCategory('special'))).toContainText('1 × MIRROR | 2 ×');
  await expect(
    page.locator(poolWizardLocators.reviewWarnings).filter({ hasText: specialMismatchWarning }),
  ).toHaveCount(1);
  // A warning, not an error: Create Pool stays enabled. It is never clicked.
  await expect(page.locator(poolWizardLocators.createPool)).toBeEnabled();

  expect(await findPool(api, specialWarnPool)).toBeUndefined();
});

test('the wizard warns about a stripe dedup vdev, and still allows it', async ({ page, api }) => {
  await requireUnusedDisks(api, dedupStripeDisks);

  await openPoolWizard(page, dedupStripePool);
  // Stripe data, because only then is Stripe offered on the Dedup step.
  await configureAutomatedVdevs(page, 'data', { layout: 'Stripe', width: 1, vdevs: 1 });
  await skipToSpecialStep(page);
  await page.locator(poolWizardLocators.nextStep('special')).click();

  // No dedup vdev chosen yet, so no warning. This is what makes the next check about the stripe.
  await expect(page.locator(poolWizardLocators.diskSize('dedup'))).toBeVisible();
  await expect(page.locator(poolWizardLocators.dedupStepWarning)).toHaveCount(0);

  await configureAutomatedVdevs(page, 'dedup', { layout: 'Stripe', width: 1, vdevs: 1 });
  await expect(page.locator(poolWizardLocators.dedupStepWarning)).toContainText(dedupStripeWarning);

  await goToReview(page, 'dedup');
  await expect(page.locator(poolWizardLocators.reviewCategory('dedup'))).toContainText('STRIPE');
  await expect(
    page.locator(poolWizardLocators.reviewWarnings).filter({ hasText: dedupStripeWarning }),
  ).toHaveCount(1);
  await expect(page.locator(poolWizardLocators.createPool)).toBeEnabled();

  expect(await findPool(api, dedupStripePool)).toBeUndefined();
});
