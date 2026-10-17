/**
 * Story: an admin picks a pool for Apps, sees the Apps service come up on it, and takes Apps off it
 * again.
 *
 * Both actions are the UI's, from Apps > Configuration: Choose Pool and its dialog, and Unset Pool
 * and its confirmation. Each is checked on screen, in the status beside the page title, and through
 * `docker.config` and `docker.status`. The pool Apps moves to is built over the API.
 *
 * ## Why this spec builds its own pool
 *
 * Choosing a pool creates `<pool>/ix-apps` and starts Docker on it, and Docker then holds that
 * dataset. The worker-scoped `pool` fixture is exported when the worker ends, which cannot happen
 * while Docker runs there, and a teardown that failed to unset Apps would take every later spec's
 * pool with it. `e2e_apps` is one disk and nobody else's. Teardown unsets Apps first, then exports
 * it, in that order, whatever the test did.
 *
 * Not covered: moving Apps from one pool to another with "Migrate existing applications", and
 * anything about the catalog. A pool change starts a catalog sync, which needs the internet the CI
 * appliance does not have; it fails in the background and does not fail `docker.update`.
 *
 * The "Pool has been unset." snackbar is not checked: the snackbar renders no `data-test`.
 */
import { ensureAppsPoolUnset, readDocker, setAppsPool } from '../fixtures/apps';
import { ensurePoolPresent } from '../fixtures/pool';
import { ensurePoolAbsent, findDataset, requireUnusedDisks } from '../fixtures/storage';
import { chooseAppsPool, openAppsConfigMenu, unsetAppsPool } from '../flows/apps';
import { goToApps } from '../flows/navigation';
import { appsLocators } from '../locators/apps';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Built, given to Apps and destroyed here. Not a name any other spec looks for. */
const pool = 'e2e_apps';

/**
 * Starting Docker on a new pool means creating its datasets first. The job has finished by the time
 * the dialog closes, and this leaves room for the service to report it.
 */
const statusTimeoutMs = 2 * 60_000;

/**
 * Apps on a pool this spec did not make is somebody's. Unsetting it, which every test here begins
 * by doing, would stop their apps, so the spec does not run there. On the CI appliance Apps has no
 * pool.
 */
let appsOnSomebodyElsesPool = false;

test.beforeAll(async ({ api }) => {
  const { pool: appsPool } = await readDocker(api);
  appsOnSomebodyElsesPool = appsPool !== null && appsPool !== pool;
});

test.beforeEach(async ({ api }) => {
  // Apps on another pool is a developer's own setup, and the tests below would unset it.
  test.skip(appsOnSomebodyElsesPool, 'Apps already use a pool this spec did not create.');

  // A previous run may have left Apps on `e2e_apps`, and that pool cannot go until Apps leave it.
  await ensureAppsPoolUnset(api);
  await ensurePoolAbsent(api, pool);
  await requireUnusedDisks(api, 1);
  await ensurePoolPresent(api, pool);
});

test.afterEach(async ({ api }) => {
  if (appsOnSomebodyElsesPool || leavingTestData(`pool "${pool}" and the Apps pool`)) {
    return;
  }

  // In this order: the export fails while Docker holds `e2e_apps/ix-apps`.
  await runCleanupSteps([
    ['unset the Apps pool', () => ensureAppsPoolUnset(api)],
    [`export pool "${pool}"`, () => ensurePoolAbsent(api, pool)],
  ]);
});

test('an admin chooses a pool for Apps and the Apps service starts on it', async ({ page, api }) => {
  await goToApps(page);

  // The starting state the choice has to change.
  await expect(page.locator(appsLocators.dockerStatus)).toHaveText('Apps Service Not Configured');
  await expect(page.locator(appsLocators.noInstalledApps)).toBeVisible();
  expect(await readDocker(api)).toMatchObject({ pool: null, status: 'UNCONFIGURED' });

  await chooseAppsPool(page, pool);

  await expect(page.locator(appsLocators.dockerStatus)).toHaveText(
    'Apps Service Running',
    { timeout: statusTimeoutMs },
  );

  await expect.poll(
    () => readDocker(api),
    { message: `docker should run on "${pool}"`, timeout: statusTimeoutMs },
  ).toEqual({ pool, dataset: `${pool}/ix-apps`, status: 'RUNNING' });
  expect(await findDataset(api, `${pool}/ix-apps`)).toBeDefined();
});

test('an admin unsets the Apps pool and the Apps service stops', async ({ page, api }) => {
  await setAppsPool(api, pool);

  await goToApps(page);
  // The starting state the unset has to change.
  await expect(page.locator(appsLocators.dockerStatus)).toHaveText(
    'Apps Service Running',
    { timeout: statusTimeoutMs },
  );

  await unsetAppsPool(page);

  await expect(page.locator(appsLocators.dockerStatus)).toHaveText(
    'Apps Service Not Configured',
    { timeout: statusTimeoutMs },
  );

  await expect.poll(
    async () => {
      const docker = await readDocker(api);
      return { pool: docker.pool, status: docker.status };
    },
    { message: 'Apps should have no pool', timeout: statusTimeoutMs },
  ).toEqual({ pool: null, status: 'UNCONFIGURED' });

  // Unset Pool is offered only while Apps has a pool. Choose Pool is the proof the menu is open.
  await openAppsConfigMenu(page);
  await expect(page.locator(appsLocators.unsetPool)).toBeHidden();
});
