/**
 * Stories: an admin edits a stopped container from Edit on its General Info
 * card — changes its description, CPU set and autostart, removes an environment
 * variable — and the form refuses a Shutdown Timeout below its minimum.
 *
 * Each test seeds its container over the API, stopped, so every field here can
 * change: middleware refuses only a rename while a container runs, and renaming
 * is not covered. Seeding downloads the image's rootfs the first time it is used
 * on the pool, as in `containers.e2e.ts`.
 *
 * ## Setup and teardown
 *
 * Each test starts with the worker's `pool` as the preferred pool and no
 * container named `e2e-ct-edit`. Teardown deletes the container, then writes
 * back the containers settings the appliance held before the first test. Once
 * the file is done it removes `<pool>/.truenas_containers`, which holds the
 * downloaded image and which no container removes, before the worker exports the
 * pool.
 */
import {
  type ContainerSettings, containersDataset, containerSettingsBaseline, ensureContainerAbsent, findContainer,
  firstRegistryImage, readContainerConfig, seedContainer, setContainerConfig,
} from '../fixtures/containers';
import { ensureDatasetAbsent } from '../fixtures/storage';
import { openEditContainerForm, saveContainerSettings } from '../flows/containers';
import { containersLocators } from '../locators/containers';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const containerName = 'e2e-ct-edit';
/** Matched against the registry's product names, as in `containers.e2e.ts`. */
const imageOs = 'debian';

/** `Validators.min(5)` on Shutdown Timeout, as `tn-form-field-errors.provider.ts` words it. */
const tooShortMessage = 'Minimum value is 5';

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

test('an admin changes a container\'s description, CPU set and autostart', async ({ page, api, pool }) => {
  const form = containersLocators.create;
  const { details } = containersLocators;
  const description = 'E2E container, edited';
  /** The CI appliance has four vCPUs, so CPU 0 exists. */
  const cpuset = '0';

  await seedContainer(api, { name: containerName, pool, image: await firstRegistryImage(api, imageOs) });
  // Seeded with no description, no CPU set and autostart off, so none of the
  // values asserted below can be there before the save.
  const seeded = await findContainer(api, containerName);
  expect(seeded?.autostart).toBe(false);
  expect(seeded?.cpuset ?? '').not.toBe(cpuset);
  expect(seeded?.description ?? '').not.toBe(description);

  await openEditContainerForm(page, containerName);
  await page.locator(form.description).fill(description);
  await page.locator(form.autostart).click();
  await page.locator(form.cpuset).fill(cpuset);
  await saveContainerSettings(page);

  await expect(page.locator(details.description)).toContainText(description);
  await expect(page.locator(details.cpuset)).toContainText(`CPU Set: ${cpuset}`);
  await expect(page.locator(details.autostart)).toContainText('Autostart: Yes');

  expect(await findContainer(api, containerName)).toMatchObject({
    description,
    cpuset,
    autostart: true,
  });
});

test('an admin removes a container\'s environment variable', async ({ page, api, pool }) => {
  const form = containersLocators.create;
  const variable = form.environmentVariable(0);

  await seedContainer(api, {
    name: containerName,
    pool,
    image: await firstRegistryImage(api, imageOs),
    initenv: { E2E_VAR: '1' },
  });
  expect((await findContainer(api, containerName))?.initenv).toEqual({ E2E_VAR: '1' });

  await openEditContainerForm(page, containerName);
  await expect(page.locator(variable.name)).toHaveValue('E2E_VAR');
  await page.locator(form.removeEnvironmentVariable).click();
  await expect(page.locator(variable.name)).toBeHidden();
  await saveContainerSettings(page);

  expect((await findContainer(api, containerName))?.initenv).not.toHaveProperty('E2E_VAR');
});

test('the Edit form refuses a Shutdown Timeout below its minimum', async ({ page, api, pool }) => {
  const form = containersLocators.create;

  await seedContainer(api, { name: containerName, pool, image: await firstRegistryImage(api, imageOs) });
  const before = await findContainer(api, containerName);
  expect(before).toBeDefined();

  await openEditContainerForm(page, containerName);
  // Not shown for an untouched field, so a message afterwards is the refusal.
  await expect(page.locator(form.shutdownTimeoutField)).not.toContainText(tooShortMessage);

  await page.locator(form.shutdownTimeout).fill('4');
  await page.locator(form.shutdownTimeout).blur();
  await expect(page.locator(form.shutdownTimeoutField)).toContainText(tooShortMessage);
  await expect(page.locator(containersLocators.save)).toBeDisabled();

  expect((await findContainer(api, containerName))?.shutdown_timeout).toBe(before?.shutdown_timeout);
});
