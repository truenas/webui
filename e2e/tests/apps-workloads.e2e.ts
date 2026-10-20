/**
 * Story: an admin opens an installed app's container logs from its Workloads card and watches them
 * follow, limits them with Tail Lines, and opens the container's shell and runs a command in it. A
 * read-only administrator finds that shell locked.
 *
 * The app is a custom one with a single BusyBox service that prints three numbered lines and then a
 * tick every two seconds, so the logs page has known lines to show and a new one to follow. BusyBox
 * has no bash, and middleware's app shell falls back to `sh` when bash is absent.
 *
 * ## Setup
 *
 * Apps run on `e2e_apps`, a one-disk pool built, given to Apps and destroyed here, as
 * `apps-custom-yaml.e2e.ts` does. The app is seeded once for the file, after the pool: starting
 * Docker and the app takes minutes, and no test changes it. Reading logs and running `echo` leave it
 * as it was. Teardown deletes the app and the image, unsets Apps and exports the pool after the last
 * test.
 *
 * Nothing is read back over the API afterwards: no test here changes anything on the appliance. The
 * container's id comes from `app.query`, and it is what the pages' URLs and readouts are checked
 * against.
 *
 * Not covered: Volume Mounts, the logs page's Auto Scroll and font size, the terminal's font size and
 * its reconnect after a dropped socket, and catalog apps, whose card is the same.
 */
import type { Page } from '@playwright/test';
import {
  appInstallTimeoutMs,
  ensureAppAbsent,
  ensureAppsPoolUnset,
  findContainerId,
  readAppState,
  readDocker,
  seedCustomApp,
  setAppsPool,
} from '../fixtures/apps';
import { ensureImageAbsent, ensureImagePresent } from '../fixtures/container-images';
import { ensurePoolPresent } from '../fixtures/pool';
import {
  ensureRoleAdminAbsent, ensureRoleAdminPresent, roleAdmins,
} from '../fixtures/role-admins';
import { ensurePoolAbsent, requireUnusedDisks } from '../fixtures/storage';
import { goToApps } from '../flows/navigation';
import { signInAsRoleAdmin } from '../flows/roles';
import { runInTerminal, waitForShell } from '../flows/terminal';
import {
  containerLogsLocators, installedAppLocators, logsDetailsDialogLocators, workloadsCardLocators,
} from '../locators/apps';
import { terminalLocators } from '../locators/terminal';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Built, given to Apps and destroyed here. Not a name any other spec looks for. */
const pool = 'e2e_apps';

const appName = 'e2e-workloads-app';
const service = 'e2e';

const repoTag = 'ghcr.io/containerd/busybox:1.36';

/** `$$` is compose's escape for a literal `$`: a single `$i` would be interpolated to nothing. */
const compose = [
  'services:',
  `  ${service}:`,
  `    image: ${repoTag}`,
  '    pull_policy: never',
  '    command: ["sh", "-c", "for i in 1 2 3; do echo e2e-log-$$i; done; '
  + 'while true; do echo e2e-log-tick; sleep 2; done"]',
  '',
].join('\n');

/** A ceiling on the next tick, which the app prints every two seconds. */
const followTimeoutMs = 15_000;

/** The details panel and its Workloads card load on their own `app.query`, after the list. */
const cardTimeoutMs = 60_000;

/** A command's output reaching the terminal. */
const shellOutputTimeoutMs = 15_000;

const app = installedAppLocators(appName);
const container = workloadsCardLocators(service);

/** `/apps/installed/<train>/<app>`, optionally followed by more of the path. Any train. */
function appRoute(rest = ''): RegExp {
  return new RegExp(`/apps/installed/[^/]+/${appName}${rest}$`);
}

/**
 * Apps on a pool this spec did not make is somebody's. Unsetting it, which teardown does, would
 * stop their apps, so the spec does not run there. On the CI appliance Apps has no pool.
 */
let appsOnSomebodyElsesPool = false;

/** The app's one container, which every test reaches from the Workloads card. */
let containerId = '';

/** Selects the app on Apps > Installed and waits for its Workloads card to show the container running. */
async function openAppWorkloads(page: Page): Promise<void> {
  await goToApps(page);
  await page.locator(app.name).click();
  await expect(page.locator(container.state)).toHaveText('Running', { timeout: cardTimeoutMs });
}

/** Opens the container's logs from the card and leaves the Logs Details dialog showing. */
async function openLogs(page: Page): Promise<void> {
  await openAppWorkloads(page);
  await page.locator(container.viewLogs).click();
  await expect(page.locator(logsDetailsDialogLocators.title)).toBeVisible();
}

/** Opens the logs and connects with the default Tail Lines, waiting for the first line. */
async function openLogsWithDefaults(page: Page): Promise<void> {
  await openLogs(page);
  await expect(page.locator(logsDetailsDialogLocators.tailLines)).toHaveValue('500');
  await page.locator(logsDetailsDialogLocators.connect).click();
  await expect(page.locator(containerLogsLocators.line(0))).toHaveText('e2e-log-1', { timeout: followTimeoutMs });
}

test.beforeAll(async ({ api }) => {
  const { pool: appsPool } = await readDocker(api);
  appsOnSomebodyElsesPool = appsPool !== null && appsPool !== pool;
  if (appsOnSomebodyElsesPool) {
    return;
  }

  // In this order: the app and the image are on `e2e_apps/ix-apps`, and Docker keeps the pool busy.
  await ensureAppAbsent(api, appName);
  await ensureImageAbsent(api, repoTag);
  await ensureAppsPoolUnset(api);
  await ensurePoolAbsent(api, pool);
  await requireUnusedDisks(api, 1);
  await ensurePoolPresent(api, pool);
  await setAppsPool(api, pool);

  await ensureImagePresent(api, repoTag);
  await seedCustomApp(api, appName, compose);
  await expect.poll(
    () => readAppState(api, appName),
    { message: `app "${appName}" should be running`, timeout: appInstallTimeoutMs },
  ).toBe('RUNNING');

  const id = await findContainerId(api, appName, service);
  if (id === undefined) {
    throw new Error(`app.query lists no container for service "${service}" of app "${appName}"`);
  }
  containerId = id;
});

test.beforeEach(() => {
  // Apps on another pool is a developer's own setup, and teardown would unset it.
  test.skip(appsOnSomebodyElsesPool, 'Apps already use a pool this spec did not create.');
});

test.afterAll(async ({ api }) => {
  if (appsOnSomebodyElsesPool || leavingTestData(`app "${appName}", pool "${pool}" and the Apps pool`)) {
    return;
  }

  // In this order: the export fails while Docker holds `e2e_apps/ix-apps`.
  await runCleanupSteps([
    [`delete app "${appName}"`, () => ensureAppAbsent(api, appName)],
    [`delete image "${repoTag}"`, () => ensureImageAbsent(api, repoTag)],
    ['unset the Apps pool', () => ensureAppsPoolUnset(api)],
    [`export pool "${pool}"`, () => ensurePoolAbsent(api, pool)],
  ]);
});

test('an admin opens a container\'s logs and sees the app\'s output, following it', async ({ page }) => {
  await openLogsWithDefaults(page);

  await expect(page).toHaveURL(appRoute(`/logs/${containerId}`));
  await expect(page.locator(containerLogsLocators.applicationName)).toHaveText(appName);
  await expect(page.locator(containerLogsLocators.containerId)).toHaveText(containerId);
  await expect(page.locator(containerLogsLocators.line(2))).toHaveText('e2e-log-3');
  await expect(page.locator(containerLogsLocators.timestamp(0))).toHaveText(/\S/);

  // The subscription following: a tick arrives after the lines first shown.
  const lines = page.locator(containerLogsLocators.anyLine);
  const shown = await lines.count();
  await expect.poll(
    () => lines.count(),
    { message: 'a new log line should follow the ones first shown', timeout: followTimeoutMs },
  ).toBeGreaterThan(shown);
});

test('Tail Lines limits the lines fetched, and the dialog refuses an empty value', async ({ page }) => {
  await openLogsWithDefaults(page);

  await test.step('one tail line leaves out the first lines the app printed', async () => {
    await page.locator(containerLogsLocators.reconnect).click();
    await expect(page.locator(logsDetailsDialogLocators.title)).toBeVisible();
    await page.locator(logsDetailsDialogLocators.tailLines).fill('1');
    await page.locator(logsDetailsDialogLocators.connect).click();

    // On row 0's text rather than a count: the rows are cleared and filled again.
    await expect(page.locator(containerLogsLocators.line(0)))
      .toHaveText(/^e2e-log-(3|tick)$/, { timeout: followTimeoutMs });
  });

  await test.step('Connect is disabled while Tail Lines is empty', async () => {
    await page.locator(containerLogsLocators.reconnect).click();
    await expect(page.locator(logsDetailsDialogLocators.title)).toBeVisible();
    await page.locator(logsDetailsDialogLocators.tailLines).fill('');
    await expect(page.locator(logsDetailsDialogLocators.connect)).toBeDisabled();
  });

  await test.step('Cancel leaves the logs for the app', async () => {
    await page.locator(logsDetailsDialogLocators.cancel).click();

    await expect(page).toHaveURL(appRoute());
    await expect(page.locator(app.row)).toBeVisible();
  });
});

test('an admin opens a container\'s shell and runs a command in it', async ({ page }) => {
  await openAppWorkloads(page);
  await page.locator(container.shell).click();

  await expect(page).toHaveURL(appRoute(`/shell/${containerId}`));
  await waitForShell(page);
  const terminal = page.locator(terminalLocators.terminal);

  await test.step('a command\'s output comes back', async () => {
    // The typed line holds `$((...))`, not the sum, so only the command's output can match.
    const n = Math.floor(Math.random() * 9000) + 1000;
    await runInTerminal(page, `echo e2e-shell-$((${n}+1))`);

    await expect(terminal).toContainText(`e2e-shell-${n + 1}`, { timeout: shellOutputTimeoutMs });
  });

  await test.step('the shell is in this container, not on the host', async () => {
    // Docker names a container's host after its short id when compose sets no `hostname`.
    await runInTerminal(page, 'hostname');

    await expect(terminal).toContainText(containerId.slice(0, 12), { timeout: shellOutputTimeoutMs });
  });
});

test.describe('as a read-only administrator', () => {
  test.use({ authenticate: false });

  const account = roleAdmins.readOnly;

  test.beforeEach(async ({ api }) => {
    await ensureRoleAdminAbsent(api, account);
    await ensureRoleAdminPresent(api, account);
  });

  test.afterEach(async ({ api }) => {
    if (leavingTestData(`user "${account.username}"`)) {
      return;
    }

    await runCleanupSteps([
      [`remove user ${account.username}`, () => ensureRoleAdminAbsent(api, account)],
    ]);
  });

  test('finds the container shell locked, and the logs open to them', async ({ page }) => {
    await signInAsRoleAdmin(page, account);
    await openAppWorkloads(page);

    // The read-only role lacks `APPS_WRITE`, which the shell needs as well as `web_shell`.
    await expect(page.locator(container.shell)).toBeDisabled();
    await expect(page.locator(container.viewLogs)).toBeEnabled();
  });
});
