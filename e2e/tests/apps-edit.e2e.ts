/**
 * Stories: an admin edits an installed catalog app's port and environment in the install wizard,
 * and the app takes the change; the wizard refuses a port out of range; and an admin converts a
 * catalog app to a custom app from its Application Info card, and it keeps running.
 *
 * Each is checked on screen and through `app.query` and `app.config`. Every test seeds its own app
 * with `app.create`, under a name of its own.
 *
 * ## The app
 *
 * IT Tools from the `community` train, as in `apps-install.e2e.ts`: one container, no storage, and a
 * form whose WebUI Port is an int with a `max`, and whose Additional Environment Variables land in the
 * `it-tools` service's environment. Converting is one-way, which is why the convert test has an app
 * of its own.
 *
 * ## Setup
 *
 * As `apps-install.e2e.ts`: Apps run on `e2e_apps`, a one-disk pool built, given to Apps and
 * destroyed here, once for the file. `community` is added to the preferred trains if it is missing,
 * and written back afterwards. No test installs through Discover, so the apps agreement is left alone.
 * Teardown deletes both apps after every test, custom or not, and unsets Apps and exports the pool
 * after the last.
 *
 * Not covered: editing a custom app (`apps-custom-yaml.e2e.ts`), storage, GPU, networks and labels in
 * the form, and whether the new port serves IT Tools.
 */
import {
  appInstallTimeoutMs,
  communityTrain,
  ensureAppAbsent,
  ensureAppsPoolUnset,
  readAppPortNumber,
  readAppState,
  readDocker,
  readIsCustomApp,
  readPreferredTrains,
  readServiceEnvironment,
  seedCatalogApp,
  setAppsPool,
  setPreferredTrains,
  syncCatalog,
} from '../fixtures/apps';
import { ensurePoolPresent } from '../fixtures/pool';
import { ensurePoolAbsent, requireUnusedDisks } from '../fixtures/storage';
import {
  addEnvironmentVariable, convertToCustomApp, openCatalogAppEdit, updateCatalogApp,
} from '../flows/catalog-apps';
import { goToApps } from '../flows/navigation';
import {
  appInfoCardLocators, catalogAppEditLocators, customAppLocators, installedAppLocators,
} from '../locators/apps';
import { jobDialogLocators } from '../locators/encryption';
import { leavingTestData, runCleanupSteps, type CleanupStep } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Built, given to Apps and destroyed here. The same pool `apps-install.e2e.ts` builds. */
const pool = 'e2e_apps';

const catalogApp = 'it-tools';
/** The compose service IT Tools' environment is on. */
const service = 'it-tools';
const editedRelease = 'e2e-it-tools-edit';
const convertedRelease = 'e2e-it-tools-convert';
const releases = [editedRelease, convertedRelease];

/** IT Tools' WebUI port as the catalog installs it, and its schema's ceiling. */
const defaultPort = 30063;
const maxPort = 65535;
/** Neither the default nor anything else on the appliance. */
const editedPort = 30163;

/** Apps on a pool this spec did not make is somebody's, as `apps-install.e2e.ts` explains. */
let appsOnSomebodyElsesPool = false;

/** Written back in `afterAll`. Undefined until read, so a failed setup writes back nothing. */
let preferredTrainsBefore: string[] | undefined;

test.beforeAll(async ({ api }) => {
  const { pool: appsPool } = await readDocker(api);
  appsOnSomebodyElsesPool = appsPool !== null && appsPool !== pool;
  if (appsOnSomebodyElsesPool) {
    return;
  }

  preferredTrainsBefore = await readPreferredTrains(api);

  // In this order: the apps' datasets keep `e2e_apps/ix-apps` busy, and Docker keeps the pool busy.
  for (const release of releases) {
    await ensureAppAbsent(api, release);
  }
  await ensureAppsPoolUnset(api);
  await ensurePoolAbsent(api, pool);
  await requireUnusedDisks(api, 1);
  await ensurePoolPresent(api, pool);
  await setAppsPool(api, pool);

  if (!preferredTrainsBefore.includes(communityTrain)) {
    await setPreferredTrains(api, [...preferredTrainsBefore, communityTrain]);
  }
  // A pool change starts a sync in the background. Seeding needs it finished.
  await syncCatalog(api);
});

test.beforeEach(async ({ api }) => {
  // Apps on another pool is a developer's own setup, and teardown would unset it.
  test.skip(appsOnSomebodyElsesPool, 'Apps already use a pool this spec did not create.');

  for (const release of releases) {
    await ensureAppAbsent(api, release);
  }
});

test.afterEach(async ({ api }) => {
  if (appsOnSomebodyElsesPool || leavingTestData(`apps ${releases.join(', ')}`)) {
    return;
  }

  // `app.delete` takes a converted app as well as a catalog one.
  await runCleanupSteps(releases.map((release): CleanupStep => [
    `delete app "${release}"`,
    () => ensureAppAbsent(api, release),
  ]));
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

  if (!leavingTestData(`apps ${releases.join(', ')}, pool "${pool}" and the Apps pool`)) {
    // In this order: the export fails while Docker holds `e2e_apps/ix-apps`.
    steps.push(
      ...releases.map((release): CleanupStep => [`delete app "${release}"`, () => ensureAppAbsent(api, release)]),
      ['unset the Apps pool', () => ensureAppsPoolUnset(api)],
      [`export pool "${pool}"`, () => ensurePoolAbsent(api, pool)],
    );
  }

  await runCleanupSteps(steps);
});

test('an admin edits the port and environment of a catalog app, and it takes them', async ({ page, api }) => {
  await seedCatalogApp(api, { name: editedRelease, catalogApp, train: communityTrain });
  const app = installedAppLocators(editedRelease);

  await goToApps(page);
  await expect(page.locator(app.state)).toHaveText('Running', { timeout: appInstallTimeoutMs });

  await openCatalogAppEdit(page, editedRelease);
  // The form is prefilled from the installed values: the starting state the edit has to change.
  await expect(page.locator(catalogAppEditLocators.portNumber)).toHaveValue(String(defaultPort));

  await page.locator(catalogAppEditLocators.portNumber).fill(String(editedPort));
  await addEnvironmentVariable(page, 'E2E_EDIT', '1');
  await updateCatalogApp(page);

  await expect(page.locator(app.state)).toHaveText('Running', { timeout: appInstallTimeoutMs });

  expect(await readAppPortNumber(api, editedRelease)).toBe(editedPort);
  // TZ is the form's default, left alone: an update that dropped the values the user did not touch
  // would lose it.
  expect(await readServiceEnvironment(api, editedRelease, service)).toMatchObject({
    E2E_EDIT: '1',
    TZ: 'Etc/UTC',
  });
});

test('the edit form refuses a port out of range', async ({ page, api }) => {
  await seedCatalogApp(api, { name: editedRelease, catalogApp, train: communityTrain });

  await goToApps(page);
  await openCatalogAppEdit(page, editedRelease);
  await expect(page.locator(catalogAppEditLocators.portNumber)).toHaveValue(String(defaultPort));
  // Valid as loaded, so the refusal below is the out-of-range value's.
  await expect(page.locator(catalogAppEditLocators.update)).toBeEnabled();

  await page.locator(catalogAppEditLocators.portNumber).fill(String(maxPort + 1));
  // Not shown for an untouched field.
  await page.locator(catalogAppEditLocators.portNumber).blur();

  // The schema's `max`, applied by the form, not a refusal from middleware: nothing is sent.
  await expect(page.locator(catalogAppEditLocators.portNumberField)).toContainText(`Maximum value is ${maxPort}`);
  await expect(page.locator(catalogAppEditLocators.update)).toBeDisabled();
  expect(await readAppPortNumber(api, editedRelease)).toBe(defaultPort);
});

test('an admin converts a catalog app to a custom app, and it keeps running', async ({ page, api }) => {
  await seedCatalogApp(api, { name: convertedRelease, catalogApp, train: communityTrain });
  const app = installedAppLocators(convertedRelease);

  await goToApps(page);
  await expect(page.locator(app.state)).toHaveText('Running', { timeout: appInstallTimeoutMs });
  // The starting state the conversion has to change.
  expect(await readIsCustomApp(api, convertedRelease)).toBe(false);

  await convertToCustomApp(page, convertedRelease);

  await expect.poll(
    () => readIsCustomApp(api, convertedRelease),
    { message: `app "${convertedRelease}" should be recorded as a custom app`, timeout: appInstallTimeoutMs },
  ).toBe(true);
  // Conversion removes the containers and recreates them from the rendered compose file. A ceiling.
  await expect.poll(
    () => readAppState(api, convertedRelease),
    { message: `app "${convertedRelease}" should be running again`, timeout: appInstallTimeoutMs },
  ).toBe('RUNNING');
  await expect(page.locator(jobDialogLocators.title)).toBeHidden({ timeout: appInstallTimeoutMs });

  // The card now draws the app as a custom one: Name as plain text rather than a catalog link.
  await expect(page.locator(app.customName)).toBeVisible({ timeout: appInstallTimeoutMs });
  await expect(page.locator(app.catalogName)).toHaveCount(0);
  await expect(page.locator(app.state)).toHaveText('Running', { timeout: appInstallTimeoutMs });

  await page.locator(appInfoCardLocators.menu).click();
  await expect(page.locator(app.convert)).toBeDisabled();
  await page.keyboard.press('Escape');

  // A custom app's Edit opens the YAML panel, holding the compose file the conversion rendered.
  await page.locator(app.edit).click();
  await expect(page.locator(customAppLocators.config)).toContainText(service, { timeout: appInstallTimeoutMs });
});
