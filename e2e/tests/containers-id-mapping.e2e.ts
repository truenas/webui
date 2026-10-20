/**
 * Stories: an admin maps host users and groups into containers from the
 * Containers page's Map User/Group IDs dialog — a user to the same UID, a group
 * to a GID of its own — clears one, and is refused an account that does not
 * exist.
 *
 * Each is asserted on the account's row in the dialog and through `user.query`
 * or `group.query`. Every assertion is scoped to an account this spec made:
 * what else the dialog lists depends on the appliance, so the table is never
 * counted or expected to be empty.
 *
 * Middleware refuses a mapping on a builtin account or on one in a group that
 * holds roles, so the accounts here are plain ones with neither. No container,
 * image or pool is needed: the dialog reads and writes users and groups only.
 */
import {
  ensureGroupAbsent, ensureGroupPresent, findGroup, setGroupIdmap,
} from '../fixtures/groups';
import {
  ensureUserAbsent, ensureUserPresent, findUser, setUserIdmap,
} from '../fixtures/users';
import {
  closeIdMappingDialog, openIdMappingDialog, pickIdMappingAccount, showIdMappings, waitForIdMappings,
} from '../flows/containers';
import { containersLocators } from '../locators/containers';
import { errorDialogLocators } from '../locators/dialogs';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { errorDialogClose } from '../support/constants';
import { expect, test } from '../support/fixtures';
import { slowCallTimeoutMs } from '../support/timeouts';

const dialog = containersLocators.idMapping;

/** Made with `group_create`, so it comes with a primary group of the same name. */
const user = 'e2e_idmap_user';

/** A group of its own, apart from the user's primary group. */
const group = 'e2e_idmap_group';

/** A name no account holds, for the refusal. */
const missingUser = 'e2e_idmap_missing';

/** Inside `ContainerXID`, which middleware bounds at 1 to 2^32 - 2. */
const containerGid = 3001;

/**
 * Mappings off before the accounts go, then the user, then both groups by name:
 * the user's primary group in case `user.delete` left it behind.
 */
async function cleanUp(api: E2eApiClient): Promise<void> {
  await runCleanupSteps([
    [`clear the mapping of user "${user}"`, async () => {
      if (await findUser(api, user)) {
        await setUserIdmap(api, user, null);
      }
    }],
    ...[user, group].map((name): [string, () => Promise<void>] => [
      `clear the mapping of group "${name}"`, async () => {
        if (await findGroup(api, name)) {
          await setGroupIdmap(api, name, null);
        }
      },
    ]),
    [`delete the user "${user}"`, () => ensureUserAbsent(api, user)],
    ...[group, user].map((name): [string, () => Promise<void>] => [
      `delete the group "${name}"`, () => ensureGroupAbsent(api, name),
    ]),
  ]);
}

test.beforeEach(async ({ api }) => {
  await cleanUp(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`user "${user}" and groups "${user}", "${group}"`)) {
    return;
  }
  await cleanUp(api);
});

test('an admin maps a user to the same UID in containers', async ({ page, api }) => {
  await ensureUserPresent(api, user);
  const seeded = await findUser(api, user);
  expect(seeded?.userns_idmap, 'the seeded user already has a mapping').toBeNull();

  await openIdMappingDialog(page);
  await expect(page.locator(dialog.row(user))).toBeHidden();

  await pickIdMappingAccount(page, user);
  await expect(page.locator(dialog.mapDirectly)).toBeChecked();
  await page.locator(dialog.set).click();

  await expect(page.locator(dialog.row(user))).toBeVisible({ timeout: slowCallTimeoutMs });
  await expect(page.locator(dialog.hostUid(user))).toHaveText(String(seeded?.uid));
  await expect(page.locator(dialog.containerId(user))).toHaveText('Same');

  expect(await findUser(api, user)).toMatchObject({ userns_idmap: 'DIRECT' });

  await closeIdMappingDialog(page);
});

test('an admin maps a group to a specific GID in containers', async ({ page, api }) => {
  await ensureGroupPresent(api, group);
  const seeded = await findGroup(api, group);
  expect(seeded?.userns_idmap, 'the seeded group already has a mapping').toBeNull();

  await openIdMappingDialog(page);
  await showIdMappings(page, 'groups');
  await expect(page.locator(dialog.row(group))).toBeHidden();

  await pickIdMappingAccount(page, group);
  await page.locator(dialog.mapDirectly).uncheck();
  // The container GID becomes required as the box is unticked.
  await expect(page.locator(dialog.set)).toBeDisabled();
  await page.locator(dialog.containerIdInput).fill(String(containerGid));
  await expect(page.locator(dialog.set)).toBeEnabled();
  await page.locator(dialog.set).click();

  await expect(page.locator(dialog.row(group))).toBeVisible({ timeout: slowCallTimeoutMs });
  await expect(page.locator(dialog.hostGid(group))).toHaveText(String(seeded?.gid));
  await expect(page.locator(dialog.containerId(group))).toHaveText(String(containerGid));

  expect(await findGroup(api, group)).toMatchObject({ userns_idmap: containerGid });

  await closeIdMappingDialog(page);
});

test('clearing a group\'s mapping clears that group only, not the user of the same name', async ({ page, api }) => {
  await ensureUserPresent(api, user);
  const primaryGroup = await findGroup(api, user);
  expect(primaryGroup, `user.create with group_create made no group named "${user}"`).toBeDefined();
  // Setup, not the action under test: the dialog's Set is covered above.
  await setUserIdmap(api, user, 'DIRECT');
  await setGroupIdmap(api, user, containerGid);

  await openIdMappingDialog(page);
  await showIdMappings(page, 'groups');
  await expect(page.locator(dialog.containerId(user))).toHaveText(String(containerGid));

  await page.locator(dialog.clear(user)).click();

  // The row goes as the reload after the clear starts. Asserted again once that
  // reload is done, since the first could have held of the spinner alone.
  await expect(page.locator(dialog.row(user))).toBeHidden({ timeout: slowCallTimeoutMs });
  await waitForIdMappings(page);
  await expect(page.locator(dialog.row(user))).toBeHidden();

  await showIdMappings(page, 'users');
  await expect(page.locator(dialog.containerId(user))).toHaveText('Same');

  expect(await findGroup(api, user)).toMatchObject({ id: primaryGroup?.id, userns_idmap: null });
  expect(await findUser(api, user)).toMatchObject({ userns_idmap: 'DIRECT' });

  await closeIdMappingDialog(page);
});

test('the dialog refuses a user that does not exist, and writes nothing', async ({ page, api }) => {
  expect(await findUser(api, missingUser), `an account named "${missingUser}" exists`).toBeUndefined();

  await openIdMappingDialog(page);

  // The picker does not check that a typed name exists (`validateExistence` is
  // off), so leaving the field commits the name and Set enables on it.
  const account = page.locator(dialog.account);
  await account.fill(missingUser);
  await account.blur();
  await expect(page.locator(dialog.set)).toBeEnabled();
  await page.locator(dialog.set).click();

  await expect(page.locator(errorDialogLocators.message)).toContainText('User not found', {
    timeout: slowCallTimeoutMs,
  });
  await page.locator(errorDialogClose).click();
  await expect(page.locator(errorDialogLocators.title)).toBeHidden();

  // A backstop: with no account by that name there is nothing Set could have
  // written to. The refusal above is the claim.
  expect(await findUser(api, missingUser)).toBeUndefined();

  await closeIdMappingDialog(page);
});
