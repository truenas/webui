/**
 * Stories: an admin changes the replication tasks limit from the Replication
 * card on System > Advanced Settings, and the appliance keeps what they saved.
 *
 * Each save is asserted twice, the way the other Advanced Settings specs do it:
 * the card's readout says the screen believed it, `replication.config.config`
 * says the appliance did it.
 *
 * One test starts with no limit and sets one. The other starts with a limit and
 * empties the field, which the form saves as no limit and the card shows as `–`.
 *
 * The setting is one config record, so there is nothing to delete afterwards.
 * Teardown writes back the limit the appliance held before the first test. See
 * `fixtures/replication.ts` for why that is not a fixed baseline.
 */
import {
  readReplicationTasksLimit, setReplicationTasksLimit, type ReplicationTasksLimit,
} from '../fixtures/replication';
import { openReplicationForm, saveReplicationForm } from '../flows/replication';
import { replicationLocators } from '../locators/replication';
import { leavingTestData } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** What the appliance held before this file ran, and therefore what `afterEach` writes back. */
let found: ReplicationTasksLimit | undefined;

test.beforeAll(async ({ api }) => {
  found = await readReplicationTasksLimit(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData('the replication tasks limit as the test left it')) {
    return;
  }

  // Guarded: if `beforeAll` threw, there is nothing known to write back.
  if (found !== undefined) {
    await setReplicationTasksLimit(api, found);
  }
});

test.describe('starting with no limit', () => {
  test.beforeEach(async ({ api }) => {
    await setReplicationTasksLimit(api, null);
  });

  test('an admin sets a replication tasks limit, and the appliance keeps it', async ({ page, api }) => {
    await openReplicationForm(page, '–');
    await page.locator(replicationLocators.form.tasksLimit).fill('3');
    await saveReplicationForm(page);

    await expect(page.locator(replicationLocators.card.tasksLimit)).toHaveText('3');
    expect(await readReplicationTasksLimit(api)).toBe(3);
  });
});

test.describe('starting with a limit', () => {
  test.beforeEach(async ({ api }) => {
    await setReplicationTasksLimit(api, 7);
  });

  test('an admin empties the replication tasks limit, and the appliance drops it', async ({ page, api }) => {
    await openReplicationForm(page, '7');
    await page.locator(replicationLocators.form.tasksLimit).fill('');
    await saveReplicationForm(page);

    await expect(page.locator(replicationLocators.card.tasksLimit)).toHaveText('–');
    expect(await readReplicationTasksLimit(api)).toBeNull();
  });
});
