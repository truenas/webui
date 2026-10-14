/**
 * Stories: an admin creates a virtual machine with the wizard, edits one, and deletes one, from the
 * Virtual Machines page, and the appliance holds what they did.
 *
 * No test starts a machine. The wizard is told not to start it on boot, every check reads the
 * state back as STOPPED, and the rows are expanded through their Name cell so that no click can
 * land on the Running toggle beside it.
 *
 * Each change is asserted through `vm.query`, because the list shows a VM's name and running
 * state and little else until a column is turned on. The created VM's devices are read back too,
 * since the wizard makes its disk and NIC in separate calls after the VM itself, and a VM with no
 * disk would still have a row.
 *
 * Edit and delete both act beside a bystander VM that must come through untouched. Both are
 * reached from the row's detail panel, which is keyed by VM id, so acting on the wrong row would
 * act on the wrong VM and still look right on screen.
 *
 * The created VM's zvol goes under a dataset of its own, because the wizard names it after the VM
 * plus a random suffix. Removing that dataset removes whatever the wizard put there.
 */
import { ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import {
  ensureVmAbsent, ensureVmPresent, findVm, provisionedVm, readVmDevices, requireVirtualization,
} from '../fixtures/virtual-machines';
import {
  createVmWithWizard, deleteVmFromList, openEditVmForm, saveEditVmForm,
} from '../flows/virtual-machines';
import { virtualMachinesLocators } from '../locators/virtual-machines';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Created through the wizard, never over the API, because creating it is the thing under test. */
const createdVm = 'e2e_vm_created';

/** Provisioned over the API with no devices (`ensureVmPresent`). Edited or deleted through the UI. */
const targetVm = 'e2e_vm_target';

/** Provisioned the same way as the target. Nothing here acts on it, so nothing here may change it. */
const bystanderVm = 'e2e_vm_bystander';

const allVms = [createdVm, targetVm, bystanderVm];

/** The dataset the wizard's zvol goes under, below the shared pool. */
const disksLeaf = 'e2e_vm_disks';

/** How long a deletion may take to show in `vm.query`. One call, but it removes the VM's record. */
const deleteTimeoutMs = 60_000;

test.beforeEach(async ({ api, pool }) => {
  await requireVirtualization(api);

  for (const vm of allVms) {
    await ensureVmAbsent(api, vm);
  }
  await ensureDatasetAbsent(api, `${pool}/${disksLeaf}`);
});

test.afterEach(async ({ api, pool }) => {
  const disks = `${pool}/${disksLeaf}`;
  if (leavingTestData(`the VMs ${allVms.join(', ')} and the dataset ${disks}`)) {
    return;
  }

  // The VMs first: a VM's disk must not be removed from under it.
  await runCleanupSteps([
    ...allVms.map((vm): [string, () => Promise<void>] => [`remove the VM "${vm}"`, () => ensureVmAbsent(api, vm)]),
    [`remove the dataset "${disks}"`, () => ensureDatasetAbsent(api, disks)],
  ]);
});

test('an admin creates a VM with the wizard, and the appliance really has one', async ({ page, api, pool }) => {
  const disks = `${pool}/${disksLeaf}`;
  await ensureDatasetPresent(api, disks);

  await createVmWithWizard(page, {
    name: createdVm,
    description: 'created by e2e',
    memory: '1 GiB',
    datastore: disks,
    volsize: '1 GiB',
  });

  await expect(page.locator(virtualMachinesLocators.row.name(createdVm))).toHaveText(createdVm);

  const created = await findVm(api, createdVm);
  if (!created) {
    throw new Error(`The wizard closed, but vm.query has no VM named "${createdVm}".`);
  }
  expect(created).toMatchObject({
    description: 'created by e2e',
    // The form takes `1 GiB` and has to turn it into MiB itself.
    memory: 1024,
    autostart: false,
    state: 'STOPPED',
  });

  // The wizard makes the disk and the NIC after the VM. The VNC display was turned off, so
  // there is no third device.
  const devices = await readVmDevices(api, created.id);
  expect(devices.types).toEqual(['DISK', 'NIC']);
  expect(devices.diskPaths).toHaveLength(1);
  expect(devices.diskPaths[0]).toMatch(new RegExp(`^/dev/zvol/${disks}/${createdVm}-`));
});

test('editing a VM changes the VM that was picked', async ({ page, api }) => {
  const targetId = await ensureVmPresent(api, targetVm);
  await ensureVmPresent(api, bystanderVm);

  const form = virtualMachinesLocators.editForm;
  await openEditVmForm(page, targetVm, targetId);
  await page.locator(form.description).fill('edited by e2e');
  await page.locator(form.shutdownTimeout).fill('30');
  await page.locator(form.memory).fill('1 GiB');
  await page.locator(form.memory).blur();
  await saveEditVmForm(page);

  expect(await findVm(api, targetVm)).toMatchObject({
    description: 'edited by e2e',
    shutdown_timeout: 30,
    memory: 1024,
    autostart: false,
    state: 'STOPPED',
  });

  expect(await findVm(api, bystanderVm)).toMatchObject({
    description: provisionedVm.description,
    shutdown_timeout: provisionedVm.shutdownTimeout,
    memory: provisionedVm.memory,
  });
});

test('a confirmed deletion removes the VM that was picked', async ({ page, api }) => {
  const targetId = await ensureVmPresent(api, targetVm);
  await ensureVmPresent(api, bystanderVm);

  await deleteVmFromList(page, targetVm, targetId);

  await expect
    .poll(async () => findVm(api, targetVm), { timeout: deleteTimeoutMs })
    .toBeUndefined();
  await expect(page.locator(virtualMachinesLocators.row.row(targetVm))).toBeHidden();
  expect(await findVm(api, bystanderVm)).toBeDefined();
});
