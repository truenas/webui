/**
 * Stories: an admin mounts a dataset into a stopped container from its
 * Filesystem Devices card, changes where it is mounted, removes it, and is
 * refused a source outside a pool.
 *
 * ## Setup and teardown
 *
 * Each test starts with the worker's `pool` as the preferred pool, a dataset
 * `<pool>/e2e_ct_share` to mount, and a stopped container `e2e-ct-fs` seeded over
 * the API. Teardown deletes the container first, so the mount goes with it, then
 * the dataset, then writes back the containers settings the appliance held before
 * the first test. Once the file is done it removes `<pool>/.truenas_containers`,
 * as `containers.e2e.ts` does.
 */
import {
  type ContainerSettings, containersDataset, containerSettingsBaseline, ensureContainerAbsent,
  findContainer, findFilesystemDevices, firstRegistryImage, readContainerConfig, seedContainer,
  seedFilesystemDevice, setContainerConfig,
} from '../fixtures/containers';
import {
  datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent, findDataset,
} from '../fixtures/storage';
import { fillFilesystemDeviceSource, openContainerDetails, saveFilesystemDevice } from '../flows/containers';
import { confirmDestructiveAction } from '../flows/storage';
import { containersLocators } from '../locators/containers';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';
import { slowCallTimeoutMs } from '../support/timeouts';

const containerName = 'e2e-ct-fs';
const target = '/data';
const movedTarget = '/srv/data';
/** `poolPathValidator`'s refusal, `containersHelptext.validators.poolPathMustStartWithMnt`. */
const outsidePoolMessage = 'Path must reside within a pool mount point (start with /mnt/)';

const card = containersLocators.filesystemDevices;
const form = containersLocators.filesystemDeviceForm;

/** The dataset the tests mount. A spec of its own, so nothing else on the pool is touched. */
function shareDataset(pool: string): string {
  return `${pool}/e2e_ct_share`;
}

/** How the card and its menu name a device, as `getDeviceDescription` words a FILESYSTEM one. */
function describeDevice(source: string, mountedAt: string): string {
  return `${source} → ${mountedAt}`;
}

/** What the appliance held before this file ran, and therefore what `afterEach` writes back. */
let found: ContainerSettings | undefined;
/** The registry image every test's container is created from, read once. */
let image: { name: string; version: string } | undefined;
/** The seeded container's id, which its devices are keyed by. */
let containerId: number;

test.beforeAll(async ({ api }) => {
  found = await readContainerConfig(api);
  image = await firstRegistryImage(api, 'debian');
});

test.beforeEach(async ({ api, pool }) => {
  await ensureContainerAbsent(api, containerName);
  await ensureDatasetAbsent(api, shareDataset(pool));
  await setContainerConfig(api, { ...containerSettingsBaseline, preferred_pool: pool });
  await ensureDatasetPresent(api, shareDataset(pool));

  if (!image) {
    throw new Error('beforeAll found no image to create the container from');
  }
  await seedContainer(api, { name: containerName, pool, image });
  const container = await findContainer(api, containerName);
  if (!container) {
    throw new Error(`container ${containerName} was seeded and then not found`);
  }
  containerId = container.id;
});

test.afterEach(async ({ api, pool }) => {
  if (leavingTestData(`container "${containerName}", dataset ${shareDataset(pool)} and the containers settings`)) {
    return;
  }

  await runCleanupSteps([
    [`delete container ${containerName}`, () => ensureContainerAbsent(api, containerName)],
    [`delete dataset ${shareDataset(pool)}`, () => ensureDatasetAbsent(api, shareDataset(pool))],
    // Guarded: if `beforeAll` threw, there is nothing known to write back.
    ['restore the containers settings', async () => {
      if (found !== undefined) {
        await setContainerConfig(api, found);
      }
    }],
  ]);
});

test.afterAll(async ({ api, pool }) => {
  if (leavingTestData(containersDataset(pool))) {
    return;
  }

  // After every container on the pool is gone: each one is a clone of the image
  // this holds.
  await ensureDatasetAbsent(api, containersDataset(pool));
});

test('an admin mounts a dataset into a container', async ({ page, api, pool }) => {
  const source = datasetMountPath(shareDataset(pool));

  await openContainerDetails(page, containerName);
  await expect(page.locator(card.empty)).toBeVisible();

  await page.locator(card.add).click();
  await fillFilesystemDeviceSource(page, source);
  await page.locator(form.target).fill(target);
  await saveFilesystemDevice(page);

  await expect(page.locator(card.empty)).toBeHidden();

  const [device, ...others] = await findFilesystemDevices(api, containerId);
  expect(others).toEqual([]);
  expect(device).toMatchObject({ source, target });
  if (!device) {
    throw new Error('the save was accepted and no FILESYSTEM device is on the container');
  }
  await expect(page.locator(card.device(device.id))).toContainText(describeDevice(source, target));
});

test('an admin changes where a dataset is mounted', async ({ page, api, pool }) => {
  const source = datasetMountPath(shareDataset(pool));
  const device = await seedFilesystemDevice(api, containerId, { source, target });
  const description = describeDevice(source, target);

  await openContainerDetails(page, containerName);
  await page.locator(card.actionsFor(description)).click();
  await page.locator(card.edit(description)).click();
  // The form fills itself from the device as it opens.
  await expect(page.locator(form.target)).toHaveValue(target);
  await page.locator(form.target).fill(movedTarget);
  await saveFilesystemDevice(page);

  await expect(page.locator(card.device(device.id))).toContainText(describeDevice(source, movedTarget));

  // The same device, moved, rather than a second one beside it.
  expect(await findFilesystemDevices(api, containerId)).toEqual([{ id: device.id, source, target: movedTarget }]);
});

test('an admin removes a mounted dataset, and the dataset stays', async ({ page, api, pool }) => {
  const source = datasetMountPath(shareDataset(pool));
  const device = await seedFilesystemDevice(api, containerId, { source, target });
  const description = describeDevice(source, target);

  await openContainerDetails(page, containerName);
  // Shown before the delete, so the empty state below is the delete's doing.
  await expect(page.locator(card.device(device.id))).toBeVisible();
  await expect(page.locator(card.empty)).toBeHidden();

  await page.locator(card.actionsFor(description)).click();
  await page.locator(card.delete(description)).click();
  await confirmDestructiveAction(page);

  await expect(page.locator(card.empty)).toBeVisible({ timeout: slowCallTimeoutMs });
  expect(await findFilesystemDevices(api, containerId)).toEqual([]);
  // Removing the mount must not remove the data.
  expect(await findDataset(api, shareDataset(pool))).toBeDefined();
});

test('the form refuses a source outside a pool', async ({ page, api, pool }) => {
  const save = page.locator(containersLocators.save);

  await openContainerDetails(page, containerName);
  await page.locator(card.add).click();
  await page.locator(form.target).fill(target);

  // A source in the pool first, and Save proven live on it, so the refusal
  // below is the validator's and not a form that was never valid.
  await fillFilesystemDeviceSource(page, datasetMountPath(shareDataset(pool)));
  await expect(save).toBeEnabled();
  await expect(page.locator(form.sourceErrors)).toBeHidden();

  await fillFilesystemDeviceSource(page, '/etc');
  await expect(page.locator(form.sourceErrors)).toContainText(outsidePoolMessage);
  await expect(save).toBeDisabled();

  expect(await findFilesystemDevices(api, containerId)).toEqual([]);
});
