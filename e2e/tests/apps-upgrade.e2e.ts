/**
 * Story: an admin updates an installed catalog app to the latest revision from its Application Info
 * card, and rolls an updated one back to the revision it ran before.
 *
 * Each action is the UI's: Update in the card's menu and its dialog, Roll Back on the card and its
 * dialog. Each is checked on screen, on the card's Revision and the list's Updates cell, and through
 * `app.query`. The starting revision is installed over the API with `app.create`, and the upgrade
 * the rollback starts from is made with `app.upgrade`.
 *
 * ## The app
 *
 * `nginx` from the `test` train. Most catalog apps keep a single revision, so there is nothing to
 * update to or roll back to. truenas/apps keeps old revisions of this one on purpose
 * (`ix-dev/test/nginx/to_keep_versions.yaml`), and `1.0.5` is the oldest that needs no host path:
 * `1.0.3` and `1.0.4` bind-mount directories the appliance does not have. Every revision keeps
 * `app_version: v1`, so the card's Version never changes and Revision is the readout that does.
 *
 * Its images, `nginx` and `bash`, are untagged on Docker Hub, whose anonymous pull limit has already
 * failed installs on CI. So they are pulled once before the first test, through the retrying
 * `ensureImagePresent`, and an app deleted between tests leaves them behind. Revision `1.0.5` sets no
 * `pull_policy`, so its install starts from those local images. `app.upgrade` pulls the new
 * revision's images itself whatever is present, which a spec cannot avoid. The images are deleted
 * after the last test.
 *
 * Middleware reads `upgrade_available` from its catalog cache, which holds every train, so `test`
 * does not have to be a preferred train and the preferred trains are left alone.
 *
 * ## Setup
 *
 * Apps run on `e2e_apps`, built, given to Apps and destroyed here, as `apps-install.e2e.ts` does.
 * Teardown deletes the app before and after every test, and the images, Apps and the pool after the
 * last.
 *
 * Not covered: Update All, Update All Selected, rolling back ix-volume snapshots, and image-only
 * updates.
 */
import {
  appInstallTimeoutMs,
  ensureAppAbsent,
  ensureAppsPoolUnset,
  readAppState,
  readAppVersions,
  readDocker,
  readRollbackVersions,
  seedAppUpgrade,
  seedCatalogApp,
  setAppsPool,
  syncCatalog,
} from '../fixtures/apps';
import { ensureImageAbsent, ensureImagePresent } from '../fixtures/container-images';
import { ensurePoolPresent } from '../fixtures/pool';
import { ensurePoolAbsent, requireUnusedDisks } from '../fixtures/storage';
import {
  confirmAppRollback, confirmAppUpdate, openAppRollbackDialog, openAppUpdateDialog,
} from '../flows/catalog-apps';
import { goToApps } from '../flows/navigation';
import {
  appInfoCardLocators,
  appRevisionLocators,
  appRollbackDialogLocators,
  appUpdateDialogLocators,
  installedAppLocators,
} from '../locators/apps';
import { jobDialogLocators } from '../locators/encryption';
import type { E2eApiClient } from '../support/api/client';
import { apiCallsTo } from '../support/api-calls';
import { leavingTestData, runCleanupSteps, type CleanupStep } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Built, given to Apps and destroyed here. Not a name any other spec looks for. */
const pool = 'e2e_apps';

const train = 'test';
const catalogApp = 'nginx';
const release = 'e2e-nginx';

/** The oldest revision the catalog keeps that runs without a host path. */
const oldRevision = '1.0.5';

/** What every revision of the app runs, as Docker tags an untagged image. */
const images = ['nginx:latest', 'bash:latest'];

/**
 * The WebUI Port. Its default, 8080, is a port something else on the appliance may hold, so the
 * install would fail for a reason that has nothing to do with this spec.
 */
const values = { network: { web_port: 30180 } };

/** What the Updates cell says while the catalog has a newer revision of the same upstream version. */
const revisionAvailable = 'Revision available';
const upToDate = 'Up to date';

test.use({ recordApiCalls: true });

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

  // In this order: the app's datasets keep `e2e_apps/ix-apps` busy, and Docker keeps the pool busy.
  await ensureAppAbsent(api, release);
  await ensureAppsPoolUnset(api);
  await ensurePoolAbsent(api, pool);
  await requireUnusedDisks(api, 1);
  await ensurePoolPresent(api, pool);
  await setAppsPool(api, pool);
  // A pool change starts a sync in the background. The seeded installs need it finished.
  await syncCatalog(api);

  await Promise.all(images.map((image) => ensureImagePresent(api, image)));
});

test.beforeEach(async ({ api }) => {
  // Apps on another pool is a developer's own setup, and teardown would unset it.
  test.skip(appsOnSomebodyElsesPool, 'Apps already use a pool this spec did not create.');

  await ensureAppAbsent(api, release, { keepImages: true });
});

test.afterEach(async ({ api }) => {
  if (appsOnSomebodyElsesPool || leavingTestData(`app "${release}"`)) {
    return;
  }

  await runCleanupSteps([
    [`delete app "${release}"`, () => ensureAppAbsent(api, release, { keepImages: true })],
  ]);
});

test.afterAll(async ({ api }) => {
  if (appsOnSomebodyElsesPool || leavingTestData(`app "${release}", its images, pool "${pool}" and the Apps pool`)) {
    return;
  }

  // In this order: the images live in Docker's storage on the pool, and the export fails while
  // Docker holds `e2e_apps/ix-apps`.
  const steps: CleanupStep[] = [
    [`delete app "${release}"`, () => ensureAppAbsent(api, release)],
    ...images.map((image): CleanupStep => [`delete image "${image}"`, () => ensureImageAbsent(api, image)]),
    ['unset the Apps pool', () => ensureAppsPoolUnset(api)],
    [`export pool "${pool}"`, () => ensurePoolAbsent(api, pool)],
  ];

  await runCleanupSteps(steps);
});

/** The catalog's latest revision of the installed app. Throws rather than comparing to nothing. */
async function readLatestRevision(api: E2eApiClient): Promise<string> {
  const versions = await readAppVersions(api, release);
  if (!versions?.latestVersion) {
    throw new Error(`app "${release}" is not installed, or middleware reports no latest revision for it`);
  }
  return versions.latestVersion;
}

test('an admin updates an app to the latest revision from its Application Info card', async ({ page, api }) => {
  await seedCatalogApp(api, {
    name: release,
    catalogApp,
    train,
    version: oldRevision,
    values,
  });
  const latestRevision = await readLatestRevision(api);
  // An update has to have somewhere to go, or every assertion below holds before the click.
  expect(latestRevision).not.toBe(oldRevision);
  expect(await readAppVersions(api, release)).toMatchObject({ version: oldRevision, upgradeAvailable: true });

  const app = installedAppLocators(release);
  const card = appRevisionLocators(release);

  await goToApps(page);
  // The starting state the update has to change.
  await expect(page.locator(app.updates)).toHaveText(revisionAvailable);

  await openAppUpdateDialog(page, release);
  await expect(page.locator(card.revision)).toHaveText(oldRevision);
  await expect(page.locator(appUpdateDialogLocators.installedVersion)).toContainText(oldRevision);
  await expect(page.locator(appUpdateDialogLocators.revisionChange)).toContainText(oldRevision);
  await expect(page.locator(appUpdateDialogLocators.revisionChange)).toContainText(latestRevision);

  await confirmAppUpdate(page);

  await expect(page.locator(card.revision)).toHaveText(latestRevision, { timeout: appInstallTimeoutMs });
  await expect(page.locator(jobDialogLocators.title)).toBeHidden({ timeout: appInstallTimeoutMs });
  await expect(page.locator(app.updates)).toHaveText(upToDate);
  await expect.poll(
    () => readAppVersions(api, release),
    { message: `app "${release}" should run the latest revision`, timeout: appInstallTimeoutMs },
  ).toMatchObject({ version: latestRevision, upgradeAvailable: false });
  await expect.poll(
    () => readAppState(api, release),
    { message: `app "${release}" should be running after the update`, timeout: appInstallTimeoutMs },
  ).toBe('RUNNING');
});

test('an admin rolls an updated app back to the revision it ran before', async ({ page, api }) => {
  await seedCatalogApp(api, {
    name: release,
    catalogApp,
    train,
    version: oldRevision,
    values,
  });
  await seedAppUpgrade(api, release);
  const latestRevision = await readLatestRevision(api);
  // The starting state the rollback has to change, and what its dialog should offer.
  expect(await readAppVersions(api, release)).toMatchObject({ version: latestRevision, upgradeAvailable: false });
  expect(await readRollbackVersions(api, release)).toContain(oldRevision);

  const app = installedAppLocators(release);
  const card = appRevisionLocators(release);

  await goToApps(page);
  await expect(page.locator(app.updates)).toHaveText(upToDate);

  await openAppRollbackDialog(page, release);
  await expect(page.locator(card.revision)).toHaveText(latestRevision);
  await expect(page.locator(appRollbackDialogLocators.version)).toContainText(oldRevision);
  await expect(page.locator(appRollbackDialogLocators.rollbackSnapshot)).not.toBeChecked();

  await confirmAppRollback(page);

  await expect(page.locator(card.revision)).toHaveText(oldRevision, { timeout: appInstallTimeoutMs });
  await expect(page.locator(app.updates)).toHaveText(revisionAvailable);
  await expect.poll(
    () => readAppVersions(api, release),
    { message: `app "${release}" should run revision ${oldRevision} again`, timeout: appInstallTimeoutMs },
  ).toMatchObject({ version: oldRevision, upgradeAvailable: true });
  await expect.poll(
    () => readAppState(api, release),
    { message: `app "${release}" should be running after the rollback`, timeout: appInstallTimeoutMs },
  ).toBe('RUNNING');
});

test('the Application Info card offers neither Update nor Roll Back for an app with nothing to change', async ({
  page, api,
}) => {
  // No version: the catalog's latest, so there is nothing newer and nothing earlier.
  await seedCatalogApp(api, {
    name: release,
    catalogApp,
    train,
    values,
  });
  const latestRevision = await readLatestRevision(api);
  expect(await readAppVersions(api, release)).toMatchObject({ version: latestRevision, upgradeAvailable: false });
  expect(await readRollbackVersions(api, release)).toEqual([]);

  const app = installedAppLocators(release);
  const card = appRevisionLocators(release);

  await goToApps(page);
  await page.locator(app.name).click();
  await expect(page.locator(card.revision)).toHaveText(latestRevision);

  // Roll Back is absent until `app.rollback_versions` answers, so its absence before then says
  // nothing. The rollback test shows the same locator finds the button when it is there.
  await expect.poll(
    () => apiCallsTo(page, 'app.rollback_versions').some((call) => call.answer === 'result'),
    { message: 'the card should have asked for the app\'s rollback versions' },
  ).toBe(true);
  await expect(page.locator(card.rollback)).toBeHidden();

  await page.locator(appInfoCardLocators.menu).click();
  await expect(page.locator(card.update)).toBeVisible();
  await expect(page.locator(card.update)).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.locator(card.update)).toBeHidden();
  await expect(page.locator(app.updates)).toHaveText(upToDate);
});
