/**
 * Stories: an admin exports a key-encrypted dataset's key from its Encryption card, sees the key the
 * dataset holds, and downloads it as a file. The card offers Export Key nowhere else.
 *
 * What the dialog shows is checked against `pool.dataset.export_key`, and the dataset against
 * `pool.dataset.query`. Keys are compared as booleans with a message, never with `toBe(key)`, so a
 * failure never prints a key into the report.
 *
 * Unlocking with the exported key is not covered: the card disables Lock unless the dataset has a
 * passphrase, so the UI has no way to lock a key-encrypted dataset in the first place.
 */
import { readFile } from 'node:fs/promises';
import {
  ensureEncryptedDatasetPresent, ensureKeyEncryptedDatasetPresent, exportDatasetKey,
} from '../fixtures/encryption';
import { ensureDatasetAbsent, ensureDatasetPresent, findDataset } from '../fixtures/storage';
import { downloadDatasetKey, openExportKeyDialog, selectDataset } from '../flows/encryption';
import { encryptionCardLocators, exportKeyDialogLocators } from '../locators/encryption';
import { datasetDetailsLocators, datasetLocators } from '../locators/storage';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Under the shared pool. */
const leaves = {
  keyRoot: 'e2e_export_key',
  passphraseRoot: 'e2e_export_passphrase',
  plain: 'e2e_export_plain',
};

/** Under `leaves.keyRoot`, and inheriting its encryption. Removed with it. */
const inheritingLeaf = 'e2e_inherits';

/** 64 hex characters, as middleware wants a raw key. Not the one `replication-tasks.e2e.ts` seeds. */
const seededKey = 'fedcba9876543210'.repeat(4);

/** Long enough for middleware's eight-character minimum. */
const passphrase = 'e2e-export-key-passphrase';

const card = encryptionCardLocators;
const dialog = exportKeyDialogLocators;

/** Recursive, so removing the key root takes the inheriting child with it. */
async function removeDatasets(api: E2eApiClient, pool: string): Promise<void> {
  await runCleanupSteps(Object.values(leaves).map((leaf): [string, () => Promise<void>] => [
    `remove the dataset "${pool}/${leaf}"`, () => ensureDatasetAbsent(api, `${pool}/${leaf}`),
  ]));
}

test.describe('exporting a dataset key', () => {
  test.beforeEach(async ({ api, pool }) => {
    await removeDatasets(api, pool);
  });

  test.afterEach(async ({ api, pool }) => {
    if (leavingTestData(`the datasets under ${pool}: ${Object.values(leaves).join(', ')}`)) {
      return;
    }

    await removeDatasets(api, pool);
  });

  test('an admin exports a key-encrypted dataset\'s key, and the dialog shows the key it holds', async ({
    page, api, pool,
  }) => {
    const dataset = `${pool}/${leaves.keyRoot}`;
    await ensureKeyEncryptedDatasetPresent(api, dataset, seededKey);

    await selectDataset(page, dataset);
    await expect(page.locator(card.state)).toHaveText('Unlocked');
    await expect(page.locator(card.type)).toHaveText('Key');
    await expect(page.locator(card.lock)).toBeDisabled();

    const shown = await openExportKeyDialog(page);
    await expect(page.locator(dialog.title)).toHaveText(`Key for '${dataset}'`);

    expect(shown === seededKey, 'the dialog showed a key other than the one the dataset was created with').toBe(true);
    const exported = await exportDatasetKey(api, dataset);
    expect(shown === exported, 'the dialog showed a key other than the one pool.dataset.export_key returns').toBe(true);

    await page.locator(dialog.close).click();
    await expect(page.locator(dialog.title)).toBeHidden();

    // Exporting reads the key and changes nothing about the dataset.
    expect(await findDataset(api, dataset)).toMatchObject({
      locked: false,
      key_loaded: true,
      key_format: { value: 'HEX' },
    });
  });

  test('Download Key saves a file holding the same key, and closes the dialog', async ({ page, api, pool }) => {
    const dataset = `${pool}/${leaves.keyRoot}`;
    await ensureKeyEncryptedDatasetPresent(api, dataset, seededKey);

    await selectDataset(page, dataset);
    await openExportKeyDialog(page);
    const download = await downloadDatasetKey(page);

    await expect(page.locator(dialog.title)).toBeHidden();

    // The dialog names the file `dataset_<full name>_key.json`, and a full name holds a slash, which no
    // file name can. Recorded before it is asserted, so the run says what the browser made of it
    // whichever way the assertion goes.
    const fileName = download.suggestedFilename();
    test.info().annotations.push({ type: 'downloaded file name', description: fileName });
    expect(fileName).toBe(`dataset_${pool}_${leaves.keyRoot}_key.json`);

    // Read from where Playwright put it rather than saved into the test output: the run's artifacts
    // are published. The shape is middleware's: `export_key` with `download: true` writes
    // `{ <dataset>: <key> }` to the job's output pipe (`plugins/zfs/encryption_info.py`).
    const contents: unknown = JSON.parse(await readFile(await download.path(), 'utf8'));
    const keys = Object.entries(contents as Record<string, unknown>);
    expect(keys.map(([name]) => name)).toEqual([dataset]);
    expect(keys[0]?.[1] === seededKey, 'the downloaded file holds a key other than the dataset\'s').toBe(true);
  });

  test('Export Key is not offered on a passphrase root, an inheriting child, or an unencrypted dataset', async ({
    page, api, pool,
  }) => {
    const keyRoot = `${pool}/${leaves.keyRoot}`;
    const child = `${keyRoot}/${inheritingLeaf}`;
    const passphraseRoot = `${pool}/${leaves.passphraseRoot}`;
    const plain = `${pool}/${leaves.plain}`;

    await ensureKeyEncryptedDatasetPresent(api, keyRoot, seededKey);
    // A plain create under an encrypted parent inherits its encryption.
    await ensureDatasetPresent(api, child);
    await ensureEncryptedDatasetPresent(api, passphraseRoot, passphrase);
    await ensureDatasetPresent(api, plain);

    // A passphrase root. Lock being enabled is what shows the footer rendered at all.
    await selectDataset(page, passphraseRoot);
    await expect(page.locator(card.type)).toHaveText('Passphrase');
    await expect(page.locator(card.lock)).toBeEnabled();
    await expect(page.locator(card.exportKey)).toHaveCount(0);

    // An inheriting child. Selecting its root expands the branch, which is what puts it in the tree.
    await selectDataset(page, keyRoot);
    await page.locator(datasetLocators.treeNode(child)).click();
    await expect(page.locator(datasetDetailsLocators.path)).toHaveText(child);
    await expect(page.locator(card.encryptionRoot)).toHaveText(`/${keyRoot}`);
    await expect(page.locator(card.exportKey)).toHaveCount(0);
    await expect(page.locator(card.lock)).toHaveCount(0);

    // An unencrypted dataset has no Encryption card. The card and Path read the same selected
    // dataset, so once Path names this one the card's absence is about this one too.
    await selectDataset(page, plain);
    await expect(page.locator(card.card)).toHaveCount(0);
    await expect(page.locator(card.exportKey)).toHaveCount(0);

    // The control: the key root does offer it, so the checks above are not passing on a renamed id.
    await selectDataset(page, keyRoot);
    await expect(page.locator(card.exportKey)).toBeVisible();

    expect(await findDataset(api, passphraseRoot)).toMatchObject({ key_format: { value: 'PASSPHRASE' } });
    expect(await findDataset(api, child)).toMatchObject({ encryption_root: keyRoot });
    expect(await findDataset(api, plain)).toMatchObject({ encrypted: false });
  });
});
