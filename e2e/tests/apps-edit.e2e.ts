/**
 * Stories: an admin edits an installed catalog app's port and environment in the install wizard,
 * and the app takes the change; the wizard refuses a port out of range; and an admin converts a
 * catalog app to a custom app from its Application Info card, and it keeps running.
 *
 * Each is checked on screen and through `app.query`, the edits in the app's saved values. Every test
 * seeds its own app with `app.create`, under a name of its own.
 *
 * ## The app
 *
 * IT Tools from the `community` train, as in `apps-install.e2e.ts`: one container, no storage, and a
 * form whose WebUI Port is an int with a `max`, and whose Additional Environment Variables are saved
 * under `it_tools.additional_envs`. Converting is one-way, which is why the convert test has an app
 * of its own.
 *
 * ## Setup
 *
 * Apps run on `e2e_apps`, the pool the apps specs share through the `appsPool` fixture, built once
 * per worker. `community` is added to the preferred trains if it is missing, and written back
 * afterwards. No test installs through Discover, so the apps agreement is left alone. Teardown
 * deletes both apps after every test, custom or not.
 *
 * Not covered: editing a custom app (`apps-custom-yaml.e2e.ts`), storage, GPU, networks and labels in
 * the form, and whether the new port serves IT Tools.
 */
import {
  appInstallTimeoutMs,
  communityTrain,
  ensureAppAbsent,
  readAppAdditionalEnvs,
  readAppPortNumber,
  readAppState,
  readAppTimezone,
  readIsCustomApp,
  readPreferredTrains,
  seedCatalogApp,
  setPreferredTrains,
  syncCatalog,
} from '../fixtures/apps';
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

const catalogApp = 'it-tools';
/** The compose service IT Tools' environment is on, once converted to a custom app. */
const service = 'it-tools';
/** The section of IT Tools' values holding its Additional Environment Variables. */
const valuesSection = 'it_tools';
/** Not the catalog's default TZ, `Etc/UTC`, so keeping it is something an update can get wrong. */
const seededTimezone = 'America/New_York';
const editedRelease = 'e2e-it-tools-edit';
const convertedRelease = 'e2e-it-tools-convert';
const releases = [editedRelease, convertedRelease];

/** IT Tools' WebUI port as the catalog installs it, and its schema's ceiling. */
const defaultPort = 30063;
const maxPort = 65535;
/** Neither the default nor anything else on the appliance. */
const editedPort = 30163;

/** Apps on a pool the suite did not make is somebody's, as `apps-install.e2e.ts` explains. */
let appsOnSomebodyElsesPool = false;

/** Written back in `afterAll`. Undefined until read, so a failed setup writes back nothing. */
let preferredTrainsBefore: string[] | undefined;

test.beforeAll(async ({ api, appsPool }) => {
  appsOnSomebodyElsesPool = !(await appsPool.ensure());
  if (appsOnSomebodyElsesPool) {
    return;
  }

  preferredTrainsBefore = await readPreferredTrains(api);

  // The pool outlives this file, so whatever a failed cleanup of these apps left goes first.
  for (const release of releases) {
    await ensureAppAbsent(api, release);
  }

  if (!preferredTrainsBefore.includes(communityTrain)) {
    await setPreferredTrains(api, [...preferredTrainsBefore, communityTrain]);
  }
  // Moving Apps onto the pool, if `ensure` just did, starts a sync in the background. Seeding needs
  // it finished.
  await syncCatalog(api);
});

test.beforeEach(async ({ api }) => {
  // Apps on another pool is a developer's own setup, and moving Apps off it would stop their apps.
  test.skip(appsOnSomebodyElsesPool, 'Apps already use a pool the suite did not create.');

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

  // A setting, not test data: written back even when the apps are kept.
  const steps: CleanupStep[] = [];
  const trains = preferredTrainsBefore;
  if (trains !== undefined) {
    steps.push(['restore the preferred trains', () => setPreferredTrains(api, trains)]);
  }

  if (!leavingTestData(`apps ${releases.join(', ')}`)) {
    steps.push(
      ...releases.map((release): CleanupStep => [`delete app "${release}"`, () => ensureAppAbsent(api, release)]),
    );
  }

  await runCleanupSteps(steps);
});

test('an admin edits the port and environment of a catalog app, and it takes them', async ({ page, api }) => {
  await seedCatalogApp(api, {
    name: editedRelease,
    catalogApp,
    train: communityTrain,
    values: { TZ: seededTimezone },
  });
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
  expect(await readAppAdditionalEnvs(api, editedRelease, valuesSection)).toEqual({ E2E_EDIT: '1' });
  // Seeded, and left alone in the form: an update that dropped the values the user did not touch
  // would put back the catalog's default.
  expect(await readAppTimezone(api, editedRelease)).toBe(seededTimezone);
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
