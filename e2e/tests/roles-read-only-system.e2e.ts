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
 * Story: the same administrator opens General Settings, Advanced Settings, Alert
 * Settings and Directory Services, finds every control that would change a
 * setting there locked, and can still open File Ticket.
 *
 * Email Settings and an alert category carry no role on the way in, so the form
 * opens and the category's selects are live. Each is changed, so that Save is
 * held down by the role rather than by a pristine form, and then dropped. The
 * Send Feedback dialog is only opened and closed: submitting it would file a real
 * ticket.
 *
 * Each test signs in once and takes its pages as steps: every sign-in spends from
 * the unauthenticated rate limit. Nothing locked is ever clicked. What each page
 * would change is read back over the API as a guard that nothing got through.
 */
import type { Page } from '@playwright/test';
import { pickAlertClasses, readAlertClassOverride, readAlertClassOverrides } from '../fixtures/alert-classes';
import { countAlertServices } from '../fixtures/alert-services';
import {
  findBootDevice, findRunningBootEnvironment, listBootEnvironmentNames,
} from '../fixtures/boot-environments';
import { countCronjobs } from '../fixtures/cron';
import { readDirectoryServices } from '../fixtures/directory-services';
import { readMailSettings } from '../fixtures/email';
import { readGeneralSettings } from '../fixtures/general-settings';
import { countNtpServers } from '../fixtures/ntp-servers';
import {
  ensureRoleAdminAbsent, ensureRoleAdminPresent, roleAdmins,
} from '../fixtures/role-admins';
import { queryService } from '../fixtures/services';
import { readSyslogSettings } from '../fixtures/syslog';
import { chooseAlertClassLevel, openAlertClass } from '../flows/alert-classes';
import { openEmailForm } from '../flows/email';
import {
  goToAdvancedSettings, goToBootEnvironments, goToDirectoryServices, goToGeneralSettings, goToServices,
} from '../flows/navigation';
import { expectLockedByRole, expectUnlockedByRole, signInAsRoleAdmin } from '../flows/roles';
import { alertClassLocators } from '../locators/alert-classes';
import { alertServiceLocators } from '../locators/alert-services';
import { bootEnvironmentLocators } from '../locators/boot-environments';
import { cronLocators } from '../locators/cron';
import { confirmDialogLocators } from '../locators/dialogs';
import { directoryServicesLocators } from '../locators/directory-services';
import { emailLocators } from '../locators/email';
import { generalSettingsLocators } from '../locators/general-settings';
import { licenseLocators } from '../locators/ha';
import { localizationLocators } from '../locators/localization';
import { ntpServerLocators } from '../locators/ntp-servers';
import { servicesLocators } from '../locators/services';
import { syslogLocators } from '../locators/syslog';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const account = roleAdmins.readOnly;

/** Both lists and the boot pool's tree load on their own API calls, after the shell. */
const pageSettleTimeoutMs = 60_000;

/**
 * Closes the Email form, answering the unsaved-changes question, so nothing is
 * saved. Waits on Save going, which is the panel closing.
 */
async function discardEmailForm(page: Page): Promise<void> {
  await page.locator(servicesLocators.closePanel).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();
  await expect(page.locator(emailLocators.form.save)).toBeHidden();
}

test.describe('as a read-only administrator', () => {
  test.use({ authenticate: false });

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

  test('system settings and directory services can be seen and not changed', async ({ page, api }) => {
    const generalBefore = await readGeneralSettings(api);
    const mailBefore = await readMailSettings(api);
    const ntpServersBefore = await countNtpServers(api);
    const cronjobsBefore = await countCronjobs(api);
    const syslogBefore = await readSyslogSettings(api);
    const alertServicesBefore = await countAlertServices(api);
    const alertClassesBefore = await readAlertClassOverrides(api);
    const { target } = await pickAlertClasses(api);
    const targetLevel = (await readAlertClassOverride(api, target.id))?.level ?? target.defaultLevel;
    const directoryBefore = (await readDirectoryServices(api)).config;

    await signInAsRoleAdmin(page, account);

    await test.step('General Settings: GUI, Localization, License and the Email form\'s Save are locked', async () => {
      await openEmailForm(page, mailBefore.port);
      await page.locator(emailLocators.form.fromName).fill('Changed by the read-only admin');
      await expectLockedByRole(page, emailLocators.form.save);
      await discardEmailForm(page);

      await expectLockedByRole(page, generalSettingsLocators.gui.settings);
      await expectLockedByRole(page, localizationLocators.card.settings);
      await expectLockedByRole(page, licenseLocators.setLicense);

      expect(await readGeneralSettings(api)).toEqual(generalBefore);
      expect(await readMailSettings(api)).toEqual(mailBefore);
    });

    await test.step('General Settings: File Ticket opens Send Feedback', async () => {
      const { feedbackDialog } = generalSettingsLocators;

      await goToGeneralSettings(page);
      await expectUnlockedByRole(page, generalSettingsLocators.support.fileTicket);
      await page.locator(generalSettingsLocators.support.fileTicket).click();
      await expect(page.locator(feedbackDialog.title)).toBeVisible();

      // Closed through the shell's own ✕; nothing in the dialog is ever submitted.
      await page.locator(feedbackDialog.close).click();
      await expect(page.locator(feedbackDialog.title)).toBeHidden();
    });

    await test.step('Advanced Settings: NTP Add, Cron Add and Syslog Configure are locked', async () => {
      await goToAdvancedSettings(page);
      await expect(page.locator(ntpServerLocators.card.add)).toBeVisible({ timeout: pageSettleTimeoutMs });

      await expectLockedByRole(page, ntpServerLocators.card.add);
      await expectLockedByRole(page, cronLocators.card.add);
      await expectLockedByRole(page, syslogLocators.card.configure);

      expect(await countNtpServers(api)).toBe(ntpServersBefore);
      expect(await countCronjobs(api)).toBe(cronjobsBefore);
      expect(await readSyslogSettings(api)).toEqual(syslogBefore);
    });

    await test.step('Alert Settings: Add Alert Service and a category\'s Save are locked', async () => {
      await openAlertClass(page, target);
      await expectLockedByRole(page, alertServiceLocators.list.add);

      // Any level but the one on show, so the form is dirty and only the role holds Save down.
      await chooseAlertClassLevel(page, target.title, targetLevel === 'CRITICAL' ? 'ERROR' : 'CRITICAL');
      await expectLockedByRole(page, alertClassLocators.save);

      expect(await countAlertServices(api)).toBe(alertServicesBefore);
      expect(await readAlertClassOverrides(api)).toEqual(alertClassesBefore);
    });

    await test.step('Directory Services: Configure is locked', async () => {
      await goToDirectoryServices(page);
      await expect(page.locator(directoryServicesLocators.disabled)).toBeVisible({ timeout: pageSettleTimeoutMs });
      await expectLockedByRole(page, directoryServicesLocators.configure);

      const directoryAfter = (await readDirectoryServices(api)).config;
      expect({ enable: directoryAfter.enable, service_type: directoryAfter.service_type })
        .toEqual({ enable: directoryBefore.enable, service_type: directoryBefore.service_type });
    });
  });
});
