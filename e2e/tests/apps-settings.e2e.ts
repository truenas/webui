/**
 * Stories: an admin edits Docker's address pools, adds a registry mirror and turns off image update
 * checks from Apps > Configuration > Settings, and middleware refuses the two settings it cannot
 * use: a base network smaller than its subnet size, and a plain-HTTP mirror not marked insecure.
 * In the same panel an admin adds a train to the preferred trains and removes it again, the form
 * refuses a save with no train, and an Enterprise-entitled appliance refuses a list without
 * `enterprise`.
 *
 * The form saves through `catalog.update` and the `docker.update` job together, and the panel
 * closes only once both succeed. Every save is checked through `docker.config` and
 * `catalog.config` afterwards.
 *
 * ## Why only with no Apps pool
 *
 * With no pool, `docker.update` only writes the datastore. With one, every change to the pools or
 * mirrors stops Docker, restarts it and redeploys the apps, which is slow and not this form's
 * concern. Apps on a pool is somebody's, and taking it off would stop their apps, so the spec skips
 * there instead. On the CI appliance Apps has no pool.
 *
 * ## Why the preferred trains need a sync
 *
 * The form offers what `catalog.trains` returns, and middleware answers that from the cache a
 * catalog sync fills, never from the catalog itself, and with no Apps pool nothing ensures a sync
 * has run. So the preferred-trains tests sync once first when `test` is not offered. With no pool a
 * sync clones into a temporary directory rather than onto a pool, and it needs outbound access to
 * github.com.
 *
 * ## Where the refusals show
 *
 * The Docker ones are reported in the error dialog, not under a field. The pool's is filed under
 * `docker_update.address_pools.<i>.base`, and the form's error handler cannot resolve a path through
 * a form array, so it falls back to the dialog. The mirror's comes from the `DockerUpdate` model's
 * own validator, which names no field. The missing `enterprise` train is filed under
 * `catalog_update.preferred_trains`, which is a control the form has, so it shows under the field.
 *
 * Not covered: whether Discover lists the newly preferred train, which would need a reload or a
 * sync after the save, since Discover loads the catalog into its store once; the NVIDIA checkbox,
 * hidden with no GPU; and a pool that overlaps the appliance's own network, which depends on the
 * CI NIC's address. The "Settings saved" snackbar renders no `data-test`.
 */
import {
  defaultDockerSettings,
  enterpriseTrain,
  readCatalogTrains,
  readDocker,
  readDockerSettings,
  readEnterpriseTrainRequired,
  readPreferredTrains,
  setDockerSettings,
  setPreferredTrains,
  syncCatalog,
  type DockerSettings,
} from '../fixtures/apps';
import {
  addRegistryMirror,
  discardAppsSettings,
  expectPreferredTrains,
  fillAddressPool,
  openAppsSettings,
  saveAppsSettings,
} from '../flows/apps';
import { goToApps } from '../flows/navigation';
import { appsSettingsLocators } from '../locators/apps';
import { errorDialogLocators } from '../locators/dialogs';
import { leavingTestData, runCleanupSteps, type CleanupStep } from '../support/cleanup';
import { errorDialogClose } from '../support/constants';
import { expect, test } from '../support/fixtures';

/** A ceiling on a refusal coming back: `docker.update` validates before it writes anything. */
const refusalTimeoutMs = 60_000;

/** `.invalid` is reserved (RFC 2606), so neither mirror can ever be reached. Nothing pulls from it. */
const httpsMirror = 'https://mirror.e2e.invalid';
const httpMirror = 'http://mirror.e2e.invalid';

/** The first default pool's address, which the form shows once it has loaded `docker.config`. */
const defaultFirstPoolAddress = '172.16.0.0';

/** A train in the catalog that no appliance prefers by default. */
const testTrain = 'test';

/** What the appliance held before this file ran, and therefore what `afterEach` writes back. */
let found: DockerSettings | undefined;
let preferredTrainsFound: string[] | undefined;

/** What each test starts from: the trains the appliance held, without `test`. */
let startingTrains: string[] = [];

let appsHavePool = false;

/** The checkbox group writes its value in option order, so lists are compared as sets. */
function sorted(trains: string[]): string[] {
  return [...trains].sort((a, b) => a.localeCompare(b));
}

test.beforeAll(async ({ api, appsPool }) => {
  // The shared `e2e_apps` the other apps specs run on is the suite's own, and in the way here.
  await appsPool.release();
  appsHavePool = (await readDocker(api)).pool !== null;
  found = await readDockerSettings(api);
  preferredTrainsFound = await readPreferredTrains(api);
  startingTrains = preferredTrainsFound.filter((train) => train !== testTrain);
});

test.beforeEach(async ({ api }) => {
  // With an Apps pool, every save here would restart Docker and redeploy somebody's apps.
  test.skip(appsHavePool, 'Apps use a pool, and a settings change would restart Docker on it.');

  await setDockerSettings(api, defaultDockerSettings);
  await setPreferredTrains(api, startingTrains);
});

test.afterEach(async ({ api }) => {
  if (appsHavePool) {
    return;
  }

  const steps: CleanupStep[] = [];
  // Guarded: if `beforeAll` threw, there is nothing known to write back.
  const trains = preferredTrainsFound;
  if (trains !== undefined) {
    // A setting, not test data: written back even when test data is kept.
    steps.push(['restore the preferred trains', () => setPreferredTrains(api, trains)]);
  }
  const settings = found;
  if (settings !== undefined && !leavingTestData('the Apps address pools, registry mirrors and image update checks')) {
    steps.push(['restore the Docker settings', () => setDockerSettings(api, settings)]);
  }

  await runCleanupSteps(steps);
});

test('an admin edits an address pool, adds a mirror and turns off image update checks', async ({ page, api }) => {
  await goToApps(page);
  await openAppsSettings(page, defaultFirstPoolAddress);

  await fillAddressPool(page, 0, { address: '172.30.0.0', prefixBits: 16, size: 27 });
  await addRegistryMirror(page, 0, httpsMirror);
  await page.locator(appsSettingsLocators.enableImageUpdates).click();
  await saveAppsSettings(page);

  expect(await readDockerSettings(api)).toEqual({
    address_pools: [
      { base: '172.30.0.0/16', size: 27 },
      // Untouched, and still there: the form sends the whole list, not the row that changed.
      defaultDockerSettings.address_pools[1],
    ],
    // Middleware stores the URL as pydantic's `HttpUrl` writes it, with a trailing slash.
    registry_mirrors: [{ url: `${httpsMirror}/`, insecure: false }],
    enable_image_updates: false,
  });
});

test('a base network smaller than its subnet size is refused, and nothing is saved', async ({ page, api }) => {
  await goToApps(page);
  await openAppsSettings(page, defaultFirstPoolAddress);

  // A /16 cannot be cut into /8 subnets. The form has no validator for this; middleware does.
  await fillAddressPool(page, 0, { address: '172.30.0.0', prefixBits: 16, size: 8 });
  await page.locator(appsSettingsLocators.save).click();

  await expect(page.locator(errorDialogLocators.message)).toContainText(
    'cannot be smaller than the specified subnet size',
    { timeout: refusalTimeoutMs },
  );
  await page.locator(errorDialogClose).click();
  await expect(page.locator(errorDialogLocators.title)).toBeHidden();
  // A refusal leaves the panel open; a save would have closed it.
  await expect(page.locator(appsSettingsLocators.save)).toBeVisible();

  expect((await readDockerSettings(api)).address_pools).toEqual(defaultDockerSettings.address_pools);
});

test('a plain-HTTP mirror is refused until it is marked insecure', async ({ page, api }) => {
  await goToApps(page);
  await openAppsSettings(page, defaultFirstPoolAddress);

  await addRegistryMirror(page, 0, httpMirror);
  await page.locator(appsSettingsLocators.save).click();

  await expect(page.locator(errorDialogLocators.message)).toContainText(
    'must be marked as insecure',
    { timeout: refusalTimeoutMs },
  );
  await page.locator(errorDialogClose).click();
  await expect(page.locator(errorDialogLocators.title)).toBeHidden();
  expect((await readDockerSettings(api)).registry_mirrors).toEqual([]);

  // The same mirror, now marked insecure, is the one middleware keeps.
  await page.locator(appsSettingsLocators.registryMirror(0).insecure).click();
  await saveAppsSettings(page);

  expect((await readDockerSettings(api)).registry_mirrors).toEqual([{ url: `${httpMirror}/`, insecure: true }]);
});

test.describe('preferred trains', () => {
  let enterpriseTrainRequired = false;

  test.beforeAll(async ({ api }) => {
    if (appsHavePool) {
      return;
    }

    if (!(await readCatalogTrains(api)).includes(testTrain)) {
      await syncCatalog(api);
    }
    const offered = await readCatalogTrains(api);
    expect(
      offered,
      `catalog.trains should offer "${testTrain}" once the catalog has synced with no Apps pool. `
      + `It offers: ${offered.join(', ') || 'nothing'}.`,
    ).toContain(testTrain);

    enterpriseTrainRequired = await readEnterpriseTrainRequired(api);
  });

  test('an admin adds a train to the preferred trains', async ({ page, api }) => {
    await goToApps(page);
    await openAppsSettings(page, defaultFirstPoolAddress);
    await expectPreferredTrains(page, startingTrains, [testTrain]);

    await page.locator(appsSettingsLocators.preferredTrain(testTrain)).click();
    await saveAppsSettings(page);

    expect(sorted(await readPreferredTrains(api))).toEqual(sorted([...startingTrains, testTrain]));

    await openAppsSettings(page, defaultFirstPoolAddress);
    await expectPreferredTrains(page, [...startingTrains, testTrain], []);
  });

  test('an admin removes a train from the preferred trains', async ({ page, api }) => {
    await setPreferredTrains(api, [...startingTrains, testTrain]);

    await goToApps(page);
    await openAppsSettings(page, defaultFirstPoolAddress);
    await expectPreferredTrains(page, [...startingTrains, testTrain], []);

    await page.locator(appsSettingsLocators.preferredTrain(testTrain)).click();
    await saveAppsSettings(page);

    // Every other train is still there, `enterprise` included where the appliance held it.
    expect(sorted(await readPreferredTrains(api))).toEqual(sorted(startingTrains));
  });

  test('the form refuses a save with no train', async ({ page, api }) => {
    await goToApps(page);
    await openAppsSettings(page, defaultFirstPoolAddress);
    await expectPreferredTrains(page, startingTrains, [testTrain]);

    for (const train of startingTrains) {
      await page.locator(appsSettingsLocators.preferredTrain(train)).click();
    }
    await expectPreferredTrains(page, [], [...startingTrains, testTrain]);
    await expect(page.locator(appsSettingsLocators.save)).toBeDisabled();

    await page.locator(appsSettingsLocators.preferredTrain(testTrain)).click();
    await expect(page.locator(appsSettingsLocators.save)).toBeEnabled();
    await discardAppsSettings(page);

    // A backstop: Save was never pressed, so only a discard that saved anyway could change this.
    expect(sorted(await readPreferredTrains(api))).toEqual(sorted(startingTrains));
  });

  test('an Enterprise-entitled appliance refuses a list without enterprise', async ({ page, api }) => {
    // `catalog.update` refuses only where CATALOG_ENTERPRISE_TRAIN is granted, so elsewhere there is nothing to see.
    test.skip(!enterpriseTrainRequired, 'Only an appliance entitled to the Enterprise train must keep it.');
    expect(startingTrains, 'An entitled appliance already prefers the enterprise train.').toContain(enterpriseTrain);

    await goToApps(page);
    await openAppsSettings(page, defaultFirstPoolAddress);
    await expectPreferredTrains(page, startingTrains, [testTrain]);

    // `test` keeps the list from being empty, so the form is valid and it is middleware that refuses.
    await page.locator(appsSettingsLocators.preferredTrain(enterpriseTrain)).click();
    await page.locator(appsSettingsLocators.preferredTrain(testTrain)).click();
    await page.locator(appsSettingsLocators.save).click();

    await expect(page.locator(appsSettingsLocators.preferredTrains)).toContainText(
      'Enterprise systems must at least have',
      { timeout: refusalTimeoutMs },
    );
    // A refusal leaves the panel open; a save would have closed it.
    await expect(page.locator(appsSettingsLocators.save)).toBeVisible();

    expect(sorted(await readPreferredTrains(api))).toEqual(sorted(startingTrains));
    // `docker.update` goes out in the same `forkJoin`, and must not have written anything else.
    expect(await readDockerSettings(api)).toEqual(defaultDockerSettings);
  });
});
