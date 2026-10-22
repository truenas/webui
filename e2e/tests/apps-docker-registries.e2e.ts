/**
 * Story: an admin signs the Apps service in to a Docker registry, renames the sign-in and deletes
 * it, and the form refuses a URI that is not a URL.
 *
 * Each action is the UI's: Apps > Configuration > Sign-in to a Docker registry, Add Registry and
 * its side panel, and the row's Edit and Delete. Each is checked on screen and through
 * `app.registry.query`. The registry a test does not add is seeded with `app.registry.create`.
 *
 * ## The registry
 *
 * Middleware stores a registry only once the Docker daemon has logged in to it, and the suite holds
 * no registry credentials. So the first three tests sign in to a public registry whose `/v2/` asks
 * for none, with made-up credentials. Which registry that is is found in `beforeAll`, by trying
 * each of `registryCandidates` over the API. If none is accepted, those three tests fail with what
 * middleware answered for each; the URI test does not depend on it.
 *
 * `app.registry.query` masks `username` and `password`, so neither can be read back. The Username
 * column shows the mask, and the tests do not assert it.
 *
 * ## Setup
 *
 * The menu item is disabled until Apps has a pool, so Apps runs on `e2e_apps`, the pool the apps
 * specs share through the `appsPool` fixture, built once per worker: moving Apps onto a pool takes
 * minutes, and no test here changes it. Every registry name the spec uses is deleted before and
 * after each test.
 *
 * Not covered: signing in to Docker Hub, the Docker Hub rate-limit dialog, pulling with registry
 * credentials, and the list's search, sorting and column picker.
 */
import {
  ensureRegistryAbsent,
  findRegistry,
  findRegistryAcceptingAnyLogin,
  madeUpCredentials,
  seedRegistry,
  type RegistryProbe,
} from '../fixtures/docker-registries';
import {
  addRegistry, deleteRegistry, goToDockerRegistries, openOtherRegistryForm, saveRegistry,
} from '../flows/docker-registries';
import { goToApps } from '../flows/navigation';
import { dockerRegistriesLocators, dockerRegistryFormLocators } from '../locators/docker-registries';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps, type CleanupStep } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const registryName = 'e2e-registry';
const renamedRegistryName = 'e2e-registry-renamed';
/** What `beforeAll` stores and deletes again while it looks for a registry to sign in to. */
const probeName = 'e2e-registry-probe';
const refusedName = 'e2e-registry-refused';
/** Every name this spec stores a registry under. Nothing else is ever deleted. */
const registryNames = [registryName, renamedRegistryName, probeName, refusedName];

/** No scheme, so `UrlValidationService.urlRegex` refuses it. */
const schemelessUri = 'registry.e2e.invalid';
/** The same host with a scheme, which the pattern accepts. Only typed, never saved. */
const wellFormedUri = `https://${schemelessUri}`;
const patternMessage = 'Invalid format or character';

/** As in `apps-install.e2e.ts`: Apps on a pool the suite did not make is somebody's. */
let appsOnSomebodyElsesPool = false;

/** Undefined until `beforeAll` has looked. */
let probe: RegistryProbe | undefined;

/** The registry to sign in to, or an error naming what each candidate answered. */
function registryUri(): string {
  if (probe && 'uri' in probe) {
    return probe.uri;
  }
  const refusals = probe?.refusals.join('\n  ') ?? 'beforeAll did not get as far as trying one';
  throw new Error(`No candidate registry accepted made-up credentials:\n  ${refusals}`);
}

function removeRegistries(api: E2eApiClient): CleanupStep[] {
  return registryNames.map((name): CleanupStep => [
    `delete registry "${name}"`,
    () => ensureRegistryAbsent(api, name),
  ]);
}

test.beforeAll(async ({ api, appsPool }) => {
  appsOnSomebodyElsesPool = !(await appsPool.ensure());
  if (appsOnSomebodyElsesPool) {
    return;
  }

  // Docker has to be running for any `app.registry.*` call, which it is once Apps has a pool.
  probe = await findRegistryAcceptingAnyLogin(api, probeName);
});

test.beforeEach(async ({ api }) => {
  // Apps on another pool is a developer's own setup, which moving Apps onto `e2e_apps` would stop.
  test.skip(appsOnSomebodyElsesPool, 'Apps already use a pool the suite did not create.');

  await runCleanupSteps(removeRegistries(api));
});

test.afterEach(async ({ api }) => {
  if (appsOnSomebodyElsesPool || leavingTestData(`registries ${registryNames.join(', ')}`)) {
    return;
  }

  await runCleanupSteps(removeRegistries(api));
});

test.afterAll(async ({ api }) => {
  if (appsOnSomebodyElsesPool || leavingTestData(`registries ${registryNames.join(', ')}`)) {
    return;
  }

  // The registries need Docker, which stays up on the shared pool.
  await runCleanupSteps(removeRegistries(api));
});

test('an admin adds a registry, and it is listed under the URI middleware stored', async ({ page, api }) => {
  const uri = registryUri();
  // Middleware adds the slash to an http URI that has none, and the row shows what it stored.
  const storedUri = `${uri}/`;
  const row = dockerRegistriesLocators.registry(storedUri, registryName);

  await goToApps(page);
  await goToDockerRegistries(page);
  await addRegistry(page, uri, registryName);

  expect(await findRegistry(api, registryName)).toMatchObject({ name: registryName, uri: storedUri });

  await expect(page.locator(row.row)).toBeVisible();
  await expect(page.locator(row.name)).toHaveText(registryName);
  await expect(page.locator(row.uri)).toHaveText(storedUri);
});

test('an admin renames a registry from its row, and the same registry has the new name', async ({ page, api }) => {
  const seeded = await seedRegistry(api, registryName, registryUri());
  const before = dockerRegistriesLocators.registry(seeded.uri, registryName);
  const after = dockerRegistriesLocators.registry(seeded.uri, renamedRegistryName);

  await goToApps(page);
  await goToDockerRegistries(page);
  // The starting state the rename has to change.
  await expect(page.locator(before.row)).toBeVisible();

  await page.locator(before.edit).click();
  // Editing keeps the URI field: the Docker Hub / Other Registry choice is only offered when adding.
  await expect(page.locator(dockerRegistryFormLocators.uri)).toHaveValue(seeded.uri);
  await expect(page.locator(dockerRegistryFormLocators.registry)).toHaveCount(0);

  // Username and Password are left as the form fills them, which is the masked value the query
  // returns: what a user who does not know the credentials would do.
  await page.locator(dockerRegistryFormLocators.name).fill(renamedRegistryName);
  await saveRegistry(page);

  expect(await findRegistry(api, renamedRegistryName)).toEqual({
    id: seeded.id,
    name: renamedRegistryName,
    uri: seeded.uri,
  });
  expect(await findRegistry(api, registryName)).toBeUndefined();

  // The row tag holds the name, so the renamed row is a different row.
  await expect(page.locator(after.row)).toBeVisible();
  await expect(page.locator(after.name)).toHaveText(renamedRegistryName);
  await expect(page.locator(before.row)).toBeHidden();
});

test('an admin deletes a registry from its row, and it is gone', async ({ page, api }) => {
  const seeded = await seedRegistry(api, registryName, registryUri());
  const row = dockerRegistriesLocators.registry(seeded.uri, registryName);

  await goToApps(page);
  await goToDockerRegistries(page);
  // The starting state the delete has to change.
  await expect(page.locator(row.row)).toBeVisible();

  await deleteRegistry(page, seeded.uri, registryName);

  await expect(page.locator(row.row)).toBeHidden();
  await expect.poll(
    () => findRegistry(api, registryName),
    { message: `registry "${registryName}" should be deleted` },
  ).toBeUndefined();
});

test('the registry form refuses a URI that is not a URL, and nothing is stored', async ({ page, api }) => {
  await goToApps(page);
  await goToDockerRegistries(page);
  await openOtherRegistryForm(page);

  const uriField = page.locator(dockerRegistryFormLocators.uriField);
  const save = page.locator(dockerRegistryFormLocators.save);

  await page.locator(dockerRegistryFormLocators.name).fill(refusedName);
  await page.locator(dockerRegistryFormLocators.username).fill(madeUpCredentials.username);
  await page.locator(dockerRegistryFormLocators.password).fill(madeUpCredentials.password);
  // The URI is required, so an empty one disables Save as well. Start from a URI the pattern accepts:
  // then the only change below is the scheme, and that is what disables Save and shows the message.
  await page.locator(dockerRegistryFormLocators.uri).fill(wellFormedUri);
  await page.locator(dockerRegistryFormLocators.uri).blur();
  await expect(save).toBeEnabled();
  await expect(uriField).not.toContainText(patternMessage);

  await page.locator(dockerRegistryFormLocators.uri).fill(schemelessUri);
  // Validated on blur, not as it is typed.
  await page.locator(dockerRegistryFormLocators.uri).blur();

  await expect(uriField).toContainText(patternMessage);
  await expect(save).toBeDisabled();
  expect(await findRegistry(api, refusedName)).toBeUndefined();
});
