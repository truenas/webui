/**
 * Story: an admin moves a dataset to the performance tier.
 *
 * With tiering on, every dataset on a pool with a special vdev has a tier, and
 * the dataset details card shows it with a Change button. Change opens the
 * Change Storage Tier dialog, whose one decision is whether to also move the
 * data already written — "Move existing data", ticked by default — which starts
 * a rewrite job the card then reports as a migration badge.
 *
 * Both answers to that question are covered, because they leave the dataset in
 * different states and the UI has to report each one truthfully: a tier change
 * with no migration, and a tier change with one. Each is checked on screen and
 * through `pool.dataset.query`, which is what separates "the card re-rendered"
 * from "the appliance moved the dataset".
 *
 * A migration can also be cancelled while it runs, from the dialog its badge
 * opens. Cancelling stops the rewrite and keeps the new tier, and the third test
 * holds the UI and middleware to both halves of that.
 *
 * ## Why this spec builds its own pool
 *
 * A tier needs a special vdev, and the shared `pool` fixture has none —
 * middleware reports `tier: null` for its datasets and the UI hides every
 * control this spec drives. `ensureTierPoolPresent` builds one, and `afterAll`
 * removes it: left behind it would hold two disks `fresh-install` needs, and
 * `findOnlinePool` would hand it to the next spec as that spec's pool.
 */
import { ensureCronjobAbsent } from '../fixtures/cron';
import { entitlementFeature, isEntitled } from '../fixtures/entitlements';
import { ensureDatasetAbsent, ensureDatasetPresent, ensurePoolAbsent, findDataset } from '../fixtures/storage';
import {
  ensureMigrationStopped, ensureTierPoolPresent, establishTierBaseline, migrationSeedCommand, seedMigrationData,
  tierPoolName, unusedDatasetName,
} from '../fixtures/tiering';
import {
  applyTierChange, cancelMigration, openChangeTierDialog, openMigrationStatus, selectDataset,
} from '../flows/tiering';
import { changeTierDialogLocators, datasetTierLocators, migrationStatusDialogLocators } from '../locators/tiering';
import { type CleanupStep, leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Set per test, by `unusedDatasetName` — see there for why it is never reused. */
let dataset = '';

/** A migration of an empty dataset completes at once; this is for a slow appliance. */
const migrationTimeoutMs = 60_000;

/**
 * The pool and the switch are set up once for the file, not per test.
 *
 * Both restart the tiering daemon: `zfs.tier.update` reloads it, and building or
 * exporting a pool moves the system dataset, which restarts it again. Done per
 * test, that churn was enough for systemd to stop starting the daemon
 * (`start-limit-hit`), and the next migration failed with `[Errno 2]` — a
 * middleware defect this spec should not keep tripping over. Each test owns only
 * its dataset.
 */
test.beforeAll(async ({ api, entitlements }) => {
  // Every dataset's tier is null until tiering is on, and `zfs.tier.update`
  // refuses an appliance without the key.
  test.skip(
    !isEntitled(entitlements, entitlementFeature.zfsTier),
    'This appliance is not entitled to ZFSTIER, so middleware refuses to turn tiering on.',
  );

  await ensureTierPoolPresent(api);
  await establishTierBaseline(api, { enabled: true });
});

test.beforeEach(async ({ api }) => {
  dataset = `${tierPoolName}/${unusedDatasetName('e2e_tier')}`;
  await ensureDatasetPresent(api, dataset);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`dataset "${dataset}"`)) {
    return;
  }
  // A migration is stopped before its dataset goes, and the seed's cron job is removed in case
  // the seed failed between creating it and removing it.
  await runCleanupSteps([
    [`stop any migration of ${dataset}`, () => ensureMigrationStopped(api, dataset)],
    [`remove the cron job seeding ${dataset}`, () => ensureCronjobAbsent(api, migrationSeedCommand(dataset))],
    [`remove dataset ${dataset}`, () => ensureDatasetAbsent(api, dataset)],
  ]);
});

test.afterAll(async ({ api, entitlements }) => {
  if (leavingTestData(`pool "${tierPoolName}" and the tiering configuration`)) {
    return;
  }
  // The export is not gated on the entitlement: a pool this spec built on an
  // earlier run must go whatever this run was able to do. Turning tiering off
  // is, because middleware refuses the call outright without the key.
  await runCleanupSteps([
    [`export pool ${tierPoolName}`, () => ensurePoolAbsent(api, tierPoolName)],
    ...(isEntitled(entitlements, entitlementFeature.zfsTier)
      ? [['turn tiering off', () => establishTierBaseline(api)] as CleanupStep]
      : []),
  ]);
});

test('an admin moves a dataset to the performance tier without moving its data', async ({ page, api }) => {
  await test.step('the dataset starts on the regular tier, with no migration', async () => {
    await selectDataset(page, dataset);

    await expect(page.locator(datasetTierLocators.tier)).toHaveText('Regular');
    await expect(page.locator(datasetTierLocators.migrationStatus)).toHaveCount(0);
  });

  await test.step('change the tier with "Move existing data" unticked', async () => {
    await openChangeTierDialog(page);

    await expect(page.locator(changeTierDialogLocators.datasetName)).toHaveText(dataset);
    await expect(page.locator(changeTierDialogLocators.currentTier)).toHaveText('Regular');
    await expect(page.locator(changeTierDialogLocators.newTier)).toHaveText('Performance');

    const move = page.locator(changeTierDialogLocators.moveExistingData);
    await expect(move).toBeChecked();
    await move.setChecked(false);

    await applyTierChange(page);
  });

  await test.step('the card reports the new tier, and still no migration', async () => {
    await expect(page.locator(datasetTierLocators.tier)).toHaveText('Performance');
    await expect(page.locator(datasetTierLocators.migrationStatus)).toHaveCount(0);
  });

  await test.step('confirm middleware moved the dataset and started no rewrite', async () => {
    expect((await findDataset(api, dataset))?.tier).toEqual({ tier_type: 'PERFORMANCE', tier_job: null });
  });
});

test('an admin moves a dataset to the performance tier and migrates its data', async ({ page, api }) => {
  await test.step('change the tier with "Move existing data" left ticked', async () => {
    await selectDataset(page, dataset);
    await openChangeTierDialog(page);

    await expect(page.locator(changeTierDialogLocators.moveExistingData)).toBeChecked();
    await applyTierChange(page);
  });

  await test.step('the card reports the new tier and a completed migration', async () => {
    await expect(page.locator(datasetTierLocators.tier)).toHaveText('Performance');

    // The badge is an icon for a finished job, so its status is in the label a
    // screen reader announces rather than in any visible text.
    await expect(page.locator(datasetTierLocators.migrationStatus))
      .toHaveAttribute('aria-label', 'Migration: Complete', { timeout: migrationTimeoutMs });
  });

  await test.step('confirm middleware ran the rewrite to completion', async () => {
    const tier = (await findDataset(api, dataset))?.tier;
    expect(tier?.tier_type).toBe('PERFORMANCE');
    expect(tier?.tier_job).toMatchObject({ dataset_name: dataset, status: 'COMPLETE' });
  });

  await test.step('the badge opens the migration it reports', async () => {
    await openMigrationStatus(page);

    await expect(page.locator(migrationStatusDialogLocators.status)).toHaveText('Complete');
    await expect(page.locator(migrationStatusDialogLocators.datasetName)).toHaveText(dataset);
    await expect(page.locator(migrationStatusDialogLocators.targetTier)).toHaveText('Performance');

    await page.locator(migrationStatusDialogLocators.close).click();
    await expect(page.locator(migrationStatusDialogLocators.title)).toBeHidden();
  });
});

test('an admin cancels a running migration, and the tier change stays', async ({ page, api }) => {
  await test.step('fill the dataset, so its migration is still running when Cancel is pressed', async () => {
    await seedMigrationData(api, dataset);
  });

  await test.step('change the tier with "Move existing data" left ticked', async () => {
    await selectDataset(page, dataset);
    await openChangeTierDialog(page);

    await expect(page.locator(changeTierDialogLocators.moveExistingData)).toBeChecked();
    await applyTierChange(page);
  });

  await test.step('the badge opens a migration that has not finished', async () => {
    await openMigrationStatus(page);

    await expect(
      page.locator(migrationStatusDialogLocators.status),
      'The migration had already finished, so the seed is too small for this appliance.',
    ).toHaveText(/Running|Queued/);
  });

  await test.step('cancel it', async () => {
    await cancelMigration(page);
  });

  await test.step('the badge reports the migration cancelled, with nothing left to cancel', async () => {
    await expect(page.locator(datasetTierLocators.migrationStatus))
      .toHaveAttribute('aria-label', 'Migration: Cancelled', { timeout: migrationTimeoutMs });
    await expect(page.locator(datasetTierLocators.tier)).toHaveText('Performance');

    await openMigrationStatus(page);
    await expect(page.locator(migrationStatusDialogLocators.status)).toHaveText('Cancelled');
    await expect(page.locator(migrationStatusDialogLocators.cancel)).toHaveCount(0);

    await page.locator(migrationStatusDialogLocators.close).click();
    await expect(page.locator(migrationStatusDialogLocators.title)).toBeHidden();
  });

  await test.step('confirm middleware kept the new tier and stopped the rewrite', async () => {
    const tier = (await findDataset(api, dataset))?.tier;
    expect(tier?.tier_type).toBe('PERFORMANCE');
    expect(tier?.tier_job).toMatchObject({ dataset_name: dataset, status: 'CANCELLED' });
  });
});
