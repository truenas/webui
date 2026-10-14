/**
 * Stories: an admin adds, edits and deletes a static route from the Static
 * Routes card on System > Network, and the appliance holds what they did.
 *
 * Each save is asserted twice: the card's row says the screen believed it,
 * `staticroute.query` says the appliance did it — and carries the description,
 * which the card does not show.
 *
 * Edit and delete each run beside a second route that must come through
 * untouched. Every row carries its own Edit and Delete buttons, so an action
 * belongs to whichever row's button was clicked, and a row-targeting bug
 * changes the wrong route without failing anything else.
 *
 * Every address is reserved for documentation — see `fixtures/static-routes.ts`.
 */
import {
  countStaticRoutes, ensureStaticRouteAbsent, ensureStaticRoutePresent, findStaticRoute,
} from '../fixtures/static-routes';
import {
  deleteStaticRoute, openAddStaticRouteForm, openEditStaticRouteForm, saveStaticRouteForm, staticRouteCardPageSize,
} from '../flows/static-routes';
import { staticRouteLocators, type StaticRouteRowKey } from '../locators/static-routes';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Created through the form, never over the API — that is the thing under test. */
const created: StaticRouteRowKey = { destination: '198.51.100.0/26', gateway: '192.0.2.21' };

/** Provisioned over the API so there is something to edit or delete. */
const target: StaticRouteRowKey = { destination: '198.51.100.64/26', gateway: '192.0.2.22' };

/** The route that must survive whatever is done to the target. */
const bystander: StaticRouteRowKey = { destination: '198.51.100.128/26', gateway: '192.0.2.23' };

const targetDescription = 'e2e static route target';
const bystanderDescription = 'e2e static route bystander';

const allDestinations = [created.destination, target.destination, bystander.destination];

/** Both routes over the API: acting on one from the card is the thing under test. */
async function seedTargetAndBystander(api: E2eApiClient): Promise<void> {
  await ensureStaticRoutePresent(api, { ...target, description: targetDescription });
  await ensureStaticRoutePresent(api, { ...bystander, description: bystanderDescription });
}

/**
 * Removed before each test as well as after, so an interrupted run leaves the
 * next one able to start, and unconditionally so a failure still cleans up.
 */
test.beforeEach(async ({ api }) => {
  for (const destination of allDestinations) {
    await ensureStaticRouteAbsent(api, destination);
  }
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the static routes to ${allDestinations.join(', ')}`)) {
    return;
  }

  await runCleanupSteps(allDestinations.map((destination): [string, () => Promise<void>] => [
    `remove the static route to ${destination}`, () => ensureStaticRouteAbsent(api, destination),
  ]));
});

test('an admin adds a static route, and the appliance really has one', async ({ page, api }) => {
  const description = 'e2e static route created';

  // The card reloads after the save with no signal the test can wait on, and
  // View All pressed in that window sizes the list by the old count, so instead
  // of expanding, this needs the new row to fit on the card. A fresh appliance
  // holds none; failing here says why rather than timing out on a hidden row.
  const existing = await countStaticRoutes(api);
  expect(
    existing < staticRouteCardPageSize,
    `the card lists ${staticRouteCardPageSize} routes before View All, and the appliance already holds ${existing}`,
  ).toBe(true);

  await openAddStaticRouteForm(page);
  await page.locator(staticRouteLocators.form.destination).fill(created.destination);
  await page.locator(staticRouteLocators.form.gateway).fill(created.gateway);
  await page.locator(staticRouteLocators.form.description).fill(description);
  await saveStaticRouteForm(page);

  // The row tag carries both addresses, so finding the row at all says the card
  // read back the ones that were typed.
  await expect(page.locator(staticRouteLocators.card.destination(created))).toHaveText(created.destination);
  await expect(page.locator(staticRouteLocators.card.gateway(created))).toHaveText(created.gateway);

  expect(await findStaticRoute(api, created.destination)).toMatchObject({
    destination: created.destination,
    gateway: created.gateway,
    description,
  });
});

test('editing a static route from the card changes the route that was picked', async ({ page, api }) => {
  await seedTargetAndBystander(api);
  const before = await findStaticRoute(api, target.destination);
  const edited: StaticRouteRowKey = { ...target, gateway: '192.0.2.32' };
  const editedDescription = 'e2e static route edited';

  await openEditStaticRouteForm(page, target, await countStaticRoutes(api));
  await page.locator(staticRouteLocators.form.gateway).fill(edited.gateway);
  await page.locator(staticRouteLocators.form.description).fill(editedDescription);
  await saveStaticRouteForm(page);

  // The gateway is in the row tag, so the edited row answers only under its new ids.
  await expect(page.locator(staticRouteLocators.card.gateway(edited))).toHaveText(edited.gateway);
  await expect(page.locator(staticRouteLocators.card.row(target))).toBeHidden();

  // The same record, by id: an update, not a delete and a create that happen to
  // leave the card looking the same.
  expect(await findStaticRoute(api, target.destination)).toMatchObject({
    id: before?.id,
    destination: target.destination,
    gateway: edited.gateway,
    description: editedDescription,
  });

  expect(await findStaticRoute(api, bystander.destination)).toMatchObject({
    gateway: bystander.gateway,
    description: bystanderDescription,
  });
});

test('deleting a static route from the card removes the route that was picked', async ({ page, api }) => {
  await seedTargetAndBystander(api);

  await deleteStaticRoute(page, target, await countStaticRoutes(api));

  // Polled rather than read once: a row can also be hidden while the table is
  // between loads, which proves nothing.
  await expect.poll(() => findStaticRoute(api, target.destination)).toBeUndefined();

  // The whole point of the second route: the card looks right either way.
  await expect(page.locator(staticRouteLocators.card.row(bystander))).toBeVisible();
  expect(await findStaticRoute(api, bystander.destination)).toMatchObject({
    gateway: bystander.gateway,
    description: bystanderDescription,
  });
});
