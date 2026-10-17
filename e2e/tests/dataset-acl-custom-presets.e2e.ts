/**
 * Stories: saving the ACL editor's entries as a custom preset, applying that preset to another
 * dataset, and deleting it, all on NFSv4 datasets.
 *
 * A custom preset is an ACL template, and templates are global to the appliance: they outlive every
 * dataset. So every test deletes `e2e_acl_custom` over the API before and after it runs, whatever it
 * did in between. The two stories that need the preset to exist create it over the API, from the
 * source dataset's own entries with `group@` changed to Read, so it is told apart from what the SMB
 * preset gives.
 *
 * Each result is read back through `filesystem.acltemplate.query` and `filesystem.getacl`.
 */
import {
  ensureAclTemplateAbsent,
  ensureAclTemplatePresent,
  findAclTemplate,
  nfs4Entries,
  readAcl,
  readAclTemplate,
  shapesOf,
  templateEntries,
  type AceShape,
  type AclTemplateCreate,
} from '../fixtures/permissions';
import {
  datasetMountPath, ensureAclDatasetPresent, ensureDatasetAbsent, ensureSmbDatasetPresent,
} from '../fixtures/storage';
import {
  choosePreset,
  openAclEditor,
  openPermissionsEditor,
  openSaveAsPresetDialog,
  removePreset,
  saveAcl,
  saveAsPreset,
  selectAce,
  setAclFromUnixEditor,
  setBasicPermission,
} from '../flows/permissions';
import { permissionsLocators } from '../locators/permissions';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Made with the SMB preset, so its NFSv4 ACL is not trivial and the editor opens on its entries. */
const sourceLeaf = 'e2e_acl_preset_src';

/** Made with `acltype: 'NFSV4'` and no share type, so its ACL is trivial. */
const targetLeaf = 'e2e_acl_preset_dst';

/** The custom preset every story saves, applies or deletes. */
const presetName = 'e2e_acl_custom';

/**
 * Creates {@link presetName} over the API from `path`'s entries, with `group@` set to Read.
 *
 * What Save As Preset would send: the entries without `who`, since a template stores ids.
 */
async function createPresetFrom(api: E2eApiClient, path: string): Promise<void> {
  const entries = nfs4Entries(await readAcl(api, path)).map((entry) => ({
    tag: entry.tag,
    id: entry.id,
    type: entry.type,
    perms: entry.tag === 'group@' ? { BASIC: 'READ' } : entry.perms,
    flags: entry.flags,
  }));

  await ensureAclTemplatePresent(api, {
    name: presetName,
    acltype: 'NFS4',
    acl: entries as unknown as AclTemplateCreate['acl'],
  });
}

test.beforeEach(async ({ api, pool }) => {
  // Absent first, so a run is repeatable against an appliance a failed run left dirty.
  await ensureAclTemplateAbsent(api, presetName);
  await ensureDatasetAbsent(api, `${pool}/${targetLeaf}`);
  await ensureDatasetAbsent(api, `${pool}/${sourceLeaf}`);
  await ensureSmbDatasetPresent(api, `${pool}/${sourceLeaf}`);
  await ensureAclDatasetPresent(api, `${pool}/${targetLeaf}`, 'NFSV4');
});

test.afterEach(async ({ api, pool }) => {
  const source = `${pool}/${sourceLeaf}`;
  const target = `${pool}/${targetLeaf}`;
  if (leavingTestData(`ACL preset "${presetName}" and datasets "${target}" and "${source}"`)) {
    return;
  }

  // The preset first: it is the one thing here that no later run's dataset cleanup would remove.
  // These NFSv4 datasets sit under a POSIX pool root, and `smb-share-acl.e2e.ts` skips its
  // root-share story while any such child exists.
  await runCleanupSteps([
    [`remove ACL preset ${presetName}`, () => ensureAclTemplateAbsent(api, presetName)],
    [`remove dataset ${target}`, () => ensureDatasetAbsent(api, target)],
    [`remove dataset ${source}`, () => ensureDatasetAbsent(api, source)],
  ]);
});

test('Save As Preset stores the edited entries and does not save the ACL',async ({ page, api, pool }) => {
  const dataset = `${pool}/${sourceLeaf}`;
  const path = datasetMountPath(dataset);
  const before = nfs4Entries(await readAcl(api, path));
  const index = before.findIndex((entry) => entry.tag === 'group@');

  // The edit has to be a change, or a preset saved before it would pass as well.
  expect(index).toBeGreaterThanOrEqual(0);
  expect(before[index]?.perms).not.toEqual({ BASIC: 'READ' });
  expect(await findAclTemplate(api, presetName)).toBeUndefined();

  await openAclEditor(page, dataset);
  await selectAce(page, index, 'group@');
  await setBasicPermission(page, 'Read');
  await saveAsPreset(page, presetName);
  await page.locator(permissionsLocators.aclEditor.cancel).click();
  await expect(page.locator(permissionsLocators.aclEditor.save)).toBeHidden();

  const template = await findAclTemplate(api, presetName);
  expect(template).toMatchObject({ acltype: 'NFS4', builtin: false });
  // The response types the entries as a union across ACL kinds, and the line above pinned NFSv4.
  const saved = template?.acl as unknown as AceShape[] | undefined;
  expect(saved).toHaveLength(before.length);
  expect(saved?.find((entry) => entry.tag === 'group@')?.perms).toEqual({ BASIC: 'READ' });

  // The preset took the unsaved edit, and the dataset kept the ACL it had.
  expect(nfs4Entries(await readAcl(api, path))).toEqual(before);
});

test('Use Preset applies a custom preset to another NFSv4 dataset', async ({ page, api, pool }) => {
  const dataset = `${pool}/${targetLeaf}`;
  const path = datasetMountPath(dataset);
  await createPresetFrom(api, datasetMountPath(`${pool}/${sourceLeaf}`));
  // As the picker on this path offers it, so the entries are the ones choosing it puts in the form.
  const template = await readAclTemplate(api, path, presetName);

  expect(await readAcl(api, path)).toMatchObject({ acltype: 'NFS4', trivial: true });

  await openPermissionsEditor(page, dataset);
  await setAclFromUnixEditor(page);
  await choosePreset(page, presetName);
  await saveAcl(page);

  const acl = await readAcl(api, path);
  expect(acl).toMatchObject({ acltype: 'NFS4', trivial: false });
  const entries = nfs4Entries(acl);
  expect(shapesOf(entries)).toEqual(shapesOf(templateEntries(template)));
  // What tells this preset apart from the SMB preset it was made from.
  expect(entries.find((entry) => entry.tag === 'group@')?.perms).toEqual({ BASIC: 'READ' });
});

test('removing a custom preset deletes it and leaves the built-in ones', async ({ page, api, pool }) => {
  const dataset = `${pool}/${sourceLeaf}`;
  const dialog = permissionsLocators.saveAsPresetDialog;
  await createPresetFrom(api, datasetMountPath(dataset));

  expect(await findAclTemplate(api, presetName)).toBeDefined();

  await openAclEditor(page, dataset);
  await openSaveAsPresetDialog(page);
  await expect(page.locator(dialog.presetName(presetName))).toBeVisible();
  // A built-in preset is listed with no remove icon, where the custom one has one.
  await expect(page.locator(dialog.removePreset(presetName))).toBeVisible();
  await expect(page.locator(dialog.removePreset('NFS4_OPEN'))).toHaveCount(0);

  await removePreset(page, presetName);
  // The list was read again, not emptied.
  await expect(page.locator(dialog.presetName('NFS4_OPEN'))).toBeVisible();
  await page.locator(dialog.cancel).click();
  await expect(page.locator(dialog.title)).toBeHidden();
  await page.locator(permissionsLocators.aclEditor.cancel).click();
  await expect(page.locator(permissionsLocators.aclEditor.save)).toBeHidden();

  expect(await findAclTemplate(api, presetName)).toBeUndefined();
  expect(await findAclTemplate(api, 'NFS4_OPEN')).toMatchObject({ builtin: true });
});
