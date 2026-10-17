/**
 * Stories: built-in NFSv4 ACL presets, applied through the ACL editor from both
 * places it offers them, and the editor's Apply Owner / Apply Group.
 *
 * A trivial NFSv4 dataset opens the Unix editor, whose Set ACL takes it to the
 * ACL editor, and that raises the preset dialog itself. A non-trivial one opens
 * the ACL editor on its entries, where Use Preset raises the same dialog. Either
 * way a preset only fills the form, and Save is what sends it.
 *
 * Every result is read back through `filesystem.getacl` and `filesystem.stat`.
 * The entries a preset should give are read from `filesystem.acltemplate.by_path`
 * rather than written out here, so a middleware change to a template does not
 * break the spec; only what tells one preset from another is asserted by hand.
 */
import { ensureGroupAbsent, ensureGroupPresent } from '../fixtures/groups';
import {
  nfs4Entries, readAcl, readAclTemplate, readOwnership, type AclTemplate,
} from '../fixtures/permissions';
import {
  datasetMountPath, ensureAclDatasetPresent, ensureDatasetAbsent, ensureSmbDatasetPresent,
} from '../fixtures/storage';
import { ensureUserAbsent, ensureUserPresent } from '../fixtures/users';
import {
  choosePreset, openAclEditor, openPermissionsEditor, saveAcl, setAclFromUnixEditor, setAclGroup, setAclOwner,
} from '../flows/permissions';
import { permissionsLocators } from '../locators/permissions';
import { datasetDetailsLocators } from '../locators/storage';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Made with `acltype: 'NFSV4'` and no share type, so its ACL is trivial. */
const trivialLeaf = 'e2e_acl_nfs4_trivial';

/** Made with the SMB preset, so its NFSv4 ACL is not trivial and names `builtin_users`. */
const smbLeaf = 'e2e_acl_nfs4_smb';

/** Throwaway owner and group for Apply Owner / Apply Group. */
const aclOwner = 'e2e_acl_owner';
const aclGroup = 'e2e_acl_group';

/** The fields that make two entries the same entry. Optional where the generated type has them so. */
interface AceShape {
  tag: string;
  type: string;
  perms?: unknown;
  flags?: unknown;
  who?: string | null;
}

/**
 * An entry reduced to what it grants and to whom.
 *
 * `owner@`, `group@` and `everyone@` are kept by tag alone. Their `who` is at
 * most the path's owner or group, which the two calls need not fill in alike,
 * and it is not something a preset chooses. A USER or GROUP entry is kept by the
 * name it resolves to.
 */
function shapeOf(ace: AceShape): AceShape {
  const shape: AceShape = {
    tag: ace.tag,
    type: ace.type,
    perms: ace.perms,
    flags: ace.flags,
  };
  if (ace.tag === 'USER' || ace.tag === 'GROUP') {
    shape.who = ace.who;
  }
  return shape;
}

/** Entries as comparable shapes, in a stable order so a reordering is not a difference. */
function shapesOf(entries: AceShape[]): AceShape[] {
  return entries
    .map(shapeOf)
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
}

/** A template's entries. The response types them as a union across ACL kinds. */
function templateEntries(template: AclTemplate): AceShape[] {
  if (template.acltype !== 'NFS4') {
    throw new Error(`Expected an NFSv4 template, found ${template.acltype} for "${template.name}".`);
  }
  return template.acl as unknown as AceShape[];
}

test.beforeEach(async ({ api, pool }) => {
  // Absent first, so every story starts from the ACL the dataset is created with.
  await ensureDatasetAbsent(api, `${pool}/${trivialLeaf}`);
  await ensureDatasetAbsent(api, `${pool}/${smbLeaf}`);
  await ensureAclDatasetPresent(api, `${pool}/${trivialLeaf}`, 'NFSV4');
  await ensureSmbDatasetPresent(api, `${pool}/${smbLeaf}`);
  await ensureUserPresent(api, aclOwner);
  await ensureGroupPresent(api, aclGroup);
});

test.afterEach(async ({ api, pool }) => {
  const trivial = `${pool}/${trivialLeaf}`;
  const smb = `${pool}/${smbLeaf}`;
  if (leavingTestData(`datasets "${trivial}" and "${smb}", user "${aclOwner}" and group "${aclGroup}"`)) {
    return;
  }

  // Datasets first, so no ACL is left naming an account that no longer exists.
  // These NFSv4 datasets sit under a POSIX pool root, and `smb-share-acl.e2e.ts`
  // skips its root-share story while any such child exists.
  await runCleanupSteps([
    [`remove dataset ${trivial}`, () => ensureDatasetAbsent(api, trivial)],
    [`remove dataset ${smb}`, () => ensureDatasetAbsent(api, smb)],
    [`remove user ${aclOwner}`, () => ensureUserAbsent(api, aclOwner)],
    [`remove group ${aclGroup}`, () => ensureGroupAbsent(api, aclGroup)],
  ]);
});

test('Set ACL on a trivial NFSv4 dataset applies the NFS4_HOME preset', async ({ page, api, pool }) => {
  const dataset = `${pool}/${trivialLeaf}`;
  const path = datasetMountPath(dataset);
  const template = await readAclTemplate(api, path, 'NFS4_HOME');

  expect(await readAcl(api, path)).toMatchObject({ acltype: 'NFS4', trivial: true });

  await openPermissionsEditor(page, dataset);
  await setAclFromUnixEditor(page);
  // The radios are what the dialog the editor raises itself has, and Use Preset's does not.
  await expect(page.locator(permissionsLocators.presetDialog.usePreset)).toBeVisible();
  await choosePreset(page, 'NFS4_HOME');
  await saveAcl(page);

  const acl = await readAcl(api, path);
  expect(acl).toMatchObject({ acltype: 'NFS4', trivial: false });
  const entries = nfs4Entries(acl);
  expect(shapesOf(entries)).toEqual(shapesOf(templateEntries(template)));
  // What tells NFS4_HOME apart from NFS4_RESTRICTED: the group's entry is not inherited.
  expect(entries.find((entry) => entry.tag === 'group@')?.flags).toEqual({ BASIC: 'NOINHERIT' });

  // Saving returns to the dataset, whose card now lists the entries.
  await expect(page.locator(datasetDetailsLocators.path)).toHaveText(dataset);
  await expect(page.locator(permissionsLocators.card.entry('owner@ - root'))).toHaveText('Allow | Full Control');
  await expect(page.locator(permissionsLocators.card.entry('everyone@'))).toHaveText('Allow | Traverse');
});

test('Use Preset replaces the entries of a non-trivial ACL with NFS4_OPEN', async ({ page, api, pool }) => {
  const dataset = `${pool}/${smbLeaf}`;
  const path = datasetMountPath(dataset);
  const template = await readAclTemplate(api, path, 'NFS4_OPEN');
  const before = nfs4Entries(await readAcl(api, path));

  // `by_path` gives every template the builtin groups too, so no one name tells the two ACLs
  // apart. The starting entries differ from the template's, and the exact match after Save
  // rules out an append, which would keep them alongside.
  expect(before.length).toBeGreaterThan(0);
  expect(shapesOf(before)).not.toEqual(shapesOf(templateEntries(template)));

  await openAclEditor(page, dataset);
  await page.locator(permissionsLocators.aclEditor.usePreset).click();
  await expect(page.locator(permissionsLocators.presetDialog.title)).toBeVisible();
  await expect(page.locator(permissionsLocators.presetDialog.usePreset)).toBeHidden();
  await choosePreset(page, 'NFS4_OPEN');
  await saveAcl(page);

  const entries = nfs4Entries(await readAcl(api, path));
  expect(shapesOf(entries)).toEqual(shapesOf(templateEntries(template)));
  expect(entries.find((entry) => entry.tag === 'everyone@')?.perms).toEqual({ BASIC: 'MODIFY' });
});

test('Apply Owner sends the owner and a clear Apply Group leaves the group', async ({ page, api, pool }) => {
  const dataset = `${pool}/${trivialLeaf}`;
  const path = datasetMountPath(dataset);

  expect(await readOwnership(api, path)).toMatchObject({ user: 'root', group: 'root' });

  await openPermissionsEditor(page, dataset);
  await setAclFromUnixEditor(page);
  await choosePreset(page, 'NFS4_RESTRICTED');
  await setAclOwner(page, aclOwner, true);
  await setAclGroup(page, aclGroup, false);
  await saveAcl(page);

  // Only the ticked half is sent (`prepareSetAcl` in `dataset-acl-editor.store.ts`).
  expect(await readOwnership(api, path)).toMatchObject({ user: aclOwner, group: 'root' });
});
