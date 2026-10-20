/**
 * Stories: the full Tunable list, reached from the title of the card on
 * System > Advanced Settings.
 *
 * The list has a search the card does not, and its Delete runs `tunable.delete`
 * as a job behind a progress dialog with no first-time warning. Its rows carry
 * the card's ids — see `locators/tunable.ts`.
 *
 * The search turns the `_` in a variable into a space before matching, so the
 * query here is `keepalive intvl`: `tcp_keepalive_intvl` would match nothing.
 *
 * The variables are the ones `sysctl-tunables.e2e.ts` uses, a step below their
 * kernel defaults. That spec's cleanup removes them by name too, which is only
 * safe while `workers: 1` keeps the two files apart.
 */
import { ensureTunableAbsent, ensureTunablePresent, findTunable } from '../fixtures/tunable';
import { openAdvancedSettingsList } from '../flows/advanced-settings';
import { confirmTaskDelete, searchTaskList } from '../flows/data-protection';
import { tunableLocators } from '../locators/tunable';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Default 75. */
const targetVariable = 'net.ipv4.tcp_keepalive_intvl';

/** Default 60. */
const bystanderVariable = 'net.ipv4.tcp_fin_timeout';
const bystanderValue = '59';

const allVariables = [targetVariable, bystanderVariable];

test.beforeEach(async ({ api }) => {
  for (const variable of allVariables) {
    await ensureTunableAbsent(api, variable);
  }
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the tunables for ${allVariables.join(', ')}`)) {
    return;
  }

  await runCleanupSteps(allVariables.map((variable): [string, () => Promise<void>] => [
    `remove the tunable for ${variable}`, () => ensureTunableAbsent(api, variable),
  ]));
});

test('the Tunable card title opens the full list, where search narrows to one variable and Delete removes only that one', async ({
  page,
  api,
}) => {
  await ensureTunablePresent(api, { variable: targetVariable, value: '74', comment: 'Tunable page target' });
  await ensureTunablePresent(api, {
    variable: bystanderVariable, value: bystanderValue, comment: 'Tunable page bystander',
  });

  const { card } = tunableLocators;
  await openAdvancedSettingsList(page, {
    link: card.title,
    route: /\/system\/tunable\/?$/,
    arrived: tunableLocators.list.add,
  });

  await expect(page.locator(card.row(targetVariable))).toBeVisible();
  await expect(page.locator(card.row(bystanderVariable))).toBeVisible();

  await searchTaskList(page, 'keepalive intvl');
  await expect(page.locator(card.row(targetVariable))).toBeVisible();
  await expect(page.locator(card.row(bystanderVariable))).toBeHidden();

  await page.locator(card.rowMenu(targetVariable)).click();
  await page.locator(card.rowMenuDelete(targetVariable)).click();
  // The row goes only once the delete job has finished and the list has reloaded.
  await confirmTaskDelete(page, card.row(targetVariable));

  await expect.poll(() => findTunable(api, targetVariable)).toBeUndefined();
  expect(await findTunable(api, bystanderVariable)).toMatchObject({ value: bystanderValue });
});
