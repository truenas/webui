/**
 * Stories: an admin exports a stopped VM's disk to an image file from its Devices page, and creates
 * a VM in the wizard from an image file, and the appliance holds what they did. The export dialog
 * and the wizard both refuse what could not work, before anything is sent.
 *
 * No test starts a VM. Export to Image is offered only while the VM is stopped, and an imported
 * disk needs no running machine to show where it landed.
 *
 * The export is asserted through `filesystem.stat` and `vm.device.virtual_size`: the file exists,
 * and the disk it holds is the size of the zvol it came from. The import is asserted through
 * `pool.dataset.query`, `core.get_jobs` and `vm.device.query`: one new zvol, at the typed size, a
 * conversion from the image into it that succeeded, and the VM's disk is that zvol and not a
 * second one the wizard made beside it.
 *
 * Everything goes under one dataset of this spec's own, below the shared pool: a plain filesystem,
 * so it is at once a directory an image can be exported into and a Zvol Location the wizard
 * offers. The teardown removes the VMs before it, so a VM's disk is never removed from under it,
 * and its recursive delete takes the image files and every zvol in it.
 */
import {
  datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent, ensureZvolPresent, findDataset, listZvolsUnder,
} from '../fixtures/storage';
import {
  addVmDisk, ensureVmAbsent, ensureVmPresent, exportZvolToImage, findConvertJobStates, findFile, findVm,
  readImageVirtualSize, readVmDevices, requireVirtualization,
} from '../fixtures/virtual-machines';
import {
  createVmWithWizard, discardVmWizard, exportDiskFromDevicesPage, fillExportDiskDialog, fillNewDiskStep,
  openExportDiskDialog, openVmDevices, openVmWizardOnDisks,
} from '../flows/virtual-machines';
import { errorDialogLocators } from '../locators/dialogs';
import { virtualMachinesLocators } from '../locators/virtual-machines';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Provisioned over the API with one disk, whose zvol is exported. */
const exportedVm = 'e2e_vm_export';

/** Created through the wizard from an image, never over the API, because creating it is the thing under test. */
const importedVm = 'e2e_vm_import';

const allVms = [exportedVm, importedVm];

/** The dataset everything here goes under, below the shared pool. */
const imagesLeaf = 'e2e_vm_images';

/** The exported VM's zvol. `ensureZvolPresent` makes it 64 MiB, sparse. */
const zvolLeaf = 'e2e_vm_images_disk';

/** What `ensureZvolPresent` sizes a zvol at, and so the disk any image made from one holds. */
const zvolBytes = 64 * 1024 * 1024;

/** The wizard's VM settings, and the size it is told to give the new zvol: the image's own. */
const wizardVm = {
  name: importedVm,
  description: 'imported by e2e',
  memory: '512 MiB',
} as const;
const importedVolsize = '64 MiB';

/** How long the exported file may take to appear. One small conversion, run as a job. */
const exportTimeoutMs = 120_000;

/**
 * Writes the image the wizard imports, over the API, and removes the zvol it came from, so only the
 * image is left under the dataset. The wizard is the thing under test here, not the export.
 */
async function seedImage(api: E2eApiClient, images: string): Promise<string> {
  const sourceZvol = `${images}/e2e_vm_images_source`;
  const image = `${datasetMountPath(images)}/e2e-source.qcow2`;

  await ensureZvolPresent(api, sourceZvol);
  await exportZvolToImage(api, sourceZvol, image);
  await ensureDatasetAbsent(api, sourceZvol);

  return image;
}

test.beforeEach(async ({ api, pool }) => {
  await requireVirtualization(api);

  // The VMs first: a VM's disk must not be removed from under it.
  for (const vm of allVms) {
    await ensureVmAbsent(api, vm);
  }
  await ensureDatasetAbsent(api, `${pool}/${imagesLeaf}`);
});

test.afterEach(async ({ api, pool }) => {
  const images = `${pool}/${imagesLeaf}`;
  if (leavingTestData(`the VMs ${allVms.join(', ')} and the dataset ${images}`)) {
    return;
  }

  await runCleanupSteps([
    ...allVms.map((vm): [string, () => Promise<void>] => [`remove the VM "${vm}"`, () => ensureVmAbsent(api, vm)]),
    [`remove the dataset "${images}"`, () => ensureDatasetAbsent(api, images)],
  ]);
});

test('an admin exports a stopped VM\'s disk to an image file in a dataset', async ({ page, api, pool }) => {
  const images = `${pool}/${imagesLeaf}`;
  const zvol = `${images}/${zvolLeaf}`;
  await ensureDatasetPresent(api, images);
  await ensureZvolPresent(api, zvol);
  const vmId = await ensureVmPresent(api, exportedVm);
  const disk = await addVmDisk(api, vmId, zvol);

  await openVmDevices(page, exportedVm, vmId);
  await exportDiskFromDevicesPage(
    page,
    { id: disk.id, dtype: 'DISK', order: disk.order },
    `/dev/zvol/${zvol}`,
    datasetMountPath(images),
    'e2e-exported',
  );
  await expect(page.locator(errorDialogLocators.title)).toBeHidden();

  // The extension is the format's, added by the dialog to the name typed.
  const image = `${datasetMountPath(images)}/e2e-exported.qcow2`;
  await expect
    .poll(async () => (await findFile(api, image))?.type, { timeout: exportTimeoutMs })
    .toBe('FILE');
  expect(await readImageVirtualSize(api, image)).toBe(zvolBytes);
});

test('an admin creates a VM in the wizard from an image, and it gets a new zvol holding that image', async ({
  page, api, pool,
}) => {
  const images = `${pool}/${imagesLeaf}`;
  await ensureDatasetPresent(api, images);
  const image = await seedImage(api, images);
  expect(await listZvolsUnder(api, images)).toEqual([]);

  await createVmWithWizard(page, {
    ...wizardVm,
    datastore: images,
    volsize: importedVolsize,
    importImage: image,
  });

  await expect(page.locator(virtualMachinesLocators.row.name(importedVm))).toHaveText(importedVm);

  // The one zvol the wizard made, named after the VM, at the size typed.
  const zvols = await listZvolsUnder(api, images);
  expect(zvols).toHaveLength(1);
  const [zvol] = zvols;
  expect(zvol).toMatch(new RegExp(`^${images}/${importedVm}-`));
  const volsize = (await findDataset(api, zvol ?? ''))?.volsize?.parsed;
  expect(volsize).toBe(await readImageVirtualSize(api, image));

  // The image was really converted into it. Without this the test would pass on a wizard that
  // ignored Import Image, since its ordinary path names and sizes the new zvol the same way.
  expect(await findConvertJobStates(api, image, `/dev/zvol/${zvol}`)).toEqual(['SUCCESS']);

  // The disk is the zvol the image was converted into, not a second one created beside it.
  const created = await findVm(api, importedVm);
  if (!created) {
    throw new Error(`The wizard closed, but vm.query has no VM named "${importedVm}".`);
  }
  expect(created.state).toBe('STOPPED');
  const devices = await readVmDevices(api, created.id);
  expect(devices.types).toEqual(['DISK', 'NIC']);
  expect(devices.diskPaths).toEqual([`/dev/zvol/${zvol}`]);
});

test('the export dialog refuses a pool root as its destination', async ({ page, api, pool }) => {
  const images = `${pool}/${imagesLeaf}`;
  const zvol = `${images}/${zvolLeaf}`;
  await ensureDatasetPresent(api, images);
  await ensureZvolPresent(api, zvol);
  const vmId = await ensureVmPresent(api, exportedVm);
  const disk = await addVmDisk(api, vmId, zvol);
  const dialog = virtualMachinesLocators.exportDiskDialog;

  await openVmDevices(page, exportedVm, vmId);
  await openExportDiskDialog(page, { id: disk.id, dtype: 'DISK', order: disk.order }, `/dev/zvol/${zvol}`);
  await fillExportDiskDialog(page, datasetMountPath(pool), 'e2e-refused');

  await expect(page.locator(dialog.destinationDirErrors)).toContainText('Cannot export to pool root');
  await expect(page.locator(dialog.export)).toBeDisabled();
  await page.locator(dialog.cancel).click();
  await expect(page.locator(dialog.title)).toBeHidden();

  // A backstop: Export was never pressed, so nothing could have been written. It would catch a
  // dialog that ran the job from Cancel.
  expect(await findFile(api, `${datasetMountPath(pool)}/e2e-refused.qcow2`)).toBeUndefined();
});

test('the wizard refuses a disk smaller than the image it imports', async ({ page, api, pool }) => {
  const images = `${pool}/${imagesLeaf}`;
  await ensureDatasetPresent(api, images);
  const image = await seedImage(api, images);
  const { wizard } = virtualMachinesLocators;

  await openVmWizardOnDisks(page, wizardVm);
  await fillNewDiskStep(page, { datastore: images, volsize: '32 MiB', importImage: image });

  // The check asks `vm.device.virtual_size`, so the message is waited for rather than Next.
  await expect(page.locator(wizard.volsizeField)).toContainText(
    'Disk size must be at least 64 MiB to accommodate the imported image',
  );
  await expect(page.locator(wizard.next).filter({ visible: true })).toBeDisabled();

  await discardVmWizard(page);

  // Backstops: Save was never reached, so neither could exist. They would catch a wizard that
  // created the zvol or the VM before its last step.
  expect(await findVm(api, importedVm)).toBeUndefined();
  expect(await listZvolsUnder(api, images)).toEqual([]);
});
