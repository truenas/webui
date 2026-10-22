/**
 * Story: an admin updates several installed apps at once, with Update All in the Installed page's
 * header and with Update All Selected in the bulk bar's menu, and an app with nothing to update is
 * left alone.
 *
 * Both open the same bulk Update dialog, which keeps only the apps it was given that have
 * `upgrade_available` and runs one `core.bulk` job over `app.upgrade` for them. Each row starts
 * collapsed, and a collapsed row sends no version, so middleware takes it to the catalog's latest.
 * The dialog closes on the job's first update, and the same way when an upgrade inside it failed,
 * so a test waits for the job to end over the API, checks which apps it was given, and reads every
 * outcome back through `app.query`.
 *
 * ## The apps
 *
 * Two copies of `nginx` from the `test` train, `e2e-upd-a` and `e2e-upd-b`, installed at revision
 * `1.0.5` on their own WebUI ports, as `apps-upgrade.e2e.ts` installs one. That spec says why this
 * app and revision. The bystander, `e2e-upd-keep`, is IT Tools from `community`, as
 * `apps-install.e2e.ts` runs it: its train keeps one revision, so it is always up to date. Its image
 * is on ghcr.io.
 *
 * nginx's images, `nginx` and `bash`, are untagged on Docker Hub. They are pulled once before the
 * first test, apps are deleted between tests with their images kept, and the images go after the
 * last test. `app.upgrade` pulls the new revision's images itself, so each upgrade still costs one.
 *
 * ## Setup
 *
 * Apps run on `e2e_apps`, built, given to Apps and destroyed here, as `apps-install.e2e.ts` does.
 * `community` is added to the preferred trains if it is missing, and the trains are written back
 * after the last test. Teardown deletes the three apps before and after every test.
 *
 * Not covered: picking a version for one app in the dialog. From `1.0.5` the only newer revision
 * the catalog keeps is the latest, so the dialog offers no choice, and `1.0.4`, which would offer
 * one, bind-mounts a host path under `/usr`, which is read-only on TrueNAS. Also not covered: a
 * failed upgrade inside the bulk, image-only updates, and the Changelog link.
 */
import {
  appInstallTimeoutMs,
  communityTrain,
  ensureAppAbsent,
  ensureAppsPoolUnset,
  findAppJobIds,
  findBulkUpgradeJobs,
  readAppState,
  readAppVersions,
  readDocker,
  readPreferredTrains,
  seedCatalogApp,
  setAppsPool,
  setPreferredTrains,
  syncCatalog,
  type AppVersions,
} from '../fixtures/apps';
import { ensureImageAbsent, ensureImagePresent } from '../fixtures/container-images';
import { ensurePoolPresent } from '../fixtures/pool';
import { ensurePoolAbsent, requireUnusedDisks } from '../fixtures/storage';
import { openAppsBulkMenu } from '../flows/apps';
import { confirmAppsBulkUpdate, openAppsUpdateAll } from '../flows/catalog-apps';
import { goToApps } from '../flows/navigation';
import { selectRow } from '../flows/table';
import {
  appBulkUpdateDialogLocators,
  appsLocators,
  installedAppLocators,
  installedAppRowTag,
  installedAppsBulkLocators,
} from '../locators/apps';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps, type CleanupStep } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Built, given to Apps and destroyed here. Not a name any other spec looks for. */
const pool = 'e2e_apps';

const updatedApp = { catalogApp: 'nginx', train: 'test' };
/** The oldest revision the catalog keeps that runs without a host path. */
const oldRevision = '1.0.5';
/** What every revision of nginx runs, as Docker tags an untagged image. */
const images = ['nginx:latest', 'bash:latest'];

/** Each on its own WebUI port: the default, 8080, is one both would want. */
const appA = { name: 'e2e-upd-a', values: { network: { web_port: 30181 } } };
const appB = { name: 'e2e-upd-b', values: { network: { web_port: 30182 } } };
const bystander = 'e2e-upd-keep';
const apps = [appA.name, appB.name, bystander];

/** What the Updates cell says while the catalog has a newer revision of the same upstream version. */
const revisionAvailable = 'Revision available';
const upToDate = 'Up to date';

/**
 * Apps on a pool this spec did not make is somebody's. Unsetting it, which teardown does, would
 * stop their apps, so the spec does not run there. On the CI appliance Apps has no pool. It also
 * means Update All sees only this spec's apps.
 */
let appsOnSomebodyElsesPool = false;

/** What the appliance held before this file changed it. Undefined until read. */
let preferredTrainsBefore: string[] | undefined;

/** Deletes the three apps, keeping nginx's images for the next test's installs. */
function deleteAppsSteps(api: E2eApiClient): CleanupStep[] {
  return apps.map((name) => [`delete app "${name}"`, () => ensureAppAbsent(api, name, { keepImages: true })]);
}

test.beforeAll(async ({ api }) => {
  const { pool: appsPool } = await readDocker(api);
  appsOnSomebodyElsesPool = appsPool !== null && appsPool !== pool;
  if (appsOnSomebodyElsesPool) {
    return;
  }

  preferredTrainsBefore = await readPreferredTrains(api);

  // In this order: the apps' datasets keep `e2e_apps/ix-apps` busy, and Docker keeps the pool busy.
  await runCleanupSteps(deleteAppsSteps(api));
  await ensureAppsPoolUnset(api);
  await ensurePoolAbsent(api, pool);
  await requireUnusedDisks(api, 1);
  await ensurePoolPresent(api, pool);
  await setAppsPool(api, pool);

  if (!preferredTrainsBefore.includes(communityTrain)) {
    await setPreferredTrains(api, [...preferredTrainsBefore, communityTrain]);
  }
  // A pool change starts a sync in the background. The seeded installs need it finished.
  await syncCatalog(api);

  await Promise.all(images.map((image) => ensureImagePresent(api, image)));
});

test.beforeEach(async ({ api }) => {
  // Apps on another pool is a developer's own setup, and teardown would unset it.
  test.skip(appsOnSomebodyElsesPool, 'Apps already use a pool this spec did not create.');

  await runCleanupSteps(deleteAppsSteps(api));
});

test.afterEach(async ({ api }) => {
  if (appsOnSomebodyElsesPool || leavingTestData(`apps ${apps.join(', ')}`)) {
    return;
  }

  await runCleanupSteps(deleteAppsSteps(api));
});

test.afterAll(async ({ api }) => {
  if (appsOnSomebodyElsesPool) {
    return;
  }

  // A setting, not test data: written back even when the apps and pool are kept.
  const steps: CleanupStep[] = [];
  const trains = preferredTrainsBefore;
  if (trains !== undefined) {
    steps.push(['restore the preferred trains', () => setPreferredTrains(api, trains)]);
  }

  if (!leavingTestData(`apps ${apps.join(', ')}, their images, pool "${pool}" and the Apps pool`)) {
    // In this order: the images live in Docker's storage on the pool, and the export fails while
    // Docker holds `e2e_apps/ix-apps`.
    steps.push(
      ...apps.map((name): CleanupStep => [`delete app "${name}"`, () => ensureAppAbsent(api, name)]),
      ...images.map((image): CleanupStep => [`delete image "${image}"`, () => ensureImageAbsent(api, image)]),
      ['unset the Apps pool', () => ensureAppsPoolUnset(api)],
      [`export pool "${pool}"`, () => ensurePoolAbsent(api, pool)],
    );
  }

  await runCleanupSteps(steps);
});

/** The app's revisions, which must be there. Throws rather than comparing to nothing. */
async function requireAppVersions(
  api: E2eApiClient,
  name: string,
): Promise<AppVersions & { version: string; latestVersion: string }> {
  const versions = await readAppVersions(api, name);
  if (!versions?.version || !versions.latestVersion) {
    throw new Error(`app "${name}" is not installed, or middleware reports no revision for it`);
  }
  return { ...versions, version: versions.version, latestVersion: versions.latestVersion };
}

/**
 * Installs both nginx copies at `oldRevision` and the bystander at its latest, and checks the
 * starting state every test changes: both copies have an update, and the bystander has none.
 * Returns the nginx latest revision and the bystander's revision.
 */
async function seedApps(api: E2eApiClient): Promise<{ latestRevision: string; bystanderRevision: string }> {
  for (const app of [appA, appB]) {
    await seedCatalogApp(api, {
      ...updatedApp,
      name: app.name,
      version: oldRevision,
      values: app.values,
    });
  }
  await seedCatalogApp(api, { name: bystander, catalogApp: 'it-tools', train: communityTrain });

  const { latestVersion: latestRevision } = await requireAppVersions(api, appA.name);
  // An update has to have somewhere to go, or every assertion after it holds before the click.
  expect(latestRevision).not.toBe(oldRevision);
  for (const name of [appA.name, appB.name]) {
    expect(await readAppVersions(api, name)).toMatchObject({ version: oldRevision, upgradeAvailable: true });
  }
  const bystanderVersions = await requireAppVersions(api, bystander);
  expect(bystanderVersions.upgradeAvailable).toBe(false);

  return { latestRevision, bystanderRevision: bystanderVersions.version };
}

/** The ids of the `core.bulk` upgrade jobs that ran before the test pressed Update. */
async function readBulkUpgradeIds(api: E2eApiClient): Promise<number[]> {
  return (await findBulkUpgradeJobs(api)).map((job) => job.id);
}

/**
 * Waits for the one `core.bulk` upgrade job the dialog started to end, and returns what it ran each
 * upgrade with. A job not in `before` is the dialog's: nothing else in this spec starts one.
 */
async function waitForBulkUpgrade(api: E2eApiClient, before: number[]): Promise<unknown[]> {
  const started = async (): Promise<{ state: string; upgrades: unknown[] }[]> => {
    const jobs = await findBulkUpgradeJobs(api);
    return jobs.filter((job) => !before.includes(job.id));
  };

  await expect.poll(
    async () => (await started()).map((job) => job.state),
    { message: 'the bulk Update dialog should have run one core.bulk job to the end', timeout: appInstallTimeoutMs },
  ).toEqual(['SUCCESS']);
  const [job] = await started();
  return job?.upgrades ?? [];
}

/** Waits until the app runs the latest revision, has nothing left to update, and is running again. */
async function expectUpdated(api: E2eApiClient, name: string, latestRevision: string): Promise<void> {
  await expect.poll(
    () => readAppVersions(api, name),
    { message: `app "${name}" should run the latest revision`, timeout: appInstallTimeoutMs },
  ).toMatchObject({ version: latestRevision, upgradeAvailable: false });
  await expect.poll(
    () => readAppState(api, name),
    { message: `app "${name}" should be running after the update`, timeout: appInstallTimeoutMs },
  ).toBe('RUNNING');
}

test('Update All updates every app with an update, and leaves an up-to-date app alone', async ({ page, api }) => {
  const { latestRevision, bystanderRevision } = await seedApps(api);
  const upgradesBefore = {
    a: await findAppJobIds(api, 'app.upgrade', appA.name),
    b: await findAppJobIds(api, 'app.upgrade', appB.name),
    bystander: await findAppJobIds(api, 'app.upgrade', bystander),
  };

  await goToApps(page);
  // The starting state the update has to change.
  await expect(page.locator(installedAppLocators(appA.name).updates)).toHaveText(revisionAvailable);
  await expect(page.locator(installedAppLocators(appB.name).updates)).toHaveText(revisionAvailable);
  await expect(page.locator(installedAppLocators(bystander).updates)).toHaveText(upToDate);
  await expect(page.locator(appsLocators.updateAll)).toHaveText('Update All (2)');

  await openAppsUpdateAll(page);
  await expect(page.locator(appBulkUpdateDialogLocators.appName(appA.name))).toBeVisible();
  await expect(page.locator(appBulkUpdateDialogLocators.appName(appB.name))).toBeVisible();
  await expect(page.locator(appBulkUpdateDialogLocators.anyAppName)).toHaveCount(2);
  const bulkJobsBefore = await readBulkUpgradeIds(api);
  await confirmAppsBulkUpdate(page);

  // Both rows were left collapsed, so neither sends a version.
  const upgrades = await waitForBulkUpgrade(api, bulkJobsBefore);
  expect(upgrades).toHaveLength(2);
  expect(upgrades).toEqual(expect.arrayContaining([[appA.name], [appB.name]]));

  await expect(page.locator(installedAppLocators(appA.name).updates)).toHaveText(upToDate, {
    timeout: appInstallTimeoutMs,
  });
  await expect(page.locator(installedAppLocators(appB.name).updates)).toHaveText(upToDate, {
    timeout: appInstallTimeoutMs,
  });
  await expect(page.locator(appsLocators.updateAll)).toBeHidden();

  await expectUpdated(api, appA.name, latestRevision);
  await expectUpdated(api, appB.name, latestRevision);
  // Each updated app got an upgrade of its own, so the bystander's unchanged list below means something.
  expect(await findAppJobIds(api, 'app.upgrade', appA.name)).not.toEqual(upgradesBefore.a);
  expect(await findAppJobIds(api, 'app.upgrade', appB.name)).not.toEqual(upgradesBefore.b);
  expect(await findAppJobIds(api, 'app.upgrade', bystander)).toEqual(upgradesBefore.bystander);
  expect((await readAppVersions(api, bystander))?.version).toBe(bystanderRevision);
});

test('Update All Selected updates only the selected apps that have an update', async ({ page, api }) => {
  const { latestRevision, bystanderRevision } = await seedApps(api);

  await goToApps(page);
  await expect(page.locator(installedAppLocators(appA.name).updates)).toHaveText(revisionAvailable);
  await expect(page.locator(installedAppLocators(appB.name).updates)).toHaveText(revisionAvailable);

  // The bystander alone has nothing to update.
  await selectRow(page, installedAppRowTag(bystander));
  await openAppsBulkMenu(page);
  await expect(page.locator(installedAppsBulkLocators.updateSelected)).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.locator(installedAppsBulkLocators.updateSelected)).toBeHidden();

  await selectRow(page, installedAppRowTag(appA.name));
  await expect(page.locator(installedAppsBulkLocators.selectedCount)).toHaveText('2');
  await openAppsBulkMenu(page);
  await expect(page.locator(installedAppsBulkLocators.updateSelected)).toBeEnabled();
  await page.locator(installedAppsBulkLocators.updateSelected).click();

  // The dialog drops the ticked bystander, and B was never ticked.
  await expect(page.locator(appBulkUpdateDialogLocators.title)).toBeVisible();
  await expect(page.locator(appBulkUpdateDialogLocators.appName(appA.name))).toBeVisible();
  await expect(page.locator(appBulkUpdateDialogLocators.anyAppName)).toHaveCount(1);
  const bulkJobsBefore = await readBulkUpgradeIds(api);
  await confirmAppsBulkUpdate(page);

  expect(await waitForBulkUpgrade(api, bulkJobsBefore)).toEqual([[appA.name]]);

  await expect(page.locator(installedAppLocators(appA.name).updates)).toHaveText(upToDate, {
    timeout: appInstallTimeoutMs,
  });
  await expect(page.locator(installedAppLocators(appB.name).updates)).toHaveText(revisionAvailable);
  // The selection is cleared when the dialog closes.
  await expect(page.locator(installedAppsBulkLocators.menu)).toBeHidden();

  await expectUpdated(api, appA.name, latestRevision);
  // The `core.bulk` job has ended, so B would already be on the latest had it been sent.
  expect(await readAppVersions(api, appB.name)).toMatchObject({ version: oldRevision, upgradeAvailable: true });
  expect((await readAppVersions(api, bystander))?.version).toBe(bystanderRevision);
});
