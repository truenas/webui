/**
 * Story: an admin changes a share's storage tier from its row on the Shares
 * dashboard, and the row offers that only when it can act on it.
 *
 * With tiering on, the SMB and NFS cards grow a Storage Tier column, and each
 * row's menu a Change Storage Tier action that opens the same dialog as the
 * dataset details card, for the dataset under the share's path. The action is
 * hidden while tiering is off — the column with it — and on a share whose
 * dataset is locked. Each tier change is checked in the row and through
 * `pool.dataset.query`, which is what separates "the cell re-rendered" from
 * "the appliance moved the dataset".
 *
 * Every "the action is not there" is asserted with the menu open and its Edit
 * showing, so it cannot pass on a menu that never opened.
 *
 * The pool is `tiering-dataset.e2e.ts`'s, built once for the file for the same
 * reason: each create, export and tiering switch restarts the tiering daemon,
 * and done per test that is enough for systemd to stop starting it.
 */
import { ensureEncryptedDatasetPresent, lockDataset } from '../fixtures/encryption';
import { entitlementFeature, isEntitled } from '../fixtures/entitlements';
import { ensureNfsShareAbsent, ensureNfsSharePresent } from '../fixtures/nfs';
import { ensureSmbShareAbsent, ensureSmbSharePresent } from '../fixtures/smb';
import {
  datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent, ensurePoolAbsent, findDataset,
} from '../fixtures/storage';
import {
  ensureTierPoolPresent, establishTierBaseline, tierPoolName, unusedDatasetName,
} from '../fixtures/tiering';
import { goToDatasets, goToShares } from '../flows/navigation';
import { applyTierChange, openChangeTierDialogFromShareRow } from '../flows/tiering';
import { nfsLocators } from '../locators/nfs';
import { smbLocators } from '../locators/smb';
import { changeTierDialogLocators } from '../locators/tiering';
import { type CleanupStep, leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** The SMB share every SMB story uses. Its dataset changes per test. */
const smbShare = 'e2e_tier_share';

/** Set per test, by `unusedDatasetName` — see there for why it is never reused. */
let dataset = '';

/** Meets middleware's minimum length; not a credential of anything. */
const passphrase = 'e2e-tier-passphrase';

test.beforeAll(async ({ api, entitlements }) => {
  test.skip(
    !isEntitled(entitlements, entitlementFeature.zfsTier),
    'This appliance is not entitled to ZFSTIER, so middleware refuses to turn tiering on.',
  );

  await ensureTierPoolPresent(api);
});

test.beforeEach(async ({ api }) => {
  dataset = `${tierPoolName}/${unusedDatasetName('e2e_tier_share')}`;
  await ensureSmbShareAbsent(api, smbShare);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`share "${smbShare}", the NFS share on "${dataset}" and dataset "${dataset}"`)) {
    return;
  }

  // Shares before the dataset they point at.
  await runCleanupSteps([
    [`remove share ${smbShare}`, () => ensureSmbShareAbsent(api, smbShare)],
    [`remove the NFS share on ${dataset}`, () => ensureNfsShareAbsent(api, datasetMountPath(dataset))],
    [`remove dataset ${dataset}`, () => ensureDatasetAbsent(api, dataset)],
  ]);
});

test.afterAll(async ({ api, entitlements }) => {
  if (leavingTestData(`pool "${tierPoolName}" and the tiering configuration`)) {
    return;
  }
  // As in `tiering-dataset.e2e.ts`: the export whatever this run could do, the
  // switch only where middleware accepts the call.
  await runCleanupSteps([
    [`export pool ${tierPoolName}`, () => ensurePoolAbsent(api, tierPoolName)],
    ...(isEntitled(entitlements, entitlementFeature.zfsTier)
      ? [['turn tiering off', () => establishTierBaseline(api)] as CleanupStep]
      : []),
  ]);
});

test.describe('with tiering off', () => {
  test.beforeAll(async ({ api }) => {
    await establishTierBaseline(api);
  });

  test('share rows have no Storage Tier column and no Change Storage Tier', async ({ page, api }) => {
    const path = datasetMountPath(dataset);
    await ensureDatasetPresent(api, dataset);
    await ensureSmbSharePresent(api, { name: smbShare, path });
    await ensureNfsSharePresent(api, { path });

    await goToShares(page);

    await test.step('the SMB row', async () => {
      await expect(page.locator(smbLocators.card.row(smbShare))).toBeVisible();
      await expect(page.locator(smbLocators.card.tier(smbShare))).toHaveCount(0);

      await page.locator(smbLocators.card.rowMenu(smbShare)).click();
      await expect(page.locator(smbLocators.card.rowMenuEdit(smbShare))).toBeVisible();
      await expect(page.locator(smbLocators.card.rowMenuChangeTier(smbShare))).toHaveCount(0);
      await page.keyboard.press('Escape');
      await expect(page.locator(smbLocators.card.rowMenuEdit(smbShare))).toBeHidden();
    });

    await test.step('the NFS row', async () => {
      await expect(page.locator(nfsLocators.card.row(path))).toBeVisible();
      await expect(page.locator(nfsLocators.card.tier(path))).toHaveCount(0);

      await page.locator(nfsLocators.card.rowMenu(path)).click();
      await expect(page.locator(nfsLocators.card.rowMenuEdit(path))).toBeVisible();
      await expect(page.locator(nfsLocators.card.rowMenuChangeTier(path))).toHaveCount(0);
    });
  });
});

test.describe('with tiering on', () => {
  test.beforeAll(async ({ api }) => {
    await establishTierBaseline(api, { enabled: true });
  });

  test('Change Storage Tier on an SMB row moves its dataset to the performance tier', async ({ page, api }) => {
    await ensureDatasetPresent(api, dataset);
    await ensureSmbSharePresent(api, { name: smbShare, path: datasetMountPath(dataset) });

    await goToShares(page);
    await expect(page.locator(smbLocators.card.tier(smbShare))).toHaveText('Regular');

    await test.step('change the tier from the row, without moving the data', async () => {
      await openChangeTierDialogFromShareRow(page, {
        rowMenu: smbLocators.card.rowMenu(smbShare),
        changeTier: smbLocators.card.rowMenuChangeTier(smbShare),
      });

      // The dialog worked the dataset out from the share's path.
      await expect(page.locator(changeTierDialogLocators.datasetName)).toHaveText(dataset);
      await expect(page.locator(changeTierDialogLocators.smbShare(smbShare))).toHaveText(smbShare);
      await expect(page.locator(changeTierDialogLocators.newTier)).toHaveText('Performance');

      // Unticked so no rewrite job runs: the tier change is what this story is
      // about, and `tiering-dataset.e2e.ts` covers the migration.
      await page.locator(changeTierDialogLocators.moveExistingData).setChecked(false);
      await applyTierChange(page);
    });

    await expect(page.locator(smbLocators.card.tier(smbShare))).toHaveText('Performance');
    expect((await findDataset(api, dataset))?.tier).toEqual({ tier_type: 'PERFORMANCE', tier_job: null });
  });

  test('Change Storage Tier on an NFS row moves its dataset to the performance tier', async ({ page, api }) => {
    const path = datasetMountPath(dataset);
    await ensureDatasetPresent(api, dataset);
    await ensureNfsSharePresent(api, { path });

    await goToShares(page);
    await expect(page.locator(nfsLocators.card.tier(path))).toHaveText('Regular');

    await test.step('change the tier from the row, without moving the data', async () => {
      await openChangeTierDialogFromShareRow(page, {
        rowMenu: nfsLocators.card.rowMenu(path),
        changeTier: nfsLocators.card.rowMenuChangeTier(path),
      });

      await expect(page.locator(changeTierDialogLocators.datasetName)).toHaveText(dataset);
      await expect(page.locator(changeTierDialogLocators.nfsShares)).toHaveText('1 share');
      await expect(page.locator(changeTierDialogLocators.newTier)).toHaveText('Performance');

      await page.locator(changeTierDialogLocators.moveExistingData).setChecked(false);
      await applyTierChange(page);
    });

    await expect(page.locator(nfsLocators.card.tier(path))).toHaveText('Performance');
    expect((await findDataset(api, dataset))?.tier).toEqual({ tier_type: 'PERFORMANCE', tier_job: null });
  });

  test('a share on a locked encrypted dataset has no Change Storage Tier', async ({ page, api }) => {
    await ensureEncryptedDatasetPresent(api, dataset, passphrase);
    await ensureSmbSharePresent(api, { name: smbShare, path: datasetMountPath(dataset) });

    await test.step('unlocked, the row offers it', async () => {
      await goToShares(page);
      await page.locator(smbLocators.card.rowMenu(smbShare)).click();
      await expect(page.locator(smbLocators.card.rowMenuChangeTier(smbShare))).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator(smbLocators.card.rowMenuChangeTier(smbShare))).toBeHidden();
    });

    await lockDataset(api, dataset);

    await test.step('locked, it does not', async () => {
      // Away and back, so the card reads the share again and sees it locked.
      await goToDatasets(page);
      await goToShares(page);

      await page.locator(smbLocators.card.rowMenu(smbShare)).click();
      await expect(page.locator(smbLocators.card.rowMenuEdit(smbShare))).toBeVisible();
      await expect(page.locator(smbLocators.card.rowMenuChangeTier(smbShare))).toHaveCount(0);
    });
  });
});
