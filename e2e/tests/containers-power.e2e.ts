/**
 * Stories: an admin starts, stops and restarts a container from its row on the Containers page, each read back
 * from `container.query`. A restart ends where it began, so it is told from a no-op by the changed `pid`.
 * Setup is as `containers.e2e.ts`; teardown deletes `e2e-ct-power` with `force`, which takes one a failed test
 * left running, restores the containers settings, and after the file removes `<pool>/.truenas_containers`.
 * The shell is `containers-shell.e2e.ts`.
 */
import {
  type ContainerSettings, containersDataset, containerSettingsBaseline, ensureContainerAbsent,
  findContainer, firstRegistryImage, readContainerConfig, seedContainer, setContainerConfig, startContainer,
} from '../fixtures/containers';
import { ensureDatasetAbsent } from '../fixtures/storage';
import { answerStopOptions } from '../flows/containers';
import { goToContainers } from '../flows/navigation';
import { containersLocators } from '../locators/containers';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const containerName = 'e2e-ct-power';
/** Matched against the registry's product names, e.g. `debian:bookworm:amd64:default`. */
const imageOs = 'debian';

/** The Stop Method option the dialog opens on, as Stop words it. */
const gracefulThenForceStop = 'Wait for graceful stop, then force';
/** The Stop Method option a restart forces with, as Restart words it. */
const forceRestartNow = 'Force restart immediately';

/** A ceiling on a start, a stop or a restart reaching `container.query`, a graceful stop's wait included. */
const stateTimeoutMs = 120_000;

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

/** The container's state as `container.query` reports it, or undefined if it is gone. */
async function stateOf(api: E2eApiClient): Promise<string | undefined> {
  return (await findContainer(api, containerName))?.status?.state;
}

/** Seeds the container, stopped, and returns its id. */
async function seedStopped(api: E2eApiClient, pool: string): Promise<number> {
  const image = await firstRegistryImage(api, imageOs);
  await seedContainer(api, { name: containerName, pool, image });

  const container = await findContainer(api, containerName);
  if (!container) {
    throw new Error(`Container "${containerName}" was created and is not listed, so there is nothing to act on.`);
  }
  return container.id;
}

/** Seeds the container and starts it over the API, for a story about a running one. */
async function seedRunning(api: E2eApiClient, pool: string): Promise<void> {
  await startContainer(api, await seedStopped(api, pool));
  await expect.poll(() => stateOf(api), { timeout: stateTimeoutMs }).toBe('RUNNING');
}

test('an admin starts a stopped container from its row', async ({ page, api, pool }) => {
  const { list } = containersLocators;
  await seedStopped(api, pool);

  await goToContainers(page);
  // Seeded with autostart off, so nothing but the click below starts it.
  await expect(page.locator(list.status(containerName))).toHaveText('Stopped');
  await page.locator(list.start(containerName)).click();

  await expect(page.locator(list.status(containerName))).toHaveText('Running', { timeout: stateTimeoutMs });
  expect(await stateOf(api)).toBe('RUNNING');
});

test('an admin stops a running container, keeping the graceful-then-force method', async ({ page, api, pool }) => {
  const { list, stopOptionsDialog } = containersLocators;
  await seedRunning(api, pool);

  await goToContainers(page);
  await expect(page.locator(list.status(containerName))).toHaveText('Running');
  await page.locator(list.stop(containerName)).click();
  await expect(page.locator(stopOptionsDialog.stopMethod)).toContainText(gracefulThenForceStop);
  await answerStopOptions(page);

  await expect(page.locator(list.status(containerName))).toHaveText('Stopped', { timeout: stateTimeoutMs });
  expect(await stateOf(api)).toBe('STOPPED');
});

test('an admin restarts a running container, forcing it off immediately', async ({ page, api, pool }) => {
  const { list } = containersLocators;
  await seedRunning(api, pool);
  const before = await findContainer(api, containerName);
  // The pid is what tells a restart from a no-op, so the test cannot make its claim without one.
  expect(before?.status?.pid).toEqual(expect.any(Number));

  await goToContainers(page);
  await page.locator(list.restart(containerName)).click();
  await answerStopOptions(page, forceRestartNow);

  await expect
    .poll(async () => {
      const after = await findContainer(api, containerName);
      return after?.status?.state === 'RUNNING' && after.status.pid !== before?.status?.pid;
    }, { timeout: stateTimeoutMs })
    .toBe(true);
  await expect(page.locator(list.status(containerName))).toHaveText('Running');
});
