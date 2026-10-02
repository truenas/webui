/**
 * Story: creating a dataset that shares itself should offer to turn the service on.
 *
 * A dataset given the SMB preset creates an SMB share alongside itself. A share
 * on a stopped service serves nothing, so the form offers to start it — and
 * that offer is the only thing standing between an admin and a share they
 * believe is live.
 *
 * The rule has four conditions and one of them is a race worth pinning:
 *
 *   onSaved()  →  canCreateSmb && create_smb  →  checkIfServiceIsEnabled(Cifs)
 *   effect     →  canUserManageService, then selectService(Cifs)
 *                 .pipe(take(1), filter(Boolean))
 *              →  state === Stopped  →  startService dialog
 *
 * `canCreateSmb` is true only for the SMB and Multiprotocol presets, which is
 * what the second test holds it to. And the effect takes `take(1)` off a
 * `filter(Boolean)` on the services store: if that store has not populated when
 * the action lands, nothing emits and **no prompt appears at all**, silently.
 * Neither condition is visible to a unit test of either component.
 */
import { queryService } from '../fixtures/services';
import {
  ensureSmbServiceStopped, ensureSmbShareAbsent, findSmbShare, smbServiceName,
} from '../fixtures/smb';
import { ensureDatasetAbsent, findDataset } from '../fixtures/storage';
import { goToDatasets } from '../flows/navigation';
import { smbLocators } from '../locators/smb';
import { datasetLocators } from '../locators/storage';
import { expect, test } from '../support/fixtures';

/** Created through the dataset form — that is the thing under test. */
const smbDataset = 'e2e_preset_smb';
const genericDataset = 'e2e_preset_generic';

/** The share the SMB preset creates alongside its dataset. */
const presetShare = 'e2e_preset_smb';

/** Preset labels as the select renders them; options are keyed by label. */
const preset = { smb: 'SMB', generic: 'Generic' } as const;

/**
 * Stopped before each test as well as after.
 *
 * Before, because a service left running by an earlier run would make the
 * prompt not appear and the first test fail for a reason that has nothing to do
 * with it. After, unconditionally, because service state is global.
 */
test.beforeEach(async ({ api, pool }) => {
  await ensureSmbShareAbsent(api, presetShare);
  await ensureDatasetAbsent(api, `${pool}/${smbDataset}`);
  await ensureDatasetAbsent(api, `${pool}/${genericDataset}`);
  await ensureSmbServiceStopped(api);
});

test.afterEach(async ({ api, pool }) => {
  await ensureSmbShareAbsent(api, presetShare);
  await ensureDatasetAbsent(api, `${pool}/${smbDataset}`);
  await ensureDatasetAbsent(api, `${pool}/${genericDataset}`);
  await ensureSmbServiceStopped(api);
});

test('a dataset that shares itself offers to start the service it needs', async ({ page, api, pool }) => {
  expect((await queryService(api, smbServiceName))?.state).toBe('STOPPED');

  await goToDatasets(page);
  await page.locator(datasetLocators.treeNode(pool)).click();
  await page.locator(datasetLocators.addDataset).click();
  await expect(page.locator(datasetLocators.name)).toBeVisible({ timeout: 60_000 });

  await page.locator(datasetLocators.name).fill(smbDataset);
  await page.locator(datasetLocators.shareType).click();
  await page.locator(datasetLocators.shareTypeOption(preset.smb)).click();

  // The share half of the preset. Its name defaults from the dataset's.
  await expect(page.locator(datasetLocators.createSmbShare)).toBeVisible();
  await page.locator(datasetLocators.save).click();

  // The offer itself. Accepting is the point — a share on a stopped service
  // serves nothing, and this dialog is the only place the form says so.
  const startService = page.locator(smbLocators.startService);
  await expect(startService).toBeVisible({ timeout: 60_000 });
  await startService.click();

  // Asserted through the appliance rather than the dialog closing: the dialog
  // going away only means the click landed.
  await expect
    .poll(async () => (await queryService(api, smbServiceName))?.state, { timeout: 90_000 })
    .toBe('RUNNING');

  // And the preset really did make a share, not just a dataset.
  expect(await findSmbShare(api, presetShare)).toBeDefined();
});

test('a dataset with no share to serve does not offer anything', async ({ page, api, pool }) => {
  await goToDatasets(page);
  await page.locator(datasetLocators.treeNode(pool)).click();
  await page.locator(datasetLocators.addDataset).click();
  await expect(page.locator(datasetLocators.name)).toBeVisible({ timeout: 60_000 });

  await page.locator(datasetLocators.name).fill(genericDataset);
  await page.locator(datasetLocators.shareType).click();
  await page.locator(datasetLocators.shareTypeOption(preset.generic)).click();

  // `canCreateSmb` is false for Generic, so there is no share checkbox at all —
  // and therefore nothing for the service prompt to be about.
  await expect(page.locator(datasetLocators.createSmbShare)).toBeHidden();
  await page.locator(datasetLocators.save).click();

  // The negative control. Without it the first test would pass just as well
  // against a form that offered to start SMB after saving anything at all.
  await expect(page.locator(datasetLocators.name)).toBeHidden({ timeout: 60_000 });
  await expect(page.locator(smbLocators.startService)).toBeHidden();

  expect((await queryService(api, smbServiceName))?.state).toBe('STOPPED');
  // The dataset was still created — this test is about the absent prompt, not
  // about the save failing.
  expect(await findDataset(api, `${pool}/${genericDataset}`)).toBeDefined();
});
