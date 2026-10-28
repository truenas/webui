/**
 * Stories: an admin is refused a container name the form cannot take, creates a
 * container from an image picked in the image browser with a description, a CPU
 * set and an environment variable, and deletes a container.
 *
 * Creating a container downloads the image's rootfs from
 * `images.sys.truenas.net`, so the appliance needs outbound internet access (see
 * `docs/05-ci.md`). Middleware keeps the download on the pool and clones every
 * later container from it, so only the first create in a run pays for it. The
 * image is the first Debian one the registry lists, whatever its release.
 *
 * ## Setup and teardown
 *
 * Each test starts with the worker's `pool` as the preferred pool and no
 * container named `e2e-ct`. Teardown deletes the container, then writes back
 * the containers settings the appliance held before the first test. Once the
 * file is done it removes `<pool>/.truenas_containers`, which holds the
 * downloaded image and which no container removes, before the worker exports the
 * pool.
 */
import {
  type ContainerSettings, containerCreateTimeoutMs, containersDataset, containerSettingsBaseline,
  countContainers, ensureContainerAbsent, findContainer, findNicDevices, firstRegistryImage, readContainerConfig,
  seedContainer, setContainerConfig,
} from '../fixtures/containers';
import { ensureDatasetAbsent } from '../fixtures/storage';
import { chooseImage, openContainerDetails, openCreateContainerForm } from '../flows/containers';
import { containersLocators } from '../locators/containers';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';
import { slowCallTimeoutMs } from '../support/timeouts';

const containerName = 'e2e-ct';
const description = 'E2E container';
/** The CI appliance has four vCPUs, so CPUs 0 and 1 both exist. */
const cpuset = '0-1';
/** Matched against the registry's product names, e.g. `debian:bookworm:amd64:default`. */
const imageOs = 'debian';

/** `Validators.maxLength(200)` on Name, as `tn-form-field-errors.provider.ts` words it. */
const tooLongMessage = 'The length of the field should be no more than 200';
/** `Validators.pattern` on Name: letters, digits and hyphens only. */
const patternMessage = 'Invalid format or character';

/** What the appliance held before this file ran, and therefore what `afterEach` writes back. */
let found: ContainerSettings | undefined;

test.beforeAll(async ({ api }) => {
  found = await readContainerConfig(api);
});

test.beforeEach(async ({ api, pool }) => {
  await ensureContainerAbsent(api, containerName);
  await setContainerConfig(api, { ...containerSettingsBaseline, preferred_pool: pool });
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`container "${containerName}" and the containers settings`)) {
    return;
  }

  await runCleanupSteps([
    [`delete container ${containerName}`, () => ensureContainerAbsent(api, containerName)],
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

test('the Create form refuses a name that is too long or has spaces', async ({ page, api }) => {
  const form = containersLocators.create;
  const containersBefore = await countContainers(api);

  await openCreateContainerForm(page);
  // Not shown for an untouched field, so a message afterwards is the refusal.
  await expect(page.locator(form.nameField)).not.toContainText(tooLongMessage);

  await page.locator(form.name).fill('a'.repeat(201));
  await page.locator(form.name).blur();
  await expect(page.locator(form.nameField)).toContainText(tooLongMessage);
  await expect(page.locator(containersLocators.save)).toBeDisabled();

  await page.locator(form.name).fill('My container name');
  await page.locator(form.name).blur();
  await expect(page.locator(form.nameField)).toContainText(patternMessage);
  await expect(page.locator(containersLocators.save)).toBeDisabled();

  // A valid name clears the refusal, and Save stays down because no image is chosen.
  await page.locator(form.name).fill(containerName);
  await expect(page.locator(form.nameField)).not.toContainText(patternMessage);
  await expect(page.locator(form.image)).toHaveValue('');
  await expect(page.locator(containersLocators.save)).toBeDisabled();

  expect(await countContainers(api)).toBe(containersBefore);
});

test('an admin creates a container from a Debian image with a CPU set and an environment variable', async ({
  page, api, pool,
}) => {
  const form = containersLocators.create;
  const { details } = containersLocators;
  const variable = form.environmentVariable(0);
  const dataset = `${containersDataset(pool)}/containers/${containerName}`;

  await openCreateContainerForm(page);
  await page.locator(form.name).fill(containerName);
  await page.locator(form.description).fill(description);
  await chooseImage(page, await firstRegistryImage(api, imageOs));

  await page.locator(form.advancedOptions).click();
  await page.locator(form.cpuset).fill(cpuset);
  await page.locator(form.addEnvironmentVariable).click();
  await page.locator(variable.name).fill('E2E_VAR');
  await page.locator(variable.value).fill('1');
  await page.locator(containersLocators.save).click();

  // The form opens the new container's details once the create job finishes.
  await expect(page.locator(details.description)).toContainText(description, {
    timeout: containerCreateTimeoutMs,
  });
  await expect(page.locator(containersLocators.list.name(containerName))).toHaveText(containerName);
  await expect(page.locator(details.autostart)).toContainText('Yes');
  await expect(page.locator(details.cpuset)).toContainText(cpuset);
  await expect(page.locator(details.dataset)).toContainText(dataset);

  expect(await findContainer(api, containerName)).toMatchObject({
    description,
    autostart: true,
    cpuset,
    initenv: { E2E_VAR: '1' },
    dataset,
  });

  // "Connect to network" is ticked by default, so the form adds one NIC, sent
  // with no `nic_attach`. Which interface it lands on is middleware's call (the
  // default bridge, recorded on newer middleware; left blank on older), so the
  // claim is the one device.
  const created = await findContainer(api, containerName);
  if (!created) {
    throw new Error(`container ${containerName} was created and then not found`);
  }
  await expect.poll(async () => (await findNicDevices(api, created.id)).length, { timeout: slowCallTimeoutMs })
    .toBe(1);
});

test('an admin deletes a stopped container', async ({ page, api, pool }) => {
  const image = await firstRegistryImage(api, imageOs);
  await seedContainer(api, { name: containerName, pool, image });

  await openContainerDetails(page, containerName);
  const row = page.locator(containersLocators.list.row(containerName));
  // The list sits beside the details, so the row going away below is the delete.
  await expect(row).toBeVisible();

  await page.locator(containersLocators.details.delete).click();
  await page.locator(containersLocators.deleteDialog.confirm).click();
  await page.locator(containersLocators.deleteDialog.delete).click();

  await expect(row).toBeHidden({ timeout: slowCallTimeoutMs });
  // `container.delete` is a job, and the row can leave before it has finished.
  await expect.poll(() => findContainer(api, containerName), { timeout: slowCallTimeoutMs }).toBeUndefined();
});
