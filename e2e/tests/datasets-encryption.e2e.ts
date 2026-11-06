/**
 * Stories: an admin creates, locks and unlocks an encrypted dataset; each is checked on the Encryption card and
 * through `pool.dataset.query`, which says whether the key is really loaded. Every dataset is a passphrase
 * encryption root, since Lock shows only on a root and needs a passphrase. Lock and unlock start from datasets
 * made over the API; the create test uses the form, since creating is what it tests.
 */
import { ensureEncryptedDatasetPresent, lockDataset } from '../fixtures/encryption';
import { ensureDatasetAbsent, findDataset } from '../fixtures/storage';
import {
  encryptWithPassphrase, lockFromCard, selectDataset, unlockFromCard,
} from '../flows/encryption';
import { openAddDatasetForm, saveDatasetForm } from '../flows/storage';
import { encryptionCardLocators } from '../locators/encryption';
import { datasetLocators } from '../locators/storage';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Under the shared pool. One per test, so no test starts from another's leftovers. */
const leaves = {
  created: 'e2e_encrypted_created',
  toLock: 'e2e_encrypted_to_lock',
  toUnlock: 'e2e_encrypted_to_unlock',
};

/** Long enough for middleware's eight-character minimum. */
const passphrase = 'e2e-encryption-passphrase';

const card = encryptionCardLocators;

test.describe('dataset encryption', () => {
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

  test('an admin creates a dataset encrypted with a passphrase', async ({ page, api, pool }) => {
    const dataset = `${pool}/${leaves.created}`;

    await openAddDatasetForm(page, pool);
    await page.locator(datasetLocators.name).fill(leaves.created);
    // Encryption Options is not on screen until the form is switched to advanced mode.
    await page.locator(datasetLocators.advancedToggle).click();
    await encryptWithPassphrase(page, passphrase);
    await saveDatasetForm(page);

    await selectDataset(page, dataset);
    await expect(page.locator(card.state)).toHaveText('Unlocked');
    await expect(page.locator(card.type)).toHaveText('Passphrase');

    expect(await findDataset(api, dataset)).toMatchObject({
      encrypted: true,
      encryption_root: dataset,
      key_format: { value: 'PASSPHRASE' },
      locked: false,
    });
  });

  test('an admin locks an encrypted dataset', async ({ page, api, pool }) => {
    const dataset = `${pool}/${leaves.toLock}`;
    await ensureEncryptedDatasetPresent(api, dataset, passphrase);

    await selectDataset(page, dataset);
    await expect(page.locator(card.state)).toHaveText('Unlocked');
    await lockFromCard(page);

    expect(await findDataset(api, dataset)).toMatchObject({ locked: true, key_loaded: false });
  });

  test('an admin unlocks a locked dataset with its passphrase', async ({ page, api, pool }) => {
    const dataset = `${pool}/${leaves.toUnlock}`;
    await ensureEncryptedDatasetPresent(api, dataset, passphrase);
    await lockDataset(api, dataset);

    await selectDataset(page, dataset);
    await expect(page.locator(card.state)).toHaveText('Locked');
    await unlockFromCard(page, dataset, passphrase);

    // Back on the Datasets page, which opens on the pool root, so the dataset is selected again.
    await selectDataset(page, dataset);
    await expect(page.locator(card.state)).toHaveText('Unlocked');

    expect(await findDataset(api, dataset)).toMatchObject({ locked: false, key_loaded: true });
  });
});
