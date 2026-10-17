/**
 * Story: a read-only administrator opens System > Services and System > Boot,
 * sees every service's state and the boot environments, and finds every control
 * that would change them locked, while SSH and the boot environments stay as
 * they were.
 *
 * Each service row is gated on the roles that manage that service, and the
 * read-only admin holds none of them, so SSH stands for the page. The boot
 * environment list's row actions and its Stats/Settings and Scrub Boot Pool
 * buttons need `BOOTENV_WRITE`; Boot Pool Status does not, and is opened.
 *
 * Only the running boot environment is used, and the list never renders Delete
 * on that one for any account, so Delete is not asserted: seeing it locked would
 * take a second boot environment, which is out of proportion to one button.
 *
 * One sign-in for both pages, as steps: every sign-in spends from the
 * unauthenticated rate limit. Nothing locked is ever clicked. SSH's state and the
 * set of boot environments are read back over the API as a guard that nothing
 * got through.
 */
import {
  findBootDevice, findRunningBootEnvironment, listBootEnvironmentNames,
} from '../fixtures/boot-environments';
import {
  ensureRoleAdminAbsent, ensureRoleAdminPresent, roleAdmins,
} from '../fixtures/role-admins';
import { queryService } from '../fixtures/services';
import { goToBootEnvironments, goToServices } from '../flows/navigation';
import { expectLockedByRole, signInAsRoleAdmin } from '../flows/roles';
import { bootEnvironmentLocators } from '../locators/boot-environments';
import { servicesLocators } from '../locators/services';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const account = roleAdmins.readOnly;

/** Both lists and the boot pool's tree load on their own API calls, after the shell. */
const pageSettleTimeoutMs = 60_000;

test.describe('as a read-only administrator', () => {
  test.use({ authenticate: false });

  test.beforeEach(async ({ api }) => {
    await ensureRoleAdminAbsent(api, account);
    await ensureRoleAdminPresent(api, account);
  });

  test.afterEach(async ({ api }) => {
    if (leavingTestData(`user "${account.username}"`)) {
      return;
    }

    await runCleanupSteps([
      [`remove user ${account.username}`, () => ensureRoleAdminAbsent(api, account)],
    ]);
  });

  test('services and boot environments can be seen and not changed', async ({ page, api }) => {
    const sshBefore = await queryService(api, 'ssh');
    if (!sshBefore) {
      throw new Error('service.query returned no ssh row, so there is no service to check.');
    }
    const bootEnvironmentsBefore = await listBootEnvironmentNames(api);
    const running = await findRunningBootEnvironment(api);
    const bootDevice = await findBootDevice(api);

    await signInAsRoleAdmin(page, account);

    await test.step('SSH shows its state, and Start/Stop, Edit and Start Automatically are locked', async () => {
      const { row } = servicesLocators;
      const isRunning = sshBefore.state === 'RUNNING';

      await goToServices(page);
      await expect(page.locator(row.status('ssh')))
        .toContainText(isRunning ? 'Running' : 'Stopped', { timeout: pageSettleTimeoutMs });

      // The cell renders Stop while the service runs and Start while it does not.
      await expectLockedByRole(page, isRunning ? row.stop('ssh') : row.start('ssh'));
      await expectLockedByRole(page, row.edit('ssh'));
      await expectLockedByRole(page, row.startAutomaticallyInput('ssh'));

      const sshAfter = await queryService(api, 'ssh');
      expect({ state: sshAfter?.state, enable: sshAfter?.enable })
        .toEqual({ state: sshBefore.state, enable: sshBefore.enable });
    });

    await test.step('the boot environment\'s actions are locked, and Boot Pool Status opens', async () => {
      const { header, list, status } = bootEnvironmentLocators;

      await goToBootEnvironments(page);
      await expect(page.locator(list.row(running.id))).toBeVisible({ timeout: pageSettleTimeoutMs });

      await expectLockedByRole(page, list.clone(running.id));
      // Keep and Unkeep are one setting, and the row shows whichever applies.
      await expectLockedByRole(page, running.keep ? list.unkeepAction(running.id) : list.keepAction(running.id));
      await expectLockedByRole(page, header.scrub);
      await expectLockedByRole(page, header.stats);

      expect(await listBootEnvironmentNames(api)).toEqual(bootEnvironmentsBefore);

      await page.locator(header.status).click();
      await expect(page).toHaveURL(/\/system\/boot\/status$/);
      await expect(page.locator(status.deviceName(bootDevice))).toBeVisible({ timeout: pageSettleTimeoutMs });
    });
  });
});
