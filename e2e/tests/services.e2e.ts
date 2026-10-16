/**
 * Stories: an admin starts and stops a service from the Services page under
 * System, sets one to start at boot, searches the list, and saves the SSH and FTP
 * settings and the iSCSI global configuration from the forms its rows open.
 *
 * Start, stop and Start Automatically use FTP. It is stopped on a stock appliance
 * and nothing the suite or CI reaches the appliance through depends on it, so
 * starting it changes nothing else a run relies on. Each state change is asserted
 * through `service.query`, and start and stop also on the row: the switch writes
 * its new state to the store before middleware answers, so only the readback shows
 * the write happened.
 *
 * The page has no readout of a service's settings, so each save is asserted
 * through `ssh.config` or `ftp.config` alone. Each test moves the fields it edits
 * away from the baseline, so a form that dropped any one of them fails.
 *
 * FTP goes back to stopped and not starting at boot, and both services' settings
 * to the baseline, before and after every test. See `fixtures/service-config.ts`.
 *
 * The iSCSI and NVMe-oF pencils open those services' global configuration rather
 * than a service form. iSCSI's listen port is saved there with the service
 * stopped, so the change restarts nothing, and written back to what the test
 * found. NVMe-oF is only opened and closed: saving it is `nvme-of.e2e.ts`'s.
 */
import {
  readIscsiGlobalSettings, restoreIscsiGlobalSettings, type IscsiGlobalSettings,
} from '../fixtures/iscsi-config';
import { readNvmeOfBaseNqn } from '../fixtures/nvme-of';
import {
  ftpBaseline, readFtpSettings, readSshSettings, setFtpSettings, setSshSettings, sshBaseline,
} from '../fixtures/service-config';
import { ensureServiceStopped, queryService } from '../fixtures/services';
import { goToServices } from '../flows/navigation';
import {
  openServiceForm, saveServiceForm, serviceChangeTimeoutMs, startServiceFromList, stopServiceFromList,
} from '../flows/services';
import { iscsiConfigLocators } from '../locators/iscsi-config';
import { nvmeOfLocators } from '../locators/nvme-of';
import { servicesLocators } from '../locators/services';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const ftpLeftRunning = 'FTP left running. The next run would find a stop button where it expects to start it.';

test.beforeEach(async ({ api }) => {
  await ensureServiceStopped(api, 'ftp', ftpLeftRunning);
  await setSshSettings(api, sshBaseline);
  await setFtpSettings(api, ftpBaseline);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData('FTP as the test left it, and the SSH and FTP settings it saved')) {
    return;
  }

  await runCleanupSteps([
    ['stop the FTP service', () => ensureServiceStopped(api, 'ftp', ftpLeftRunning)],
    ['restore the SSH settings', () => setSshSettings(api, sshBaseline)],
    ['restore the FTP settings', () => setFtpSettings(api, ftpBaseline)],
  ]);
});

test('an admin starts FTP from its row and stops it again', async ({ page, api }) => {
  await goToServices(page);
  await startServiceFromList(page, 'ftp');

  await expect
    .poll(async () => (await queryService(api, 'ftp'))?.state, { timeout: serviceChangeTimeoutMs })
    .toBe('RUNNING');
  // Waited for before the stop, and not only as an assertion: the row renders the
  // stop button only once it holds the new state.
  await expect(page.locator(servicesLocators.row.status('ftp')))
    .toContainText('Running', { timeout: serviceChangeTimeoutMs });

  // Starting is not the same as starting at boot. That is the Start
  // Automatically switch beside it, and the play button must not turn into it.
  expect((await queryService(api, 'ftp'))?.enable).toBe(false);

  await stopServiceFromList(page, 'ftp');

  await expect
    .poll(async () => (await queryService(api, 'ftp'))?.state, { timeout: serviceChangeTimeoutMs })
    .toBe('STOPPED');
  await expect(page.locator(servicesLocators.row.status('ftp')))
    .toContainText('Stopped', { timeout: serviceChangeTimeoutMs });
});

test('Start Automatically sets FTP to start at boot without starting it, and clears it', async ({ page, api }) => {
  const toggle = page.locator(servicesLocators.row.startAutomatically('ftp'));

  await goToServices(page);
  await toggle.click();

  await expect
    .poll(async () => (await queryService(api, 'ftp'))?.enable, { timeout: serviceChangeTimeoutMs })
    .toBe(true);
  // The switch is about boot, not now: the service it turned on is still stopped.
  expect((await queryService(api, 'ftp'))?.state).toBe('STOPPED');
  await expect(page.locator(servicesLocators.row.status('ftp'))).toContainText('Stopped');

  await toggle.click();

  await expect
    .poll(async () => (await queryService(api, 'ftp'))?.enable, { timeout: serviceChangeTimeoutMs })
    .toBe(false);
});

test('the search narrows the list to the services it names', async ({ page }) => {
  const { row, search } = servicesLocators;

  await goToServices(page);
  // Both on screen first, so their absence below is the filter and not a list
  // that has not drawn yet.
  await expect(page.locator(row.row('ssh'))).toBeVisible();
  await expect(page.locator(row.row('cifs'))).toBeVisible();

  await page.locator(search).fill('ftp');

  await expect(page.locator(row.row('ftp'))).toBeVisible();
  await expect(page.locator(row.row('ssh'))).toBeHidden();
  await expect(page.locator(row.row('cifs'))).toBeHidden();

  await page.locator(search).fill('');

  await expect(page.locator(row.row('ssh'))).toBeVisible();
});

test.describe('the iSCSI row', () => {
  const iscsiLeftRunning = 'iSCSI left running. The next listen port change would restart it.';
  let found: IscsiGlobalSettings | undefined;

  test.beforeEach(async ({ api }) => {
    await ensureServiceStopped(api, 'iscsitarget', iscsiLeftRunning);
  });

  test.afterEach(async ({ api }) => {
    const settings = found;
    found = undefined;
    if (leavingTestData('iSCSI and its listen port as the test left them')) {
      return;
    }

    await runCleanupSteps([
      ['stop the iSCSI service', () => ensureServiceStopped(api, 'iscsitarget', iscsiLeftRunning)],
      ['restore the iSCSI listen port', async () => {
        if (settings) {
          await restoreIscsiGlobalSettings(api, settings);
        }
      }],
    ]);
  });

  test('its pencil opens the global configuration, and a listen port saved there holds', async ({ page, api }) => {
    const form = iscsiConfigLocators.globalConfigurationForm;
    found = await readIscsiGlobalSettings(api);
    // A run whose teardown never ran can leave the port on 3261, where saving it
    // again would prove nothing.
    const listenPort = found.listen_port === 3261 ? 3262 : 3261;

    await openServiceForm(page, 'iscsitarget', form.basename, found.basename);
    await page.locator(form.listenPort).fill(String(listenPort));
    await saveServiceForm(page);

    // Everything else the form sent, the base name above all, is as it was.
    expect(await readIscsiGlobalSettings(api)).toEqual({ ...found, listen_port: listenPort });
  });
});

test('the NVMe-oF pencil opens the NVMe-oF global configuration', async ({ page, api }) => {
  const { basenqn } = nvmeOfLocators.globalConfig;

  await openServiceForm(page, 'nvmet', basenqn, await readNvmeOfBaseNqn(api));

  await page.locator(servicesLocators.closePanel).click();
  await expect(page.locator(basenqn)).toBeHidden();
});

test('an admin saves the SSH settings, and the appliance keeps them', async ({ page, api }) => {
  const form = servicesLocators.sshForm;

  await openServiceForm(page, 'ssh', form.port, String(sshBaseline.tcpport));
  await page.locator(form.port).fill('2222');
  await page.locator(form.passwordAuth).click();
  await page.locator(form.tcpForwarding).click();
  await saveServiceForm(page);

  // Kerberos is left alone, because turning it on needs a realm this appliance
  // may not have. It is read back anyway: the form sends every field, so a save
  // that flipped a box it was not asked to touch fails here.
  expect(await readSshSettings(api)).toEqual({
    tcpport: 2222,
    passwordauth: true,
    kerberosauth: false,
    tcpfwd: true,
  });
});

test('an admin saves the FTP settings, and the appliance keeps them', async ({ page, api }) => {
  const form = servicesLocators.ftpForm;

  await openServiceForm(page, 'ftp', form.port, String(ftpBaseline.port));
  await page.locator(form.port).fill('2121');
  await page.locator(form.clients).fill('10');
  await page.locator(form.connections).fill('4');
  await page.locator(form.loginAttempts).fill('3');
  await page.locator(form.notransferTimeout).fill('450');
  await page.locator(form.timeout).fill('900');
  await saveServiceForm(page);

  expect(await readFtpSettings(api)).toEqual({
    port: 2121,
    clients: 10,
    ipconnections: 4,
    loginattempt: 3,
    timeout_notransfer: 450,
    timeout: 900,
  });
});
