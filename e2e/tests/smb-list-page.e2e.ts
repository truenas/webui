/**
 * Stories: the standalone SMB list, reached from the title of the card on the
 * Shares dashboard.
 *
 * The card shows four shares. The list shows all of them, has its own search,
 * and has its own Add (`add-smb-share`, not the card's `smb-share-add`). Each
 * of those is a different page from the card, so the card's specs say nothing
 * about them.
 */
import {
  ensureSmbServiceStopped, ensureSmbShareAbsent, ensureSmbSharePresent, findSmbShare,
} from '../fixtures/smb';
import { datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { goToShares } from '../flows/navigation';
import {
  formSettleTimeoutMs, openAddShareFormFromList, openSmbListPage, saveShareForm, searchSmbList,
} from '../flows/smb';
import { smbLocators } from '../locators/smb';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** The first share by name, which the card shows. */
const firstShare = 'e2e_smb_page_a';

/** The fifth share by name, which the card has no room for: it shows four. */
const fifthShare = 'e2e_smb_page_e';

/** The share the search looks for. No other share's name or path holds it. */
const searchTarget = 'e2e_smb_page_c';

/** Five shares, one more than the card shows. Both pages sort them by name. */
const listedShares = [firstShare, 'e2e_smb_page_b', searchTarget, 'e2e_smb_page_d', fifthShare];

/** The share the list page's Add creates. */
const addedShare = 'e2e_smb_page_added';

/** One dataset under every share. */
const datasetName = 'e2e_smb_page_ds';

const allShares = [...listedShares, addedShare];

test.beforeEach(async ({ api, pool }) => {
  for (const name of allShares) {
    await ensureSmbShareAbsent(api, name);
  }
  await ensureDatasetPresent(api, `${pool}/${datasetName}`);
  // The add test saves the form, and what the form asks afterwards depends on
  // this: stopped, it offers to start the service, which `saveShareForm` declines.
  await ensureSmbServiceStopped(api);
});

test.afterEach(async ({ api, pool }) => {
  if (leavingTestData(`the "e2e_smb_page_*" shares and dataset "${pool}/${datasetName}"`)) {
    return;
  }

  await runCleanupSteps([
    ...allShares.map((name): [string, () => Promise<void>] => [
      `remove share ${name}`,
      () => ensureSmbShareAbsent(api, name),
    ]),
    [`remove dataset ${datasetName}`, () => ensureDatasetAbsent(api, `${pool}/${datasetName}`)],
  ]);
});

test('the card title opens the full SMB list, which lists more shares than the card and searches down to one', async ({
  page,
  api,
  pool,
}) => {
  const path = datasetMountPath(`${pool}/${datasetName}`);
  // Over the API: the list is the thing under test, so the shares are a precondition.
  for (const name of listedShares) {
    await ensureSmbSharePresent(api, { name, path });
  }

  // The card first. The first share is checked so that the fifth being hidden
  // cannot pass on a card that has not loaded yet.
  await goToShares(page);
  await expect(page.locator(smbLocators.card.row(firstShare))).toBeVisible({ timeout: formSettleTimeoutMs });
  await expect(page.locator(smbLocators.card.row(fifthShare))).toBeHidden();

  await openSmbListPage(page);

  // Every share is on the list page, including the one the card had no room for.
  for (const name of listedShares) {
    await expect(page.locator(smbLocators.list.row(name))).toBeVisible({ timeout: formSettleTimeoutMs });
  }

  await searchSmbList(page, searchTarget);

  // Exactly one row is left, and it is the one searched for. Checking only that
  // some bystanders went would pass a search that left more than one row.
  await expect(page.locator(smbLocators.list.row(searchTarget))).toBeVisible();
  await expect(page.locator(smbLocators.list.anyRow)).toHaveCount(1);
});

test('Add on the list page creates the share on the appliance', async ({ page, api, pool }) => {
  const path = datasetMountPath(`${pool}/${datasetName}`);

  await openSmbListPage(page);
  await openAddShareFormFromList(page);

  await page.locator(smbLocators.form.path).fill(path);
  await page.locator(smbLocators.form.name).fill(addedShare);
  await saveShareForm(page);

  // The list reloads after a save, so the new share is a row on this page.
  await expect(page.locator(smbLocators.list.row(addedShare))).toBeVisible({ timeout: formSettleTimeoutMs });

  expect(await findSmbShare(api, addedShare)).toMatchObject({
    name: addedShare,
    path,
    enabled: true,
  });
});
