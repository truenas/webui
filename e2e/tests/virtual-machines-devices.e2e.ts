/**
 * Stories: an admin adds a NIC to a virtual machine, edits one, deletes a disk together with its
 * zvol, and deletes a NIC, all from the VM's Devices page, and the appliance holds what they did.
 *
 * The page is reached the way a user reaches it: the sidebar, the VM's row, then its Devices
 * button. No test starts the VM, and none needs to: every device here is added, changed and
 * removed on a stopped machine.
 *
 * Each change is asserted through `vm.device.query`, by device id where one exists, because the
 * list shows a device's type and order and nothing a change here touches. The disk's zvol is
 * checked through `pool.dataset.query` as well, since deleting the device and deleting its zvol
 * are separate choices in the dialog.
 *
 * The zvol goes under a dataset of this spec's own, below the shared pool, and the teardown
 * removes the VM before that dataset, so a VM's disk is never removed from under it.
 */
import {
  ensureDatasetAbsent, ensureDatasetPresent, ensureZvolPresent, findDataset,
} from '../fixtures/storage';
import {
  addVmDisk, addVmNic, ensureVmAbsent, ensureVmPresent, findVmDevices, requireVirtualization,
} from '../fixtures/virtual-machines';
import {
  addNicFromDevicesPage, changeNicType, deleteDeviceFromList, openVmDevices,
} from '../flows/virtual-machines';
import { virtualMachinesLocators } from '../locators/virtual-machines';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Provisioned over the API with no devices (`ensureVmPresent`). */
const vmName = 'e2e_vm_devices';

/** The dataset the disk's zvol goes under, below the shared pool. */
const disksLeaf = 'e2e_vm_devices_disks';

/** The zvol itself. The delete dialog asks for this last path segment, not the full name. */
const zvolLeaf = 'e2e_vm_devices_disk';

/** The adapter types' labels in the form, and what middleware stores for each. */
const e1000 = { label: 'Intel e82585 (e1000)', type: 'E1000' } as const;
const virtio = { label: 'VirtIO', type: 'VIRTIO' } as const;

/** How long a device's removal may take to show in the API. One call, but it can destroy a zvol. */
const deleteTimeoutMs = 60_000;

test.beforeEach(async ({ api, pool }) => {
  await requireVirtualization(api);

  // The VM first: a VM's disk must not be removed from under it.
  await ensureVmAbsent(api, vmName);
  await ensureDatasetAbsent(api, `${pool}/${disksLeaf}`);
});

test.afterEach(async ({ api, pool }) => {
  const disks = `${pool}/${disksLeaf}`;
  if (leavingTestData(`the VM ${vmName} and the dataset ${disks}`)) {
    return;
  }

  await runCleanupSteps([
    [`remove the VM "${vmName}"`, () => ensureVmAbsent(api, vmName)],
    [`remove the dataset "${disks}"`, () => ensureDatasetAbsent(api, disks)],
  ]);
});

test('an admin adds a NIC to a VM', async ({ page, api }) => {
  const vmId = await ensureVmPresent(api, vmName);

  await openVmDevices(page, vmName, vmId);
  const mac = await addNicFromDevicesPage(page, e1000.label);

  const devices = await findVmDevices(api, vmId);
  expect(devices).toHaveLength(1);
  const [nic] = devices;
  if (!nic) {
    throw new Error(`The device form closed, but VM "${vmName}" has no device.`);
  }
  expect(nic.attributes).toMatchObject({ dtype: 'NIC', type: e1000.type });
  expect(nic.attributes.mac?.toLowerCase()).toBe(mac.toLowerCase());

  const { rows, row } = virtualMachinesLocators.devices;
  await expect(page.locator(rows)).toHaveCount(1);
  await expect(page.locator(row('NIC', nic.order))).toBeVisible();
});

test('an admin changes the adapter type of a NIC', async ({ page, api }) => {
  const vmId = await ensureVmPresent(api, vmName);
  const nic = await addVmNic(api, vmId, e1000.type);
  const { mac } = nic.attributes;
  if (!mac) {
    throw new Error('Middleware stored the NIC with no MAC, so the edit form has nothing to show it loaded.');
  }

  await openVmDevices(page, vmName, vmId);
  await changeNicType(page, { id: nic.id, dtype: 'NIC', order: nic.order }, mac, virtio.label);

  // The same device, changed: an edit that made a second NIC would leave two.
  const devices = await findVmDevices(api, vmId);
  expect(devices.map((device) => device.id)).toEqual([nic.id]);
  expect(devices[0]?.attributes).toMatchObject({ dtype: 'NIC', type: virtio.type });
});

test('an admin deletes a disk and its zvol', async ({ page, api, pool }) => {
  const disks = `${pool}/${disksLeaf}`;
  const zvol = `${disks}/${zvolLeaf}`;
  await ensureDatasetPresent(api, disks);
  await ensureZvolPresent(api, zvol);
  const vmId = await ensureVmPresent(api, vmName);
  const disk = await addVmDisk(api, vmId, zvol);

  await openVmDevices(page, vmName, vmId);
  await deleteDeviceFromList(page, { id: disk.id, dtype: 'DISK', order: disk.order }, zvolLeaf);

  await expect(page.locator(virtualMachinesLocators.devices.rows)).toHaveCount(0);
  expect(await findVmDevices(api, vmId)).toEqual([]);
  // Deleting the device alone would leave the zvol; ticking the box is what removes it.
  await expect
    .poll(async () => findDataset(api, zvol), { timeout: deleteTimeoutMs })
    .toBeUndefined();
});

test('an admin deletes a NIC', async ({ page, api }) => {
  const vmId = await ensureVmPresent(api, vmName);
  const nic = await addVmNic(api, vmId, e1000.type);

  await openVmDevices(page, vmName, vmId);
  await deleteDeviceFromList(page, { id: nic.id, dtype: 'NIC', order: nic.order });

  await expect(page.locator(virtualMachinesLocators.devices.rows)).toHaveCount(0);
  expect(await findVmDevices(api, vmId)).toEqual([]);
});
