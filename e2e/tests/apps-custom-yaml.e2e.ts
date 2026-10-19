/**
 * Story: an admin installs a custom app from a compose file, edits its YAML and deletes it, and
 * pulls a container image and deletes it.
 *
 * Each action is the UI's: Discover's Install via YAML and its side panel; the installed app's Edit
 * and Delete on its Application Info card; Manage Container Images' Pull Image and the row's
 * Delete. Each is checked on screen and through `app.query`, `app.config` or `app.image.query`. The
 * app a test does not install is seeded with `app.create`.
 *
 * ## The image
 *
 * BusyBox 1.36 from the containerd project's copy on ghcr.io. The app runs it as one service with
 * `sleep infinity`, no ports and no volumes.
 *
 * Every registry rate-limits anonymous pulls: Docker Hub per IP, and Amazon ECR Public, which this
 * spec used before, failed installs on CI with `toomanyrequests`. So the three app tests pull the
 * image over the API first, retrying a throttled pull, and the service says `pull_policy: never`,
 * so the install and the edit run the local image and never reach a registry. Only the pull test,
 * which is about pulling, takes it from the registry through the UI.
 *
 * ## Setup
 *
 * Apps run on `e2e_apps`, a one-disk pool built, given to Apps and destroyed here, as
 * `apps-pool.e2e.ts` does. It is set up once for the file rather than per test: moving Apps onto a
 * pool starts Docker, which takes minutes, and no test here changes it. Teardown deletes the app
 * and the image after every test, and unsets Apps and exports the pool after the last.
 *
 * Not covered: the Custom App form that is not YAML, signing in to a registry, and deleting more
 * than one image at once.
 */
import {
  appInstallTimeoutMs,
  ensureAppAbsent,
  ensureAppsPoolUnset,
  readAppState,
  readDocker,
  readIsCustomApp,
  readServiceEnvironment,
  seedCustomApp,
  setAppsPool,
} from '../fixtures/apps';
import {
  ensureImageAbsent,
  ensureImagePresent,
  findImageId,
  imagePullTimeoutMs,
} from '../fixtures/container-images';
import { ensurePoolPresent } from '../fixtures/pool';
import { ensurePoolAbsent, requireUnusedDisks } from '../fixtures/storage';
import { deleteInstalledApp } from '../flows/catalog-apps';
import { deleteImage, goToContainerImages, pullImage } from '../flows/container-images';
import { editCustomAppYaml, installCustomAppFromYaml } from '../flows/custom-apps';
import { goToApps } from '../flows/navigation';
import { appsLocators, installedAppLocators } from '../locators/apps';
import { containerImagesLocators } from '../locators/container-images';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Built, given to Apps and destroyed here. Not a name any other spec looks for. */
const pool = 'e2e_apps';

const appName = 'e2e-yaml-app';
const service = 'e2e';

const image = 'ghcr.io/containerd/busybox';
const tag = '1.36';
const repoTag = `${image}:${tag}`;

const compose = [
  'services:',
  `  ${service}:`,
  `    image: ${repoTag}`,
  '    pull_policy: never',
  '    command: sleep infinity',
  '',
].join('\n');

/** The edit: the same service with an environment variable the seeded compose file does not have. */
const editedCompose = [
  'services:',
  `  ${service}:`,
  `    image: ${repoTag}`,
  '    pull_policy: never',
  '    command: sleep infinity',
  '    environment:',
  '      E2E: "1"',
  '',
].join('\n');

/**
 * Apps on a pool this spec did not make is somebody's. Unsetting it, which teardown does, would
 * stop their apps, so the spec does not run there. On the CI appliance Apps has no pool.
 */
let appsOnSomebodyElsesPool = false;

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
});

test.beforeEach(async ({ api }) => {
  // Apps on another pool is a developer's own setup, and teardown would unset it.
  test.skip(appsOnSomebodyElsesPool, 'Apps already use a pool this spec did not create.');

  await ensureAppAbsent(api, appName);
  await ensureImageAbsent(api, repoTag);
});

test.afterEach(async ({ api }) => {
  if (appsOnSomebodyElsesPool || leavingTestData(`app "${appName}" and image "${repoTag}"`)) {
    return;
  }

  await runCleanupSteps([
    [`delete app "${appName}"`, () => ensureAppAbsent(api, appName)],
    [`delete image "${repoTag}"`, () => ensureImageAbsent(api, repoTag)],
  ]);
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

test('an admin installs a custom app from YAML and it runs', async ({ page, api }) => {
  await ensureImagePresent(api, repoTag);
  const app = installedAppLocators(appName);

  await goToApps(page);
  // The starting state the install has to change.
  await expect(page.locator(appsLocators.noInstalledApps)).toBeVisible();

  await installCustomAppFromYaml(page, appName, compose);

  await expect(page.locator(app.row)).toBeVisible();
  await expect(page.locator(app.state)).toHaveText('Running', { timeout: appInstallTimeoutMs });
  await expect.poll(
    () => readAppState(api, appName),
    { message: `app "${appName}" should be running`, timeout: appInstallTimeoutMs },
  ).toBe('RUNNING');
  expect(await readIsCustomApp(api, appName)).toBe(true);
});

test('an admin edits a custom app\'s YAML and the app takes the change', async ({ page, api }) => {
  await ensureImagePresent(api, repoTag);
  await seedCustomApp(api, appName, compose);
  const app = installedAppLocators(appName);

  // The starting state the edit has to change.
  expect(await readServiceEnvironment(api, appName, service)).not.toHaveProperty('E2E');

  await goToApps(page);
  await expect(page.locator(app.state)).toHaveText('Running', { timeout: appInstallTimeoutMs });

  await editCustomAppYaml(page, appName, repoTag, editedCompose);

  await expect.poll(
    () => readServiceEnvironment(api, appName, service),
    { message: `app "${appName}" should carry the edited environment`, timeout: appInstallTimeoutMs },
  ).toMatchObject({ E2E: '1' });
  await expect.poll(
    () => readAppState(api, appName),
    { message: `app "${appName}" should be running again`, timeout: appInstallTimeoutMs },
  ).toBe('RUNNING');
});

test('an admin deletes a custom app and it is gone', async ({ page, api }) => {
  await ensureImagePresent(api, repoTag);
  await seedCustomApp(api, appName, compose);
  const app = installedAppLocators(appName);

  await goToApps(page);
  // The starting state the delete has to change.
  await expect(page.locator(app.row)).toBeVisible();

  await deleteInstalledApp(page, appName);

  await expect(page.locator(app.row)).toBeHidden({ timeout: appInstallTimeoutMs });
  await expect(page.locator(appsLocators.noInstalledApps)).toBeVisible();
  await expect.poll(
    () => readAppState(api, appName),
    { message: `app "${appName}" should be deleted`, timeout: appInstallTimeoutMs },
  ).toBe('ABSENT');
});

test('an admin pulls a container image and deletes it from its row', async ({ page, api }) => {
  // The starting state the pull has to change.
  expect(await findImageId(api, repoTag)).toBeUndefined();

  await goToApps(page);
  await goToContainerImages(page);

  await pullImage(page, image, tag);

  await expect.poll(
    () => findImageId(api, repoTag),
    { message: `image "${repoTag}" should have been pulled`, timeout: imagePullTimeoutMs },
  ).toBeDefined();
  const id = await findImageId(api, repoTag);
  if (id === undefined) {
    throw new Error(`image "${repoTag}" disappeared after its pull`);
  }

  const row = containerImagesLocators.image(id);
  await expect(page.locator(row.tags)).toHaveText(repoTag);

  await deleteImage(page, id);

  await expect(page.locator(row.tags)).toBeHidden();
  await expect.poll(
    () => findImageId(api, repoTag),
    { message: `image "${repoTag}" should be deleted` },
  ).toBeUndefined();
});
