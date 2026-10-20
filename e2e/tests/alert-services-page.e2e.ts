/**
 * Stories: the standalone Alert Services page at `/system/alert-settings/services`,
 * which nothing in the app links to — a user reaches it only through global
 * search in the topbar.
 *
 * It is the same list `alert-services.e2e.ts` drives on System > Alert Settings,
 * without the Alert Settings category form beside it. What neither route had
 * covered is the list's search, which matches the name and the level.
 */
import { ensureAlertServiceAbsent, ensureSlackAlertServicePresent, findAlertService } from '../fixtures/alert-services';
import { confirmTaskDelete, searchTaskList } from '../flows/data-protection';
import { goToViaGlobalSearch } from '../flows/navigation';
import { alertClassLocators } from '../locators/alert-classes';
import { alertServiceLocators } from '../locators/alert-services';
import { globalSearchLocators } from '../locators/navigation';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const target = { name: 'e2e-alert-page-target', url: 'https://hooks.example.com/e2e/page-target' };
const bystander = { name: 'e2e-alert-page-bystander', url: 'https://hooks.example.com/e2e/page-bystander' };

const allNames = [target.name, bystander.name];

test.beforeEach(async ({ api }) => {
  for (const name of allNames) {
    await ensureAlertServiceAbsent(api, name);
  }
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the alert services ${allNames.join(', ')}`)) {
    return;
  }

  await runCleanupSteps(allNames.map((name): [string, () => Promise<void>] => [
    `remove the alert service ${name}`, () => ensureAlertServiceAbsent(api, name),
  ]));
});

test('global search opens the standalone Alert Services page, where search narrows by name and Delete removes the service that was picked', async ({
  page,
  api,
}) => {
  await ensureSlackAlertServicePresent(api, target);
  await ensureSlackAlertServicePresent(api, bystander);

  const { list } = alertServiceLocators;
  await goToViaGlobalSearch(
    page,
    'Alert Services',
    globalSearchLocators.result(['System', 'Alert Settings', 'Alert Services']),
    /\/system\/alert-settings\/services\/?$/,
  );

  await expect(page.locator(list.row(target.name))).toBeVisible();
  await expect(page.locator(list.row(bystander.name))).toBeVisible();
  // Checked once the rows are in: this route is the list without the category form.
  await expect(page.locator(alertClassLocators.save)).toBeHidden();

  await searchTaskList(page, 'alert-page-target');
  await expect(page.locator(list.row(target.name))).toBeVisible();
  await expect(page.locator(list.row(bystander.name))).toBeHidden();

  await page.locator(list.delete(target.name)).click();
  await confirmTaskDelete(page, list.row(target.name));

  expect(await findAlertService(api, target.name)).toBeUndefined();
  expect(await findAlertService(api, bystander.name)).toBeDefined();
});
