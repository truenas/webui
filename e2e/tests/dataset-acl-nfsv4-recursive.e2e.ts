/**
 * Stories: applying an NFSv4 ACL recursively from the ACL editor, with and
 * without its child datasets, and stripping one, with and without them.
 *
 * The parent is made with the SMB preset, so its ACL is not trivial and the
 * Permissions card opens the ACL editor on it. Under it sit a child dataset and,
 * for the recursive stories, a plain directory. Recursion reaches the directory
 * by itself and the child dataset only with "Apply permissions to child
 * datasets". Every result is read back per path through `filesystem.getacl`.
 *
 * The recursive stories apply NFS4_OPEN rather than a preset the parent might
 * already carry, so that the save is visible on every path it reaches.
 */
import { nfs4Entries, readAcl } from '../fixtures/permissions';
import { ensureDirectoryPresent } from '../fixtures/snapshots';
import {
  datasetMountPath, ensureAclDatasetPresent, ensureDatasetAbsent, ensureSmbDatasetPresent,
} from '../fixtures/storage';
import {
  choosePreset, openAclEditor, saveAcl, selectDataset, setRecursive, stripAcl,
} from '../flows/permissions';
import { confirmDialogLocators } from '../locators/dialogs';
import { permissionsLocators } from '../locators/permissions';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const parentLeaf = 'e2e_acl_rec';

/** The datasets and paths one story works on, under the suite's pool. */
interface Tree {
  parent: string;
  child: string;
  parentPath: string;
  childPath: string;
  subdirPath: string;
}

function treeIn(pool: string): Tree {
  const parent = `${pool}/${parentLeaf}`;
  const child = `${parent}/child`;
  return {
    parent,
    child,
    parentPath: datasetMountPath(parent),
    childPath: datasetMountPath(child),
    subdirPath: `${datasetMountPath(parent)}/subdir`,
  };
}

/** The entries every NFSv4 ACL may have, whoever owns the path. */
const specialTags = new Set(['owner@', 'group@', 'everyone@']);

/**
 * What the `owner@`, `group@` and `everyone@` entries of `path` grant, in a
 * stable order.
 *
 * Flags are left out: an entry a path inherited carries `INHERITED`, which the
 * entry it came from does not. Named USER and GROUP entries are left out too,
 * because whether they reach a child depends on their inherit flags, and the
 * special entries are enough to tell one ACL from another.
 */
async function readGrants(api: E2eApiClient, path: string): Promise<string[]> {
  return nfs4Entries(await readAcl(api, path))
    .filter((entry) => specialTags.has(entry.tag))
    .map((entry) => JSON.stringify([entry.tag, entry.type, entry.perms]))
    .sort((left, right) => left.localeCompare(right));
}

test.afterEach(async ({ api, pool }) => {
  const { parent } = treeIn(pool);
  if (leavingTestData(`dataset "${parent}" and everything under it`)) {
    return;
  }

  // Recursive, so the child dataset and the directory go with it. These NFSv4
  // datasets sit under a POSIX pool root, and `smb-share-acl.e2e.ts` skips its
  // root-share story while any such child exists.
  await runCleanupSteps([
    [`remove dataset ${parent}`, () => ensureDatasetAbsent(api, parent)],
  ]);
});

test.describe('recursively', () => {
  test.beforeEach(async ({ api, pool }) => {
    const tree = treeIn(pool);
    // Absent first, so every story starts from the ACLs the datasets are created with.
    await ensureDatasetAbsent(api, tree.parent);
    await ensureSmbDatasetPresent(api, tree.parent);
    // A child of an NFSv4 parent is NFSv4 too. Made without a share type, its ACL is trivial.
    await ensureAclDatasetPresent(api, tree.child, 'NFSV4');
    await ensureDirectoryPresent(api, tree.subdirPath);
  });

  test('Apply permissions recursively reaches the directory and not the child dataset', async ({ page, api, pool }) => {
    const tree = treeIn(pool);
    const subdirBefore = await readGrants(api, tree.subdirPath);
    expect(await readAcl(api, tree.childPath)).toMatchObject({ trivial: true });

    await openAclEditor(page, tree.parent);
    await page.locator(permissionsLocators.aclEditor.usePreset).click();
    await choosePreset(page, 'NFS4_OPEN');

    // Cancelling the Warning takes the tick back, and with it the child datasets box.
    await page.locator(permissionsLocators.aclEditor.recursive).check();
    await expect(page.locator(permissionsLocators.aclEditor.traverse)).toBeVisible();
    await page.locator(confirmDialogLocators.cancel).click();
    await expect(page.locator(confirmDialogLocators.title)).toBeHidden();
    await expect(page.locator(permissionsLocators.aclEditor.recursive)).not.toBeChecked();
    await expect(page.locator(permissionsLocators.aclEditor.traverse)).toHaveCount(0);

    await setRecursive(page, { traverse: false });
    await saveAcl(page);

    const parentAfter = await readGrants(api, tree.parentPath);
    expect(await readAcl(api, tree.parentPath)).toMatchObject({ acltype: 'NFS4', trivial: false });
    expect(parentAfter).toContain(JSON.stringify(['everyone@', 'ALLOW', { BASIC: 'MODIFY' }]));

    // The directory had the SMB preset's entries by inheritance, and now has the parent's new ones.
    expect(subdirBefore).not.toEqual(parentAfter);
    expect(await readGrants(api, tree.subdirPath)).toEqual(parentAfter);
    expect(await readAcl(api, tree.childPath)).toMatchObject({ acltype: 'NFS4', trivial: true });
  });

  test('Apply permissions to child datasets reaches the child dataset too', async ({ page, api, pool }) => {
    const tree = treeIn(pool);
    expect(await readAcl(api, tree.childPath)).toMatchObject({ trivial: true });

    await openAclEditor(page, tree.parent);
    await page.locator(permissionsLocators.aclEditor.usePreset).click();
    await choosePreset(page, 'NFS4_OPEN');
    await setRecursive(page, { traverse: true });
    await saveAcl(page);

    const parentAfter = await readGrants(api, tree.parentPath);
    expect(parentAfter).toContain(JSON.stringify(['everyone@', 'ALLOW', { BASIC: 'MODIFY' }]));
    expect(await readAcl(api, tree.childPath)).toMatchObject({ acltype: 'NFS4', trivial: false });
    expect(await readGrants(api, tree.childPath)).toEqual(parentAfter);
    expect(await readGrants(api, tree.subdirPath)).toEqual(parentAfter);
  });
});

test.describe('Strip ACL', () => {
  test.beforeEach(async ({ api, pool }) => {
    const tree = treeIn(pool);
    await ensureDatasetAbsent(api, tree.parent);
    await ensureSmbDatasetPresent(api, tree.parent);
    // Not trivial either, so a strip that reaches it shows.
    await ensureSmbDatasetPresent(api, tree.child);
  });

  test('Strip ACL on the dataset alone leaves the child dataset', async ({ page, api, pool }) => {
    const tree = treeIn(pool);
    expect(await readAcl(api, tree.parentPath)).toMatchObject({ trivial: false });
    expect(await readAcl(api, tree.childPath)).toMatchObject({ trivial: false });

    await openAclEditor(page, tree.parent);
    await stripAcl(page, { childDatasets: false });

    // Stripping empties the ACL and leaves its type alone.
    expect(await readAcl(api, tree.parentPath)).toMatchObject({ acltype: 'NFS4', trivial: true });
    expect(await readAcl(api, tree.childPath)).toMatchObject({ acltype: 'NFS4', trivial: false });

    // The card shows Unix permissions again, and its Edit opens the Unix editor. The owner and
    // group are both `root`, so only the Other entry has an id of its own.
    await selectDataset(page, tree.parent);
    await expect(page.locator(permissionsLocators.card.entry('Other'))).toBeVisible();
    await page.locator(permissionsLocators.card.edit).click();
    await expect(page.locator(permissionsLocators.editor.setAcl)).toBeVisible();
  });

  test('Strip ACL with child datasets strips the child dataset too', async ({ page, api, pool }) => {
    const tree = treeIn(pool);
    expect(await readAcl(api, tree.childPath)).toMatchObject({ trivial: false });

    await openAclEditor(page, tree.parent);
    await stripAcl(page, { childDatasets: true });

    expect(await readAcl(api, tree.parentPath)).toMatchObject({ acltype: 'NFS4', trivial: true });
    expect(await readAcl(api, tree.childPath)).toMatchObject({ acltype: 'NFS4', trivial: true });
  });
});
