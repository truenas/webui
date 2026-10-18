/**
 * Stories: an admin changes an encrypted dataset's encryption from Edit Encryption Options on its
 * Encryption card, and the appliance holds what they chose.
 *
 * Each is asserted through `pool.dataset.query`, because the card shows only a type and whether the
 * dataset is a root. Switching to a key and changing a passphrase are both `pool.dataset.change_key`,
 * a job; inheriting is `pool.dataset.inherit_parent_encryption_properties`, a plain call.
 *
 * Every dataset is made over the API as a passphrase root. The first two sit directly under the
 * unencrypted test pool, so the dialog offers Encryption Type and no Inherit. The third is a root
 * under an encrypted parent, which is the only place Inherit is offered.
 */
import { ensureEncryptedDatasetPresent, lockDataset, unlockDataset } from '../fixtures/encryption';
import { ensureDatasetAbsent, findDataset } from '../fixtures/storage';
import { openEncryptionOptions, saveEncryptionOptions, selectDataset } from '../flows/encryption';
import { selectOption } from '../flows/storage';
import { encryptionCardLocators, encryptionOptionsLocators } from '../locators/encryption';
import { datasetDetailsLocators, datasetLocators } from '../locators/storage';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Under the shared pool. One per test, so no test starts from another's leftovers. */
const leaves = {
  toKey: 'e2e_encryption_options_to_key',
  newPassphrase: 'e2e_encryption_options_new_passphrase',
  parent: 'e2e_encryption_options_parent',
};

/** Under `leaves.parent`. Removed with it, since the deletion is recursive. */
const childLeaf = 'e2e_encryption_options_child';

/** All long enough for middleware's eight-character minimum. */
const passphrase = 'e2e-encryption-passphrase';
const changedPassphrase = 'e2e-encryption-changed-passphrase';
const childPassphrase = 'e2e-encryption-child-passphrase';

const card = encryptionCardLocators;
const dialog = encryptionOptionsLocators;

test.describe('dataset encryption options', () => {
  test.beforeEach(async ({ api, pool }) => {
    for (const leaf of Object.values(leaves)) {
      await ensureDatasetAbsent(api, `${pool}/${leaf}`);
    }
  });

  test.afterEach(async ({ api, pool }) => {
    const datasets = Object.values(leaves).map((leaf) => `${pool}/${leaf}`);
    if (leavingTestData(`the datasets ${datasets.join(', ')}`)) {
      return;
    }

    await runCleanupSteps(datasets.map((dataset): [string, () => Promise<void>] => [
      `remove the dataset "${dataset}"`, () => ensureDatasetAbsent(api, dataset),
    ]));
  });

  test('an admin switches a passphrase root to a generated key', async ({ page, api, pool }) => {
    const dataset = `${pool}/${leaves.toKey}`;
    await ensureEncryptedDatasetPresent(api, dataset, passphrase);

    await selectDataset(page, dataset);
    await expect(page.locator(card.type)).toHaveText('Passphrase');

    await openEncryptionOptions(page);
    await selectOption(page, dialog.type, dialog.typeOption('Key'));
    await page.locator(dialog.generateKey).setChecked(true);
    await saveEncryptionOptions(page);

    await expect(page.locator(card.type)).toHaveText('Key');

    expect(await findDataset(api, dataset)).toMatchObject({
      encryption_root: dataset,
      key_format: { value: 'HEX' },
      locked: false,
    });
  });

  test('an admin changes the passphrase of an encryption root', async ({ page, api, pool }) => {
    const dataset = `${pool}/${leaves.newPassphrase}`;
    await ensureEncryptedDatasetPresent(api, dataset, passphrase);

    await selectDataset(page, dataset);
    await openEncryptionOptions(page);
    await page.locator(dialog.passphrase).fill(changedPassphrase);
    await page.locator(dialog.confirmPassphrase).fill(changedPassphrase);
    await saveEncryptionOptions(page);

    await expect(page.locator(card.type)).toHaveText('Passphrase');

    // The query cannot show a passphrase, so the proof is that the new one opens the dataset. A
    // wrong passphrase leaves it locked rather than failing the unlock, which `locked` reads back.
    await lockDataset(api, dataset);
    await unlockDataset(api, dataset, changedPassphrase);
    expect(await findDataset(api, dataset)).toMatchObject({ locked: false });
  });

  test('an admin makes a child encryption root inherit from its encrypted parent', async ({ page, api, pool }) => {
    const parent = `${pool}/${leaves.parent}`;
    const child = `${parent}/${childLeaf}`;
    await ensureEncryptedDatasetPresent(api, parent, passphrase);
    await ensureEncryptedDatasetPresent(api, child, childPassphrase);
    expect(await findDataset(api, child)).toMatchObject({ encryption_root: child });

    // Selecting the parent expands its branch, which is what puts the child in the tree.
    await selectDataset(page, parent);
    await page.locator(datasetLocators.treeNode(child)).click();
    await expect(page.locator(datasetDetailsLocators.path)).toHaveText(child);
    await expect(page.locator(card.encryptionRoot)).toBeHidden();

    await openEncryptionOptions(page);
    await page.locator(dialog.inherit).setChecked(true);
    await saveEncryptionOptions(page);

    await expect(page.locator(card.encryptionRoot)).toHaveText(`/${parent}`);

    expect(await findDataset(api, child)).toMatchObject({ encryption_root: parent });
  });
});
