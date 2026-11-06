/**
 * Stories: an admin opens a running container's shell from its Tools card and runs commands; on a stopped one the
 * item is disabled and says why. Only read-only commands are typed: `echo` and `/etc/hostname`, which holds the
 * container's name and so proves the shell is inside it. Never `exit`: a closed shell makes the terminal
 * reconnect. Setup and teardown are as `containers-power.e2e.ts`, for `e2e-ct-shell`. Font size and reconnect are
 * `system-shell.e2e.ts`.
 */
import {
  type ContainerSettings, containersDataset, containerSettingsBaseline, ensureContainerAbsent,
  findContainer, firstRegistryImage, readContainerConfig, seedContainer, setContainerConfig, startContainer,
} from '../fixtures/containers';
import { ensureDatasetAbsent } from '../fixtures/storage';
import { openContainerDetails } from '../flows/containers';
import { runInTerminal, waitForShell } from '../flows/terminal';
import { containersLocators } from '../locators/containers';
import { pageHeaderLocators } from '../locators/page-header';
import { terminalLocators } from '../locators/terminal';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const containerName = 'e2e-ct-shell';
/** Matched against the registry's product names, e.g. `debian:bookworm:amd64:default`. */
const imageOs = 'debian';

/** A ceiling on a start reaching `container.query`. */
const stateTimeoutMs = 120_000;

/**
 * A ceiling on a typed command's output coming back. The shell can attach before the container's
 * init has a prompt up, so a line typed too early is retried within this.
 */
const shellOutputTimeoutMs = 60_000;

/** How long one attempt waits for its output before the command is typed again. */
const shellOutputAttemptMs = 10_000;

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

  // After every container on the pool is gone: each one is a clone of the image this holds.
  await ensureDatasetAbsent(api, containersDataset(pool));
});

/** The container's state as `container.query` reports it, or undefined if it is gone. */
async function stateOf(api: E2eApiClient): Promise<string | undefined> {
  return (await findContainer(api, containerName))?.status?.state;
}

/** Seeds the container, stopped and with autostart off, and returns its id. */
async function seedStopped(api: E2eApiClient, pool: string): Promise<number> {
  const image = await firstRegistryImage(api, imageOs);
  await seedContainer(api, { name: containerName, pool, image });

  const container = await findContainer(api, containerName);
  if (!container) {
    throw new Error(`Container "${containerName}" was created and is not listed, so there is nothing to act on.`);
  }
  return container.id;
}

test('an admin opens a running container\'s shell from its Tools card and runs a command in it', async ({ page, api, pool }) => {
  const { tools } = containersLocators;
  const id = await seedStopped(api, pool);
  await startContainer(api, id);
  await expect.poll(() => stateOf(api), { timeout: stateTimeoutMs }).toBe('RUNNING');

  await openContainerDetails(page, containerName);
  await expect(page.locator(tools.shell)).toHaveAttribute('aria-disabled', 'false');
  await page.locator(tools.shell).click();

  await expect(page).toHaveURL(new RegExp(`/containers/view/${id}/shell$`));
  await expect(page.locator(pageHeaderLocators.title)).toHaveText('Container Shell');
  await waitForShell(page);
  const terminal = page.locator(terminalLocators.terminal);

  await test.step('a command\'s output comes back', async () => {
    // The typed line holds `$((...))`, not the sum, so only the command's output can match.
    const n = Math.floor(Math.random() * 9000) + 1000;
    await expect(async () => {
      await runInTerminal(page, `echo e2e-shell-$((${n}+1))`);
      await expect(terminal).toContainText(`e2e-shell-${n + 1}`, { timeout: shellOutputAttemptMs });
    }).toPass({ timeout: shellOutputTimeoutMs });
  });

  await test.step('the shell is the container\'s, not the appliance\'s', async () => {
    // The typed line holds `$(cat …)`, so `h=<name>` is only on screen once the command ran.
    await runInTerminal(page, 'echo h=$(cat /etc/hostname)');

    await expect(terminal).toContainText(`h=${containerName}`, { timeout: shellOutputAttemptMs });
  });
});

test('Shell on a stopped container is disabled and says why', async ({ page, api, pool }) => {
  const { tools } = containersLocators;
  await seedStopped(api, pool);

  await openContainerDetails(page, containerName);
  const shell = page.locator(tools.shell);
  await expect(shell).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator(tools.shellIcon)).toHaveAttribute('aria-label', 'Container is not running');

  // Dispatched rather than clicked: the disabled item has `pointer-events: none`, so a real click
  // would land on the wrapper around it and never reach the item's own guard. A backstop, since a
  // navigation it started could still be on its way when this reads the URL.
  await shell.dispatchEvent('click');
  await expect(page).not.toHaveURL(/\/shell$/);

  expect(await stateOf(api)).toBe('STOPPED');
});
