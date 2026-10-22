/**
 * Story: the built-in sharing administrator starts and stops FTP from System >
 * Services and edits a dataset, while SSH, deleting the dataset, adding a user or
 * a periodic snapshot task, and the power menu stay locked to them.
 *
 * What `SHARING_ADMIN` grants and withholds outside the share cards, which
 * `roles-share-admin-shares.e2e.ts` covers. A service row is gated on the roles
 * that manage that service: FTP's take `SHARING_FTP_WRITE`, which this account
 * holds, and SSH's take only `SERVICE_WRITE`, which it does not. The dataset card
 * renders Edit on `DATASET_WRITE` and Delete on `DATASET_DELETE`, and the account
 * holds the first and not the second, so Delete is not rendered at all.
 *
 * Users, Periodic Snapshot Tasks and the power menu are the controls the
 * read-only specs lock. Checking a few of them here is what says the account is
 * not being treated as a full admin.
 *
 * Two tests, so the account signs in twice: every sign-in spends from the
 * unauthenticated rate limit (see `flows/roles.ts`). Nothing locked is ever
 * clicked. FTP is stopped first, so the start is the UI's doing, and goes back to
 * how the spec found it afterwards. SSH is only read.
 */
import {
  ensureRoleAdminAbsent, ensureRoleAdminPresent, roleAdmins,
} from '../fixtures/role-admins';
import {
  ensureServiceStopped, queryService, restoreService, type ServiceState,
} from '../fixtures/services';
import { ensureDatasetAbsent, ensureDatasetPresent, findDataset } from '../fixtures/storage';
import { findUser } from '../fixtures/users';
import { goToDataProtection, goToDatasets, goToServices, goToUsers } from '../flows/navigation';
import {
  expectHiddenByRole, expectLockedByRole, expectUnlockedByRole, signInAsRoleAdmin,
} from '../flows/roles';
import { serviceChangeTimeoutMs, startServiceFromList, stopServiceFromList } from '../flows/services';
import { openEditDatasetForm, saveDatasetForm } from '../flows/storage';
import { servicesLocators } from '../locators/services';
import { snapshotTaskLocators } from '../locators/snapshot-tasks';
import {
  datasetDetailsLocators, datasetLocators, deleteDatasetDialogLocators, zvolLocators,
} from '../locators/storage';
import { topbarLocators } from '../locators/topbar';
import { usersLocators } from '../locators/users';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const account = roleAdmins.sharing;

const datasetLeaf = 'e2e_sa_ds';
const editedComment = 'edited by share admin';

/** The lists, the tree and the services each load on their own API calls, after the shell. */
const pageSettleTimeoutMs = 60_000;

const ftpLeftChanged = 'FTP left as the test changed it. The next run would find a different row and dialog.';

test.describe('as a sharing administrator', () => {
  test.use({ authenticate: false });

  /** FTP as this test found it, before it was stopped, so the teardown can put it back. */
  let foundFtp: ServiceState | undefined;

  // The account is created once for the file: no test here changes it, and each one costs
  // middleware about a second to create and another to delete. A failed test restarts the
  // worker, which runs afterAll and then beforeAll again, so a retry still starts clean.
  test.beforeAll(async ({ api }) => {
    await ensureRoleAdminAbsent(api, account);
    await ensureRoleAdminPresent(api, account);
  });

  test.afterAll(async ({ api }) => {
    if (leavingTestData(`user "${account.username}"`)) {
      return;
    }

    await runCleanupSteps([
      [`remove user ${account.username}`, () => ensureRoleAdminAbsent(api, account)],
    ]);
  });

  test.beforeEach(async ({ api, pool }) => {
    const dataset = `${pool}/${datasetLeaf}`;

    foundFtp = await queryService(api, 'ftp');
    if (!foundFtp) {
      throw new Error('service.query returned no ftp row, so there is no service to start.');
    }

    await ensureServiceStopped(api, 'ftp', ftpLeftChanged);
    // Absent first, so a comment left by an earlier run cannot already match the edit.
    await ensureDatasetAbsent(api, dataset);
    await ensureDatasetPresent(api, dataset);
  });

  test.afterEach(async ({ api, pool }) => {
    const dataset = `${pool}/${datasetLeaf}`;
    if (leavingTestData(`dataset "${dataset}" and FTP as the test left it`)) {
      return;
    }

    const ftp = foundFtp;
    await runCleanupSteps([
      ['restore the FTP service', async () => {
        if (ftp) {
          await restoreService(api, 'ftp', ftp, ftpLeftChanged);
        }
      }],
      [`remove dataset ${dataset}`, () => ensureDatasetAbsent(api, dataset)],
    ]);
  });

  test('FTP can be started and stopped from its row, and SSH stays locked', async ({ page, api }) => {
    const sshBefore = await queryService(api, 'ssh');
    if (!sshBefore) {
      throw new Error('service.query returned no ssh row, so there is no service to check.');
    }
    const { row } = servicesLocators;

    await signInAsRoleAdmin(page, account);
    await goToServices(page);
    await expect(page.locator(row.status('ftp'))).toContainText('Stopped', { timeout: pageSettleTimeoutMs });

    await test.step('FTP starts and stops', async () => {
      await expectUnlockedByRole(page, row.start('ftp'));
      await startServiceFromList(page, 'ftp');

      await expect
        .poll(async () => (await queryService(api, 'ftp'))?.state, { timeout: serviceChangeTimeoutMs })
        .toBe('RUNNING');
      // Waited for before the stop, and not only as an assertion: the row renders the
      // stop button only once it holds the new state.
      await expect(page.locator(row.status('ftp'))).toContainText('Running', { timeout: serviceChangeTimeoutMs });

      await stopServiceFromList(page, 'ftp');

      await expect
        .poll(async () => (await queryService(api, 'ftp'))?.state, { timeout: serviceChangeTimeoutMs })
        .toBe('STOPPED');
      await expect(page.locator(row.status('ftp'))).toContainText('Stopped', { timeout: serviceChangeTimeoutMs });
    });

    await test.step('SSH\'s Start/Stop, Edit and Start Automatically are locked', async () => {
      const isRunning = sshBefore.state === 'RUNNING';
      await expect(page.locator(row.status('ssh'))).toContainText(isRunning ? 'Running' : 'Stopped');

      // The cell renders Stop while the service runs and Start while it does not.
      await expectLockedByRole(page, isRunning ? row.stop('ssh') : row.start('ssh'));
      await expectLockedByRole(page, row.edit('ssh'));
      await expectLockedByRole(page, row.startAutomaticallyInput('ssh'));

      const sshAfter = await queryService(api, 'ssh');
      expect({ state: sshAfter?.state, enable: sshAfter?.enable })
        .toEqual({ state: sshBefore.state, enable: sshBefore.enable });
    });
  });

  test('a dataset can be edited and not deleted, and non-sharing writes stay locked', async ({ page, api, pool }) => {
    const dataset = `${pool}/${datasetLeaf}`;

    await signInAsRoleAdmin(page, account);

    await test.step('the dataset card offers Edit and not Delete, and adding is unlocked', async () => {
      await goToDatasets(page);
      const node = page.locator(datasetLocators.treeNode(dataset));
      await expect(node).toBeVisible({ timeout: pageSettleTimeoutMs });
      await node.click();
      await expect(page.locator(datasetDetailsLocators.path)).toHaveText(dataset);

      // Edit and Delete both start hidden until the session's roles are known, so
      // Delete is checked only once Edit, which this account holds, has rendered.
      await expectHiddenByRole(page, datasetLocators.editDataset, deleteDatasetDialogLocators.open);
      await expectUnlockedByRole(page, datasetLocators.addDataset);
      await expectUnlockedByRole(page, zvolLocators.add);
    });

    await test.step('the dataset\'s comment is edited, and the appliance holds it', async () => {
      await openEditDatasetForm(page, dataset);
      await page.locator(datasetLocators.comments).fill(editedComment);
      await saveDatasetForm(page);

      // The card belongs to the dataset the tree has selected, and it reloads after the save.
      await expect(page.locator(datasetDetailsLocators.comments)).toHaveText(editedComment);
      expect(await findDataset(api, dataset)).toMatchObject({
        user_properties: { comments: { value: editedComment, source: 'LOCAL' } },
      });
    });

    await test.step('Add User is locked', async () => {
      await goToUsers(page);
      await expect(page.locator(usersLocators.addUser)).toBeVisible({ timeout: pageSettleTimeoutMs });
      await expectLockedByRole(page, usersLocators.addUser);
    });

    await test.step('adding a periodic snapshot task is locked', async () => {
      await goToDataProtection(page);
      await expect(page.locator(snapshotTaskLocators.card.add)).toBeVisible({ timeout: pageSettleTimeoutMs });
      await expectLockedByRole(page, snapshotTaskLocators.card.add);
    });

    await test.step('Restart and Shut Down are locked in the power menu', async () => {
      await page.locator(topbarLocators.powerMenu).click();

      await expect(page.locator(topbarLocators.restart)).toBeVisible();
      await expect(page.locator(topbarLocators.restart)).toBeDisabled();
      await expect(page.locator(topbarLocators.shutDown)).toBeVisible();
      await expect(page.locator(topbarLocators.shutDown)).toBeDisabled();

      await page.keyboard.press('Escape');
      await expect(page.locator(topbarLocators.restart)).toBeHidden();
    });

    const roles = (await findUser(api, account.username))?.roles;
    expect(roles).toContain('SHARING_ADMIN');
    expect(roles).not.toContain('FULL_ADMIN');
  });
});
