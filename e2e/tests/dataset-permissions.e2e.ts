/**
 * Stories: an admin changes a dataset's owner, its group and its permissions in the Unix
 * Permissions Editor, and the appliance holds what they did.
 *
 * Each story opens the editor from Edit on the dataset's Permissions card, saves, and is asserted
 * twice: on the card the app returns to, and through `filesystem.stat` on the mountpoint. Each also
 * checks that the two things it did not touch, of owner, group and mode, came through unchanged.
 *
 * The dataset is the spec's own and starts every test from one known owner, group and mode with a
 * trivial ACL, set over the API. A trivial ACL is what makes the card offer this editor at all.
 * Deleting the dataset is the teardown for all of it. The users and groups are removed once the
 * file is done.
 */
import { ensureGroupAbsent, ensureGroupPresent } from '../fixtures/groups';
import { readOwnership, setOwnership, type Ownership } from '../fixtures/permissions';
import { datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { ensureUserAbsent, ensureUserPresent } from '../fixtures/users';
import {
  chooseGroup, chooseOwner, openPermissionsEditor, savePermissions, setAccess,
} from '../flows/permissions';
import { permissionsLocators } from '../locators/permissions';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Under the shared pool. */
const datasetLeaf = 'e2e_permissions';

/**
 * Made over the API. Each user is created with a primary group of its own name, so the groups
 * here are named apart from the users. That keeps every entry on the card under a name of its own.
 */
const users = { start: 'e2e_perm_owner_start', changed: 'e2e_perm_owner_changed' };
const groups = { start: 'e2e_perm_group_start', changed: 'e2e_perm_group_changed' };

/** Where every test starts: owner rwx, group and other r-x. */
const startingPoint: Ownership = { user: users.start, group: groups.start, mode: '755' };

const card = permissionsLocators.card;

test.describe('dataset permissions', () => {
  // Users and groups are created once for the file: they only stand in for owners here, and each
  // user costs middleware about a second to create and another to delete. A failed test restarts
  // the worker, which runs `afterAll` and then this again, so a retry starts clean.
  test.beforeAll(async ({ api }) => {
    await ensureUserPresent(api, users.start);
    await ensureUserPresent(api, users.changed);
    await ensureGroupPresent(api, groups.start);
    await ensureGroupPresent(api, groups.changed);
  });

  test.afterAll(async ({ api }) => {
    const principals = [users.start, users.changed, groups.start, groups.changed].join(', ');
    if (leavingTestData(`the users and groups ${principals}`)) {
      return;
    }

    // `afterEach` has already removed the dataset, so nothing is left owned by an account that no
    // longer exists.
    await runCleanupSteps([
      [`remove the user "${users.start}"`, () => ensureUserAbsent(api, users.start)],
      [`remove the user "${users.changed}"`, () => ensureUserAbsent(api, users.changed)],
      [`remove the group "${groups.start}"`, () => ensureGroupAbsent(api, groups.start)],
      [`remove the group "${groups.changed}"`, () => ensureGroupAbsent(api, groups.changed)],
    ]);
  });

  test.beforeEach(async ({ api, pool }) => {
    const dataset = `${pool}/${datasetLeaf}`;
    await ensureDatasetAbsent(api, dataset);
    await ensureDatasetPresent(api, dataset);
    await setOwnership(api, datasetMountPath(dataset), startingPoint);
  });

  test.afterEach(async ({ api, pool }) => {
    const dataset = `${pool}/${datasetLeaf}`;
    if (leavingTestData(`the dataset "${dataset}"`)) {
      return;
    }

    await runCleanupSteps([
      [`remove the dataset "${dataset}"`, () => ensureDatasetAbsent(api, dataset)],
    ]);
  });

  test('an admin changes the owner of a dataset', async ({ page, api, pool }) => {
    const dataset = `${pool}/${datasetLeaf}`;

    await openPermissionsEditor(page, dataset);
    await chooseOwner(page, users.changed);
    await savePermissions(page, dataset);

    // The card names each entry after its owner, so this entry exists only once the new owner does.
    await expect(page.locator(card.entry(users.changed))).toHaveText('Read | Write | Execute');
    await expect(page.locator(card.entry(groups.start))).toHaveText('Read | Execute');
    expect(await readOwnership(api, datasetMountPath(dataset))).toEqual({ ...startingPoint, user: users.changed });
  });

  test('an admin changes the group of a dataset', async ({ page, api, pool }) => {
    const dataset = `${pool}/${datasetLeaf}`;

    await openPermissionsEditor(page, dataset);
    await chooseGroup(page, groups.changed);
    await savePermissions(page, dataset);

    await expect(page.locator(card.entry(groups.changed))).toHaveText('Read | Execute');
    await expect(page.locator(card.entry(users.start))).toHaveText('Read | Write | Execute');
    expect(await readOwnership(api, datasetMountPath(dataset))).toEqual({ ...startingPoint, group: groups.changed });
  });

  test('an admin changes the permissions of a dataset', async ({ page, api, pool }) => {
    const dataset = `${pool}/${datasetLeaf}`;

    // 755 to 770: the group gains Write, and other loses everything it had.
    await openPermissionsEditor(page, dataset);
    await setAccess(page, 'group', 'write', true);
    await setAccess(page, 'other', 'read', false);
    await setAccess(page, 'other', 'execute', false);
    await savePermissions(page, dataset);

    // Both differ from what the card showed before the save, so neither can pass on a stale card.
    await expect(page.locator(card.entry(groups.start))).toHaveText('Read | Write | Execute');
    await expect(page.locator(card.entry('Other'))).toHaveText('None');
    await expect(page.locator(card.entry(users.start))).toHaveText('Read | Write | Execute');
    expect(await readOwnership(api, datasetMountPath(dataset))).toEqual({ ...startingPoint, mode: '770' });
  });
});
