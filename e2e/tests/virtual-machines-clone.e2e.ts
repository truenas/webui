/**
 * Stories: an admin clones a virtual machine from its row on the Virtual Machines page, under a
 * name they choose or under one middleware picks, and the appliance holds a second VM like the
 * first.
 *
 * The source is provisioned over the API with no devices (`ensureVmPresent`), so the clone is of
 * the VM's record alone: with a disk, `vm.clone` would clone its zvol too, which is out of scope.
 * Nothing here starts a machine.
 *
 * Left unnamed, middleware names the clone `<source>_clone<N>`, with N the first number not
 * already taken. The spec does not rely on that shape beyond the source's name leading it: it
 * reads every VM name before and after, and the one that is new is the clone.
 */
import {
  ensureVmAbsent, ensureVmPresent, findVm, listVmNames, provisionedVm, requireVirtualization,
} from '../fixtures/virtual-machines';
import { cloneVmFromList } from '../flows/virtual-machines';
import { virtualMachinesLocators } from '../locators/virtual-machines';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Provisioned over the API. Cloned through the UI, and never changed by it. */
const sourceVm = 'e2e_vm_clone_source';

/** The name typed into the Clone dialog in the first story. */
const namedClone = 'e2e_vm_clone_named';

/** How long a clone may take to show in `vm.query` once the dialog has closed. One call. */
const cloneTimeoutMs = 60_000;

/**
 * Removes the named clone and every VM whose name starts with the source's, other than the source
 * itself: that covers whatever middleware named an unnamed clone.
 */
async function removeClones(api: E2eApiClient): Promise<void> {
  const clones = (await listVmNames(api)).filter((name) => name !== sourceVm && name.startsWith(sourceVm));

  for (const clone of [namedClone, ...clones]) {
    await ensureVmAbsent(api, clone);
  }
}

test.beforeEach(async ({ api }) => {
  await requireVirtualization(api);

  await removeClones(api);
  await ensureVmAbsent(api, sourceVm);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the VM ${sourceVm} and every clone of it`)) {
    return;
  }

  // The clones first, then the VM they were made from.
  await runCleanupSteps([
    [`remove every clone of "${sourceVm}"`, () => removeClones(api)],
    [`remove the VM "${sourceVm}"`, () => ensureVmAbsent(api, sourceVm)],
  ]);
});

test('an admin clones a VM under a name they choose', async ({ page, api }) => {
  const sourceId = await ensureVmPresent(api, sourceVm);

  await cloneVmFromList(page, sourceVm, sourceId, namedClone);

  await expect(page.locator(virtualMachinesLocators.row.name(namedClone))).toHaveText(namedClone);
  await expect(page.locator(virtualMachinesLocators.row.name(sourceVm))).toHaveText(sourceVm);

  await expect
    .poll(async () => findVm(api, namedClone), { timeout: cloneTimeoutMs })
    .toBeDefined();
  const clone = await findVm(api, namedClone);
  expect(clone?.id).not.toBe(sourceId);
  expect(clone).toMatchObject({
    description: provisionedVm.description,
    memory: provisionedVm.memory,
    vcpus: provisionedVm.vcpus,
    state: 'STOPPED',
  });

  expect(await findVm(api, sourceVm)).toMatchObject({
    id: sourceId,
    name: sourceVm,
    description: provisionedVm.description,
    memory: provisionedVm.memory,
    vcpus: provisionedVm.vcpus,
    state: 'STOPPED',
  });
});

test('a clone with no name gets one from middleware', async ({ page, api }) => {
  const sourceId = await ensureVmPresent(api, sourceVm);
  const before = await listVmNames(api);

  await cloneVmFromList(page, sourceVm, sourceId);

  await expect
    .poll(async () => (await listVmNames(api)).length, { timeout: cloneTimeoutMs })
    .toBe(before.length + 1);
  const added = (await listVmNames(api)).filter((name) => !before.includes(name));
  expect(added).toHaveLength(1);

  const [cloneName = ''] = added;
  expect(cloneName).not.toBe(sourceVm);
  expect(cloneName).toMatch(new RegExp(`^${sourceVm}`));
  await expect(page.locator(virtualMachinesLocators.row.name(cloneName))).toHaveText(cloneName);
  expect(await findVm(api, cloneName)).toMatchObject({
    memory: provisionedVm.memory,
    vcpus: provisionedVm.vcpus,
    state: 'STOPPED',
  });
});
