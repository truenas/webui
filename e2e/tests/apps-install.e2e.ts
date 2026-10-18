/**
 * Story: an admin installs an app from the catalog, stops and starts it from the installed apps
 * list, and deletes it.
 *
 * Each action is the UI's: Discover's Refresh Catalog, search and Install, the install wizard; the
 * row's Stop and Start; the Application Info card's Delete and its dialog. Each is checked on
 * screen and through `app.query`. The app a test does not install is seeded with `app.create`.
 *
 * ## The app
 *
 * IT Tools from the `community` train: one container, no storage, and every field in its wizard
 * has a default, so the wizard needs nothing but a name. Its image is on ghcr.io, which keeps the
 * pull off Docker Hub's anonymous rate limit. The release is named `e2e-it-tools` so that it is
 * never mistaken for an `it-tools` somebody installed by hand.
 *
 * ## Setup
 *
 * Apps run on `e2e_apps`, a one-disk pool built, given to Apps and destroyed here, as
 * `apps-pool.e2e.ts` does. It is set up once for the file rather than per test: moving Apps onto a
 * pool starts Docker and clones the catalog, which takes minutes, and no test here changes it.
 * Teardown deletes the app after every test, and unsets Apps and exports the pool after the last.
 *
 * `community` is added to the preferred trains if it is missing, since Discover lists only those.
 *
 * The user's agreement to the third-party apps warning is cleared before the file's tests sign in,
 * so the install test meets the warning every time, as a first install does. Both settings are
 * written back to what the appliance held.
 *
 * Not covered: editing an installed app, upgrades and rollback, and the Workloads card.
 */
import {
  appInstallTimeoutMs,
  communityTrain,
  ensureAppAbsent,
  ensureAppsPoolUnset,
  readAppsAgreement,
  readAppState,
  readDocker,
  readPreferredTrains,
  seedCatalogApp,
  setAppsAgreement,
  setAppsPool,
  setPreferredTrains,
  syncCatalog,
} from '../fixtures/apps';
import { ensurePoolPresent } from '../fixtures/pool';
import { ensurePoolAbsent, requireUnusedDisks } from '../fixtures/storage';
import {
  agreeToAppsWarning, deleteInstalledApp, installWithDefaults, openCatalogApp, refreshCatalog,
} from '../flows/catalog-apps';
import { goToApps } from '../flows/navigation';
import { appCatalogLocators, appsLocators, installedAppLocators } from '../locators/apps';
import { jobDialogLocators } from '../locators/encryption';
import { leavingTestData, runCleanupSteps, type CleanupStep } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Built, given to Apps and destroyed here. Not a name any other spec looks for. */
const pool = 'e2e_apps';

const catalogApp = 'it-tools';
const release = 'e2e-it-tools';

/** A stop or start is a job that returns once the container has changed state. */
const stateChangeTimeoutMs = 2 * 60_000;

/**
 * Apps on a pool this spec did not make is somebody's. Unsetting it, which teardown does, would
 * stop their apps, so the spec does not run there. On the CI appliance Apps has no pool.
 */
let appsOnSomebodyElsesPool = false;

/**
 * What the appliance held before this file changed it, written back in `afterAll`. Undefined until
 * read, so a setup that failed first never writes back a value nobody read.
 */
let preferredTrainsBefore: string[] | undefined;
let appsAgreementBefore: boolean | undefined;

test.beforeAll(async ({ api }) => {
  const { pool: appsPool } = await readDocker(api);
  appsOnSomebodyElsesPool = appsPool !== null && appsPool !== pool;
  if (appsOnSomebodyElsesPool) {
    return;
  }

  // Read before anything changes either.
  preferredTrainsBefore = await readPreferredTrains(api);
  appsAgreementBefore = await readAppsAgreement(api);

  // In this order: the app's datasets keep `e2e_apps/ix-apps` busy, and Docker keeps the pool busy.
  await ensureAppAbsent(api, release);
  await ensureAppsPoolUnset(api);
  await ensurePoolAbsent(api, pool);
  await requireUnusedDisks(api, 1);
  await ensurePoolPresent(api, pool);
  await setAppsPool(api, pool);

  if (!preferredTrainsBefore.includes(communityTrain)) {
    await setPreferredTrains(api, [...preferredTrainsBefore, communityTrain]);
  }
  // A pool change starts a sync in the background. The seeded tests need it finished.
  await syncCatalog(api);

  // Before any test signs in: the UI reads it from the user it signs in as.
  await setAppsAgreement(api, false);
});

test.beforeEach(async ({ api }) => {
  // Apps on another pool is a developer's own setup, and teardown would unset it.
  test.skip(appsOnSomebodyElsesPool, 'Apps already use a pool this spec did not create.');

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

  // Settings, not test data: written back even when the app and pool are kept, or the next run
  // reads this run's values as the appliance's own.
  const steps: CleanupStep[] = [];
  const trains = preferredTrainsBefore;
  if (trains !== undefined) {
    steps.push(['restore the preferred trains', () => setPreferredTrains(api, trains)]);
  }
  const agreed = appsAgreementBefore;
  if (agreed !== undefined) {
    steps.push(['restore the apps agreement', () => setAppsAgreement(api, agreed)]);
  }

  if (!leavingTestData(`app "${release}", pool "${pool}" and the Apps pool`)) {
    // In this order: the export fails while Docker holds `e2e_apps/ix-apps`.
    steps.push(
      [`delete app "${release}"`, () => ensureAppAbsent(api, release)],
      ['unset the Apps pool', () => ensureAppsPoolUnset(api)],
      [`export pool "${pool}"`, () => ensurePoolAbsent(api, pool)],
    );
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
