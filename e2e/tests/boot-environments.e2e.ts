/**
 * Stories: an admin clones a boot environment, marks one to be kept, and deletes
 * one, from System > Boot, and the appliance holds what they did.
 *
 * Each action is asserted twice, the way the share specs do it: the list says the
 * screen believed it, `boot.environment.query` says the appliance did it.
 *
 * Keep and delete each run beside a second boot environment that must come
 * through untouched: a row's actions belong to whichever row was clicked, and a
 * row-targeting bug changes the wrong boot environment without failing anything
 * else.
 *
 * Every boot environment here is a clone of the running one, so none of them is
 * running or set to boot next, and nothing the suite does changes what the
 * appliance boots into.
 */
import {
  ensureBootEnvironmentAbsent,
  ensureBootEnvironmentPresent,
  findBootEnvironment,
  findRunningBootEnvironment,
} from '../fixtures/boot-environments';
import {
  deleteBootEnvironment, keepBootEnvironment, openCloneForm, saveCloneForm,
} from '../flows/boot-environments';
import { bootEnvironmentLocators } from '../locators/boot-environments';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const { list, cloneForm } = bootEnvironmentLocators;

/** Created through the form, never over the API — that is the thing under test. */
const clonedName = 'e2e-bootenv-clone';

/** Provisioned over the API so there is something to keep or delete. */
const targetName = 'e2e-bootenv-target';

/** The boot environment that must survive whatever is done to the target. */
const bystanderName = 'e2e-bootenv-bystander';

const allNames = [clonedName, targetName, bystanderName];

/** Both over the API: acting on one from the list is the thing under test. */
async function seedTargetAndBystander(api: E2eApiClient): Promise<void> {
  await ensureBootEnvironmentPresent(api, targetName);
  await ensureBootEnvironmentPresent(api, bystanderName);
}

/**
 * Removed before each test as well as after, so an interrupted run leaves the
 * next one able to start, and unconditionally so a failure still cleans up.
 */
test.beforeEach(async ({ api }) => {
  for (const name of allNames) {
    await ensureBootEnvironmentAbsent(api, name);
  }
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the boot environments ${allNames.join(', ')}`)) {
    return;
  }

  await runCleanupSteps(allNames.map((name): [string, () => Promise<void>] => [
    `remove the boot environment ${name}`, () => ensureBootEnvironmentAbsent(api, name),
  ]));
});

test('an admin clones the running boot environment, and the appliance has the clone', async ({ page, api }) => {
  const running = await findRunningBootEnvironment(api);

  await openCloneForm(page, running.id);
  await page.locator(cloneForm.target).fill(clonedName);
  await saveCloneForm(page);

  await expect(page.locator(list.row(clonedName))).toBeVisible();
  await expect(page.locator(list.keep(clonedName))).toHaveText('No');

  expect(await findBootEnvironment(api, clonedName)).toMatchObject({
    id: clonedName,
    // A clone is not booted into until someone activates it.
    active: false,
    activated: false,
    keep: false,
  });

  // The source is left as it was: still the one running, and still the one booting next.
  expect(await findBootEnvironment(api, running.id)).toMatchObject({
    active: running.active,
    activated: running.activated,
  });
});

test('marking a boot environment to be kept sets the flag on the one that was picked', async ({ page, api }) => {
  await seedTargetAndBystander(api);

  await keepBootEnvironment(page, targetName);

  expect(await findBootEnvironment(api, targetName)).toMatchObject({ keep: true });

  // The whole point of the second boot environment: the target's row looks right either way.
  await expect(page.locator(list.keep(bystanderName))).toHaveText('No');
  expect(await findBootEnvironment(api, bystanderName)).toMatchObject({ keep: false });
});

test('deleting a boot environment from the list removes the one that was picked', async ({ page, api }) => {
  await seedTargetAndBystander(api);

  await deleteBootEnvironment(page, targetName);

  // Polled rather than read once: the list reloads after the job, but a row can
  // also be hidden while the table is between loads, which proves nothing.
  await expect.poll(() => findBootEnvironment(api, targetName)).toBeUndefined();

  await expect(page.locator(list.row(bystanderName))).toBeVisible();
  expect(await findBootEnvironment(api, bystanderName)).toBeDefined();
});
