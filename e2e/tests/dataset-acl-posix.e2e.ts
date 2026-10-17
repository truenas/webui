/**
 * Stories: the ACL editor on a POSIX dataset. A built-in preset, a named user entry in both the
 * access and the default ACL, the refusal to apply an ACL recursively without default entries,
 * and Strip ACL.
 *
 * The dataset is made with `acltype: 'POSIX'`, so its ACL starts trivial and the Permissions card
 * opens the Unix editor, whose Set ACL raises the preset dialog. Every result is read back through
 * `filesystem.getacl`. A preset's entries are compared against the template
 * `filesystem.acltemplate.by_path` serves rather than written out here, and only what tells one
 * preset from another is asserted by hand.
 *
 * Which rows offer a remove control is checked on the custom ACL, not on a preset.
 * `canBeRemoved` counts access and default entries together, so on a preset with default entries
 * every USER_OBJ row can be removed. On the custom ACL each of the three trivial entries is the
 * only one of its kind.
 */
import {
  applyPosixAclTemplate, posixEntries, readAcl, readAclTemplate, type AclTemplate,
} from '../fixtures/permissions';
import { datasetMountPath, ensureAclDatasetPresent, ensureDatasetAbsent } from '../fixtures/storage';
import { ensureUserAbsent, ensureUserPresent, findUser } from '../fixtures/users';
import {
  addPosixUserEntry,
  chooseCustomAcl,
  choosePreset,
  openAclEditor,
  openPermissionsEditor,
  saveAcl,
  saveAclToError,
  selectDataset,
  setAclFromUnixEditor,
  setRecursive,
  stripAcl,
} from '../flows/permissions';
import { errorDialogLocators } from '../locators/dialogs';
import { permissionsLocators } from '../locators/permissions';
import { datasetDetailsLocators } from '../locators/storage';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { errorDialogClose } from '../support/constants';
import { expect, test } from '../support/fixtures';

const datasetLeaf = 'e2e_acl_posix';

/** Throwaway user the named entries are for. */
const aclUser = 'e2e_acl_posix_user';

const aclEditor = permissionsLocators.aclEditor;
const card = permissionsLocators.card;

/** The entries that are not about a named account. */
const objectTags = new Set(['USER_OBJ', 'GROUP_OBJ', 'OTHER']);

/** The fields that make two entries the same entry. Optional where the generated type may have them so. */
interface AceShape {
  tag: string;
  default?: boolean;
  perms?: unknown;
  id?: number | null;
}

/**
 * An entry reduced to what it grants, to whom, and in which ACL.
 *
 * The id is kept only for USER and GROUP. The others name the path's owner, group or nobody,
 * which is not something a preset chooses.
 */
function shapeOf(ace: AceShape): AceShape {
  const shape: AceShape = {
    tag: ace.tag,
    default: ace.default,
    perms: ace.perms,
  };
  if (ace.tag === 'USER' || ace.tag === 'GROUP') {
    shape.id = ace.id;
  }
  return shape;
}

/** Entries as comparable shapes, in a stable order so a reordering is not a difference. */
function shapesOf(entries: AceShape[]): string[] {
  return entries
    .map((entry) => JSON.stringify(shapeOf(entry)))
    .sort((left, right) => left.localeCompare(right));
}

/** A template's entries. The response types them as a union across ACL kinds. */
function templateEntries(template: AclTemplate): AceShape[] {
  if (template.acltype !== 'POSIX1E') {
    throw new Error(`Expected a POSIX template, found ${template.acltype} for "${template.name}".`);
  }
  return template.acl as unknown as AceShape[];
}

/** The entry tagged `tag` in the access ACL, or in the default one when `isDefault` is set. */
function findEntry(entries: AceShape[], tag: string, isDefault: boolean): AceShape | undefined {
  return entries.find((entry) => entry.tag === tag && entry.default === isDefault);
}

async function aclUserUid(api: E2eApiClient): Promise<number> {
  const uid = (await findUser(api, aclUser))?.uid;
  if (typeof uid !== 'number') {
    throw new Error(`User "${aclUser}" was created but cannot be found.`);
  }

  return uid;
}

test.beforeEach(async ({ api, pool }) => {
  const dataset = `${pool}/${datasetLeaf}`;

  // Absent first, so every story starts from the trivial ACL the dataset is created with.
  await ensureDatasetAbsent(api, dataset);
  await ensureAclDatasetPresent(api, dataset, 'POSIX');
  await ensureUserPresent(api, aclUser);
});

test.afterEach(async ({ api, pool }) => {
  const dataset = `${pool}/${datasetLeaf}`;
  if (leavingTestData(`dataset "${dataset}" and user "${aclUser}"`)) {
    return;
  }

  // The dataset first, so no ACL is left naming an account that no longer exists.
  await runCleanupSteps([
    [`remove dataset ${dataset}`, () => ensureDatasetAbsent(api, dataset)],
    [`remove user ${aclUser}`, () => ensureUserAbsent(api, aclUser)],
  ]);
});

test('Set ACL on a trivial POSIX dataset applies the POSIX_RESTRICTED preset', async ({ page, api, pool }) => {
  const dataset = `${pool}/${datasetLeaf}`;
  const path = datasetMountPath(dataset);
  const template = await readAclTemplate(api, path, 'POSIX_RESTRICTED');

  expect(await readAcl(api, path)).toMatchObject({ acltype: 'POSIX1E', trivial: true });

  await openPermissionsEditor(page, dataset);
  await setAclFromUnixEditor(page);
  await choosePreset(page, 'POSIX_RESTRICTED');
  await saveAcl(page);

  const acl = await readAcl(api, path);
  expect(acl).toMatchObject({ acltype: 'POSIX1E', trivial: false });
  const entries = posixEntries(acl);
  expect(shapesOf(entries)).toEqual(shapesOf(templateEntries(template)));
  // What tells POSIX_RESTRICTED apart: others get nothing, and the owner keeps everything by default.
  expect(findEntry(entries, 'OTHER', false)?.perms).toEqual({ READ: false, WRITE: false, EXECUTE: false });
  expect(findEntry(entries, 'USER_OBJ', true)?.perms).toEqual({ READ: true, WRITE: true, EXECUTE: true });

  // Saving returns to the dataset, whose card now lists the entries.
  await expect(page.locator(datasetDetailsLocators.path)).toHaveText(dataset);
  await expect(page.locator(card.entry('Other'))).toHaveText('None');
  await expect(page.locator(card.entry('User Obj – root'))).toHaveText('Read | Write | Execute');
});

test('a named user entry is saved in both the access and the default ACL', async ({ page, api, pool }) => {
  const dataset = `${pool}/${datasetLeaf}`;
  const path = datasetMountPath(dataset);
  const uid = await aclUserUid(api);
  const presetEntries = templateEntries(await readAclTemplate(api, path, 'POSIX_OPEN'));
  const added = presetEntries.length;

  await openPermissionsEditor(page, dataset);
  await setAclFromUnixEditor(page);
  await choosePreset(page, 'POSIX_OPEN');
  await expect(page.locator(aclEditor.ace(added - 1))).toBeVisible();

  await addPosixUserEntry(page, aclUser, { perms: ['Read', 'Execute'], isDefault: false });
  // The user is checked against the directory after a debounce, and the entry keeps the error it
  // had with no user until that check answers. Adding the next entry before then leaves the
  // marker on this one, and Save disabled, for good.
  await expect(page.locator(aclEditor.entryError(added))).toHaveCount(0);
  await addPosixUserEntry(page, aclUser, { perms: ['Read'], isDefault: true });
  await expect(page.locator(aclEditor.ace(added + 1))).toBeVisible();
  // A USER_OBJ, a GROUP_OBJ and an OTHER entry remain without either new row, so both can be removed.
  await expect(page.locator(aclEditor.removeAce(added))).toBeVisible();
  await expect(page.locator(aclEditor.removeAce(added + 1))).toBeVisible();
  await saveAcl(page);

  const entries = posixEntries(await readAcl(api, path));
  const named = entries.filter((entry) => entry.tag === 'USER' && entry.id === uid);
  expect(named).toHaveLength(2);
  expect(named).toEqual(expect.arrayContaining([
    expect.objectContaining({ default: false, perms: { READ: true, WRITE: false, EXECUTE: true } }),
    expect.objectContaining({ default: true, perms: { READ: true, WRITE: false, EXECUTE: false } }),
  ]));
  expect(shapesOf(entries.filter((entry) => objectTags.has(entry.tag))))
    .toEqual(shapesOf(presetEntries.filter((entry) => objectTags.has(entry.tag))));
});

test('Apply permissions recursively is refused without default entries', async ({ page, api, pool }) => {
  const dataset = `${pool}/${datasetLeaf}`;
  const path = datasetMountPath(dataset);
  const before = posixEntries(await readAcl(api, path));

  // The three access entries the mode makes, and no default ACL at all.
  expect(before.map((entry) => entry.tag).sort((left, right) => left.localeCompare(right)))
    .toEqual(['GROUP_OBJ', 'OTHER', 'USER_OBJ']);
  expect(before.filter((entry) => entry.default)).toEqual([]);

  await openPermissionsEditor(page, dataset);
  await setAclFromUnixEditor(page);
  await chooseCustomAcl(page);

  // Each is the only entry of its kind, so none of them can be removed.
  for (const index of before.keys()) {
    await expect(page.locator(aclEditor.ace(index))).toBeVisible();
    await expect(page.locator(aclEditor.removeAce(index))).toHaveCount(0);
  }
  await expect(page.locator(aclEditor.ace(before.length))).toHaveCount(0);

  await setRecursive(page, { traverse: false });
  await saveAclToError(page);
  await expect(page.locator(errorDialogLocators.message)).toContainText(
    'Default ACL entries are required in order to apply ACL recursively',
  );
  await page.locator(errorDialogClose).click();
  await expect(page.locator(errorDialogLocators.title)).toBeHidden();
  await expect(page.locator(aclEditor.save)).toBeVisible();

  expect(await readAcl(api, path)).toMatchObject({ acltype: 'POSIX1E', trivial: true });
});

test('Strip ACL leaves a POSIX dataset with a trivial ACL', async ({ page, api, pool }) => {
  const dataset = `${pool}/${datasetLeaf}`;
  const path = datasetMountPath(dataset);

  await applyPosixAclTemplate(api, path, 'POSIX_OPEN');
  const before = await readAcl(api, path);
  expect(before).toMatchObject({ acltype: 'POSIX1E', trivial: false });
  expect(findEntry(posixEntries(before), 'OTHER', true)).toBeDefined();

  await openAclEditor(page, dataset);
  await stripAcl(page, { childDatasets: false });

  // Stripping empties the ACL and leaves its type alone.
  const after = await readAcl(api, path);
  expect(after).toMatchObject({ acltype: 'POSIX1E', trivial: true });
  expect(posixEntries(after).filter((entry) => entry.default)).toEqual([]);

  // The card shows Unix permissions again: an Other entry, and none for the default ACL.
  await selectDataset(page, dataset);
  await expect(page.locator(card.entry('Other'))).toBeVisible();
  await expect(page.locator(card.entry('Other – default'))).toHaveCount(0);
});
