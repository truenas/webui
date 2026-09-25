/**
 * Story: an admin configures ZFS tiering from the storage dashboard.
 *
 * Tiering is one global switch plus three limits, edited in the Tiering side
 * panel. Everything else about the feature — the Storage Tier column in every
 * share list, the tier row on a dataset, the dataset form dropping its
 * special-vdev fields — keys off that switch, so this is where the feature
 * starts for a user.
 *
 * Each claim is settled through `zfs.tier.config`: the panel closing says the
 * app believed the save, not that the appliance holds it.
 *
 * The configuration is global, so every test starts from and returns to
 * `tierBaseline` — see `fixtures/tiering.ts`.
 */
import { entitlementFeature, isEntitled } from '../fixtures/entitlements';
import { establishTierBaseline, readTierConfig, tierBaseline } from '../fixtures/tiering';
import { openTierConfig, saveTierConfig } from '../flows/tiering';
import { tierConfigLocators } from '../locators/tiering';
import { leavingTestData } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

test.beforeEach(async ({ api, entitlements }) => {
  // `zfs.tier.update` refuses an appliance without the key, so none of this can
  // run there — including the baseline this hook is about to write.
  test.skip(
    !isEntitled(entitlements, entitlementFeature.zfsTier),
    'This appliance is not entitled to ZFSTIER, so middleware refuses every tiering change.',
  );

  await establishTierBaseline(api);
});

test.afterEach(async ({ api, entitlements }) => {
  if (!isEntitled(entitlements, entitlementFeature.zfsTier) || leavingTestData('the tiering configuration')) {
    return;
  }
  await establishTierBaseline(api);
});

test('an admin turns tiering on from the storage dashboard', async ({ page, api }) => {
  await test.step('tick Enabled in the Tiering panel and save', async () => {
    await openTierConfig(page);

    const enabled = page.locator(tierConfigLocators.enabled);
    await expect(enabled).not.toBeChecked();
    await enabled.setChecked(true);

    await saveTierConfig(page);
  });

  await test.step('confirm middleware has tiering on, and nothing else changed', async () => {
    expect(await readTierConfig(api)).toMatchObject({ ...tierBaseline, enabled: true });
  });

  await test.step('reopen the panel and find it on', async () => {
    // The panel loads from `zfs.tier.config` every time it opens, so this is the
    // app reading the stored value back rather than remembering what it sent.
    await openTierConfig(page);
    await expect(page.locator(tierConfigLocators.enabled)).toBeChecked();
  });
});

test('an admin changes the tiering limits', async ({ page, api }) => {
  const limits = {
    max_concurrent_jobs: 4,
    max_used_percentage: 90,
    special_class_metadata_reserve_pct: 15,
  };

  await test.step('set new limits in the Tiering panel and save', async () => {
    await openTierConfig(page);

    await page.locator(tierConfigLocators.maxConcurrentJobs).fill(String(limits.max_concurrent_jobs));
    await page.locator(tierConfigLocators.maxUsedPercentage).fill(String(limits.max_used_percentage));
    await page.locator(tierConfigLocators.metadataReservePct).fill(String(limits.special_class_metadata_reserve_pct));

    await saveTierConfig(page);
  });

  await test.step('confirm middleware holds them, with tiering still off', async () => {
    // Off is part of the claim: the limits are editable without turning the
    // feature on, and saving them must not turn it on as a side effect.
    expect(await readTierConfig(api)).toMatchObject({ ...limits, enabled: false });
  });
});

test('the Tiering panel will not save a limit middleware would refuse', async ({ page, api }) => {
  await openTierConfig(page);

  // One past the API's own ceiling of 10. The form mirrors the schema's bounds,
  // so it should refuse here rather than hand middleware a value it rejects.
  await page.locator(tierConfigLocators.maxConcurrentJobs).fill('11');
  await expect(page.locator(tierConfigLocators.save)).toBeDisabled();

  // And back inside the bounds, Save returns — a form that disabled Save for good
  // after any invalid input would pass the line above too.
  await page.locator(tierConfigLocators.maxConcurrentJobs).fill('10');
  await expect(page.locator(tierConfigLocators.save)).toBeEnabled();

  expect(await readTierConfig(api)).toMatchObject(tierBaseline);
});
