/**
 * Stories: an admin starts and stops a service from the Services page under
 * System, and saves the SSH and FTP settings from the forms its rows open.
 *
 * Start and stop use FTP. It is stopped on a stock appliance and nothing the
 * suite or CI reaches the appliance through depends on it, so starting it
 * changes nothing else a run relies on. Each state change is asserted twice: the
 * row says the screen believed it, and `service.query` says the appliance did it.
 *
 * The page has no readout of a service's settings, so each save is asserted
 * through `ssh.config` or `ftp.config` alone. Each test moves the fields it edits
 * away from the baseline, so a form that dropped any one of them fails.
 *
 * Both forms hide most of their fields behind the footer's Advanced toggle. The
 * advanced tests click it first, so a toggle that revealed nothing fails there.
 * Bind interfaces and the auxiliary parameters are left alone: a wrong value can
 * cut off SSH, which CI may use.
 *
 * FTP goes back to stopped, and both services' settings to the baseline, before
 * and after every test. See `fixtures/service-config.ts`.
 */
import { findCertificate } from '../fixtures/certificates';
import {
  ftpAdvancedBaseline, ftpBaseline, readFtpAdvancedSettings, readFtpCertificateId, readFtpSettings,
  readSshAdvancedSettings, readSshSettings, setFtpSettings, setSshSettings, sshAdvancedBaseline, sshBaseline,
} from '../fixtures/service-config';
import { ensureServiceStopped, queryService } from '../fixtures/services';
import { goToServices } from '../flows/navigation';
import {
  openServiceForm, saveServiceForm, serviceChangeTimeoutMs, serviceSaveTimeoutMs, showAdvancedSettings,
  startServiceFromList, stopServiceFromList, toggleWeakCiphers,
} from '../flows/services';
import { selectOption } from '../flows/storage';
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

test('an admin saves the FTP access, passive port and bandwidth options', async ({ page, api }) => {
  const form = servicesLocators.ftpForm;

  await openServiceForm(page, 'ftp', form.port, String(ftpBaseline.port));
  await showAdvancedSettings(page, form.alwaysChroot);

  // Always Chroot is on in the baseline, as on a stock appliance, so the click
  // turns it off. The other three start off and are turned on.
  await page.locator(form.alwaysChroot).click();
  await page.locator(form.localUserLogin).click();
  await page.locator(form.transferResumption).click();
  await page.locator(form.fxp).click();
  await page.locator(form.passivePortsMin).fill('50000');
  await page.locator(form.passivePortsMax).fill('50100');
  await page.locator(form.localUserUploadBandwidth).fill('1 MiB');
  await page.locator(form.localUserDownloadBandwidth).fill('2 MiB');
  await saveServiceForm(page);

  // The bandwidth inputs hold bytes and the form divides by 1024 on save, so
  // `ftp.config` keeps KiB. The TLS fields are read back too, at the baseline,
  // so a save that changed one it was not asked to fails here.
  expect(await readFtpAdvancedSettings(api)).toEqual({
    ...ftpAdvancedBaseline,
    defaultroot: false,
    onlylocal: true,
    resume: true,
    fxp: true,
    passiveportsmin: 50000,
    passiveportsmax: 50100,
    localuserbw: 1024,
    localuserdlbw: 2048,
  });
});

test('an admin turns on FTP TLS with the appliance certificate', async ({ page, api }) => {
  const form = servicesLocators.ftpForm;
  const certificateName = 'truenas_default';
  const certificate = await findCertificate(api, certificateName);
  expect(certificate, `the appliance has no ${certificateName} certificate to pick`).toBeDefined();

  await openServiceForm(page, 'ftp', form.port, String(ftpBaseline.port));
  await showAdvancedSettings(page, form.tls);

  // The certificate and the TLS options render only once Enable TLS is ticked.
  await page.locator(form.tls).click();
  await selectOption(page, form.certificate, form.certificateOption(certificateName));
  // `.first()`, because `!Data` renders the same id after it. See `tlsPolicyOption`.
  await page.locator(form.tlsPolicy).click();
  await page.locator(form.tlsPolicyOption('Data')).first().click();
  await page.locator(form.tlsAllowClientRenegotiations).click();
  await saveServiceForm(page);

  expect(await readFtpAdvancedSettings(api)).toEqual({
    ...ftpAdvancedBaseline,
    tls: true,
    tls_policy: 'data',
    tls_opt_allow_client_renegotiations: true,
  });
  expect(await readFtpCertificateId(api)).toBe(certificate?.id);
});

test('the FTP form refuses a maximum passive port below the minimum', async ({ page, api }) => {
  const form = servicesLocators.ftpForm;

  await openServiceForm(page, 'ftp', form.port, String(ftpBaseline.port));
  await showAdvancedSettings(page, form.passivePortsMin);

  // Each port is in range on its own, so the form sends them. The order is
  // middleware's rule, and the message is its answer, attached to the field.
  await page.locator(form.passivePortsMin).fill('50100');
  await page.locator(form.passivePortsMax).fill('50000');
  await page.locator(servicesLocators.save).click();

  await expect(page.locator(form.passivePortsMaxField))
    .toContainText('should be greater than', { timeout: serviceSaveTimeoutMs });
  await expect(page.locator(servicesLocators.save)).toBeVisible();
  expect(await readFtpAdvancedSettings(api)).toEqual(ftpAdvancedBaseline);
});

test('an admin saves the SSH advanced settings, and the appliance keeps them', async ({ page, api }) => {
  const form = servicesLocators.sshForm;

  await openServiceForm(page, 'ssh', form.port, String(sshBaseline.tcpport));
  await showAdvancedSettings(page, form.compression);

  await page.locator(form.compression).click();
  await selectOption(page, form.sftpLogLevel, form.sftpLogLevelOption('Verbose'));
  await selectOption(page, form.sftpLogFacility, form.sftpLogFacilityOption('Auth'));
  // The baseline allows both weak ciphers, as a stock appliance does, so
  // dropping None leaves AES128-CBC alone.
  await toggleWeakCiphers(page, ['None']);
  await saveServiceForm(page);

  expect(await readSshAdvancedSettings(api)).toEqual({
    ...sshAdvancedBaseline,
    compression: true,
    sftp_log_level: 'VERBOSE',
    sftp_log_facility: 'AUTH',
    weak_ciphers: ['AES128-CBC'],
  });
});
