/**
 * Story: an admin installs IT Tools from the catalog, stops and starts it from the installed list, and deletes it,
 * each checked on screen and through `app.query`. IT Tools needs only a name, and its image is on ghcr.io, off
 * Docker Hub's rate limit; the release is `e2e-it-tools` so it is never mistaken for a hand-installed one. Apps
 * run on the shared `e2e_apps` pool. `community` is added to preferred trains and the third-party apps agreement
 * is cleared, so the install meets the warning every time; both are written back afterwards.
 */
import {
  appInstallTimeoutMs,
  communityTrain,
  ensureAppAbsent,
  readAppsAgreement,
  readAppState,
  readPreferredTrains,
  seedCatalogApp,
  setAppsAgreement,
  setPreferredTrains,
  syncCatalog,
} from '../fixtures/apps';
import {
  agreeToAppsWarning, deleteInstalledApp, installWithDefaults, openCatalogApp, refreshCatalog,
} from '../flows/catalog-apps';
import { goToApps } from '../flows/navigation';
import { appCatalogLocators, appsLocators, installedAppLocators } from '../locators/apps';
import { jobDialogLocators } from '../locators/encryption';
import { leavingTestData, runCleanupSteps, type CleanupStep } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const catalogApp = 'it-tools';
const release = 'e2e-it-tools';

/** A stop or start is a job that returns once the container has changed state. */
const stateChangeTimeoutMs = 2 * 60_000;

/**
 * Apps on a pool the suite did not make is somebody's. Moving Apps off it onto `e2e_apps` would stop
 * their apps, so `appsPool.ensure` leaves it and the spec does not run there. On the CI appliance
 * Apps has no pool.
 */
let appsOnSomebodyElsesPool = false;

/**
 * What the appliance held before this file changed it, written back in `afterAll`. Undefined until
 * read, so a setup that failed first never writes back a value nobody read.
 */
let preferredTrainsBefore: string[] | undefined;
let appsAgreementBefore: boolean | undefined;

test.beforeAll(async ({ api, appsPool }) => {
  appsOnSomebodyElsesPool = !(await appsPool.ensure());
  if (appsOnSomebodyElsesPool) {
    return;
  }

  // Read before anything changes either.
  preferredTrainsBefore = await readPreferredTrains(api);
  appsAgreementBefore = await readAppsAgreement(api);

  // The pool outlives this file, so whatever a failed cleanup of the app left goes first.
  await ensureAppAbsent(api, release);

  if (!preferredTrainsBefore.includes(communityTrain)) {
    await setPreferredTrains(api, [...preferredTrainsBefore, communityTrain]);
  }
  // Moving Apps onto the pool, if `ensure` just did, starts a sync in the background. The seeded
  // tests need it finished.
  await syncCatalog(api);

  // Before any test signs in: the UI reads it from the user it signs in as.
  await setAppsAgreement(api, false);
});

test.beforeEach(async ({ api }) => {
  // Apps on another pool is a developer's own setup, and moving Apps off it would stop their apps.
  test.skip(appsOnSomebodyElsesPool, 'Apps already use a pool the suite did not create.');

  await ensureAppAbsent(api, release);
});

test.afterEach(async ({ api }) => {
  if (appsOnSomebodyElsesPool || leavingTestData(`app "${release}"`)) {
    return;
  }

  await runCleanupSteps([
    [`delete app "${release}"`, () => ensureAppAbsent(api, release)],
  ]);
});

test.afterAll(async ({ api }) => {
  if (appsOnSomebodyElsesPool) {
    return;
  }

  // Settings, not test data: written back even when the app is kept, or the next run reads this
  // run's values as the appliance's own.
  const steps: CleanupStep[] = [];
  const trains = preferredTrainsBefore;
  if (trains !== undefined) {
    steps.push(['restore the preferred trains', () => setPreferredTrains(api, trains)]);
  }
  const agreed = appsAgreementBefore;
  if (agreed !== undefined) {
    steps.push(['restore the apps agreement', () => setAppsAgreement(api, agreed)]);
  }

  if (!leavingTestData(`app "${release}"`)) {
    steps.push([`delete app "${release}"`, () => ensureAppAbsent(api, release)]);
  }

  await runCleanupSteps(steps);
});

test('an admin installs a catalog app from Discover and it runs', async ({ page, api }) => {
  const app = installedAppLocators(release);

  await goToApps(page);
  // The starting state the install has to change.
  await expect(page.locator(appsLocators.noInstalledApps)).toBeVisible();

  await page.locator(appCatalogLocators.discoverApps).click();
  await refreshCatalog(page);
  await openCatalogApp(page, communityTrain, catalogApp);

  await page.locator(appCatalogLocators.install(catalogApp)).click();
  // The warning stands between a user who has not agreed and the wizard. Agreeing records it.
  await agreeToAppsWarning(page);
  await expect.poll(
    () => readAppsAgreement(api),
    { message: 'agreeing should record the apps agreement on the user' },
  ).toBe(true);

  await installWithDefaults(page, catalogApp, release);

  await expect(page.locator(app.row)).toBeVisible();
  await expect(page.locator(app.state)).toHaveText('Running', { timeout: appInstallTimeoutMs });
  await expect.poll(
    () => readAppState(api, release),
    { message: `app "${release}" should be running`, timeout: appInstallTimeoutMs },
  ).toBe('RUNNING');
});

test('an admin stops and starts an installed app from its row', async ({ page, api }) => {
  await seedCatalogApp(api, { name: release, catalogApp, train: communityTrain });
  const app = installedAppLocators(release);

  await goToApps(page);
  // The starting state the stop has to change.
  await expect(page.locator(app.state)).toHaveText('Running', { timeout: appInstallTimeoutMs });

  await page.locator(app.stop).click();
  await expect(page.locator(app.state)).toHaveText('Stopped', { timeout: stateChangeTimeoutMs });
  await expect.poll(
    () => readAppState(api, release),
    { message: `app "${release}" should be stopped`, timeout: stateChangeTimeoutMs },
  ).toBe('STOPPED');
  // The row can turn before the stop's job dialog closes, and the dialog covers Start.
  await expect(page.locator(jobDialogLocators.title)).toBeHidden({ timeout: stateChangeTimeoutMs });

  await page.locator(app.start).click();
  await expect(page.locator(app.state)).toHaveText('Running', { timeout: stateChangeTimeoutMs });
  await expect.poll(
    () => readAppState(api, release),
    { message: `app "${release}" should be running again`, timeout: stateChangeTimeoutMs },
  ).toBe('RUNNING');
});

test('an admin deletes an installed app and it is gone', async ({ page, api }) => {
  await seedCatalogApp(api, { name: release, catalogApp, train: communityTrain });
  const app = installedAppLocators(release);

  await goToApps(page);
  // The starting state the delete has to change.
  await expect(page.locator(app.row)).toBeVisible();

  await deleteInstalledApp(page, release);

  await expect(page.locator(app.row)).toBeHidden({ timeout: appInstallTimeoutMs });
  await expect(page.locator(appsLocators.noInstalledApps)).toBeVisible();
  await expect.poll(
    () => readAppState(api, release),
    { message: `app "${release}" should be deleted`, timeout: appInstallTimeoutMs },
  ).toBe('ABSENT');
});
