/**
 * Stories: an admin edits Docker's address pools, adds a registry mirror and turns off image update
 * checks from Apps > Configuration > Settings, and middleware refuses the two settings it cannot
 * use: a base network smaller than its subnet size, and a plain-HTTP mirror not marked insecure.
 *
 * The form saves through `catalog.update` and the `docker.update` job together, and the panel
 * closes only once both succeed. Every save is checked through `docker.config` afterwards.
 *
 * ## Why only with no Apps pool
 *
 * With no pool, `docker.update` only writes the datastore. With one, every change to the pools or
 * mirrors stops Docker, restarts it and redeploys the apps, which is slow and not this form's
 * concern. Apps on a pool is somebody's, and taking it off would stop their apps, so the spec skips
 * there instead. On the CI appliance Apps has no pool.
 *
 * ## Where the refusals show
 *
 * Both are reported in the error dialog, not under a field. The pool's is filed under
 * `docker_update.address_pools.<i>.base`, and the form's error handler cannot resolve a path through
 * a form array, so it falls back to the dialog. The mirror's comes from the `DockerUpdate` model's
 * own validator, which names no field.
 *
 * Not covered: Preferred Trains, which needs a synced catalog the offline appliance does not have;
 * the NVIDIA checkbox, hidden with no GPU; and a pool that overlaps the appliance's own network,
 * which depends on the CI NIC's address. The "Settings saved" snackbar renders no `data-test`.
 */
import {
  defaultDockerSettings, readDocker, readDockerSettings, setDockerSettings, type DockerSettings,
} from '../fixtures/apps';
import {
  addRegistryMirror, fillAddressPool, openAppsSettings, saveAppsSettings,
} from '../flows/apps';
import { goToApps } from '../flows/navigation';
import { appsSettingsLocators } from '../locators/apps';
import { errorDialogLocators } from '../locators/dialogs';
import { leavingTestData } from '../support/cleanup';
import { errorDialogClose } from '../support/constants';
import { expect, test } from '../support/fixtures';

/** A ceiling on a refusal coming back: `docker.update` validates before it writes anything. */
const refusalTimeoutMs = 60_000;

/** `.invalid` is reserved (RFC 2606), so neither mirror can ever be reached. Nothing pulls from it. */
const httpsMirror = 'https://mirror.e2e.invalid';
const httpMirror = 'http://mirror.e2e.invalid';

/** The first default pool's address, which the form shows once it has loaded `docker.config`. */
const defaultFirstPoolAddress = '172.16.0.0';

/** What the appliance held before this file ran, and therefore what `afterEach` writes back. */
let found: DockerSettings | undefined;

let appsHavePool = false;

test.beforeAll(async ({ api }) => {
  appsHavePool = (await readDocker(api)).pool !== null;
  found = await readDockerSettings(api);
});

test.beforeEach(async ({ api }) => {
  // With an Apps pool, every save here would restart Docker and redeploy somebody's apps.
  test.skip(appsHavePool, 'Apps use a pool, and a settings change would restart Docker on it.');

  await setDockerSettings(api, defaultDockerSettings);
});

test.afterEach(async ({ api }) => {
  if (appsHavePool || leavingTestData('the Apps address pools, registry mirrors and image update checks')) {
    return;
  }

  // Guarded: if `beforeAll` threw, there is nothing known to write back.
  if (found !== undefined) {
    await setDockerSettings(api, found);
  }
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
