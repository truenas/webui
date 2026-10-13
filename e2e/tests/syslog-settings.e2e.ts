/**
 * Stories: an admin changes the syslog settings from the Syslog card on
 * System > Advanced Settings, and the appliance keeps what they saved.
 *
 * Each save is asserted twice, the way the other Advanced Settings specs do it:
 * the card's readouts say the screen believed it, `system.advanced.config` says
 * the appliance did it.
 *
 * One test sets every field, starting from the defaults. The other starts with
 * everything set and undoes all of it, removing the server. Between them, every
 * control in the form is changed in both directions.
 *
 * The settings are one config record, so there is nothing to delete afterwards.
 * Teardown writes middleware's defaults back. See `fixtures/syslog.ts`.
 */
import { readSyslogSettings, setSyslogSettings, syslogBaseline } from '../fixtures/syslog';
import {
  addSyslogServer, chooseSyslogLevel, openSyslogForm, saveSyslogForm,
} from '../flows/syslog';
import { syslogLocators, type SyslogLevel } from '../locators/syslog';
import { leavingTestData } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Written before each test as well as after, so an interrupted run leaves the next one able to start. */
test.beforeEach(async ({ api }) => {
  await setSyslogSettings(api, syslogBaseline);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData('the syslog settings as the test left them')) {
    return;
  }

  await setSyslogSettings(api, syslogBaseline);
});

test('an admin sets up syslog forwarding, and the appliance keeps every setting', async ({ page, api }) => {
  const host = '192.0.2.21';

  // The baseline's level.
  await openSyslogForm(page, 'F_INFO');
  await page.locator(syslogLocators.form.useFqdn).click();
  await chooseSyslogLevel(page, 'F_WARNING');
  await addSyslogServer(page, host, 'TCP');
  await page.locator(syslogLocators.form.includeAuditLogs).click();
  await saveSyslogForm(page);

  await expect(page.locator(syslogLocators.card.useFqdn)).toHaveText('Enabled');
  await expect(page.locator(syslogLocators.card.level)).toHaveText('Warning');
  await expect(page.locator(syslogLocators.card.servers)).toHaveText(`${host} (TCP)`);
  await expect(page.locator(syslogLocators.card.includeAuditLogs)).toHaveText('Yes');

  const saved = await readSyslogSettings(api);
  expect(saved).toMatchObject({
    fqdn_syslog: true,
    sysloglevel: 'F_WARNING',
    syslog_audit: true,
  });
  // Exactly one server: a form that sent the empty one it starts a new entry
  // with, or sent the entry twice, fails here.
  expect(saved.syslogservers).toHaveLength(1);
  expect(saved.syslogservers[0]).toMatchObject({ host, transport: 'TCP' });
});

/**
 * Written in a hook rather than in the test, because the app reads these
 * settings once, as `page` signs in, and never again on its way to the card. A
 * write in the test body runs after that read, so the card would still show the
 * baseline. The file-level `beforeEach` runs first, so this lands on top of it.
 */
test.describe('starting with every setting on', () => {
  const host = '192.0.2.22';
  const level: SyslogLevel = 'F_DEBUG';

  test.beforeEach(async ({ api }) => {
    await setSyslogSettings(api, {
      fqdn_syslog: true,
      sysloglevel: level,
      syslog_audit: true,
      syslogservers: [{ host, transport: 'UDP', tls_certificate: null }],
    });
  });

  test('an admin removes the syslog server and turns every setting back off', async ({ page, api }) => {
    await openSyslogForm(page, level);
    await expect(page.locator(syslogLocators.card.servers)).toHaveText(`${host} (UDP)`);
    // The server the API wrote is in the form. That is what makes removing it a real edit.
    await expect(page.locator(syslogLocators.form.host)).toHaveValue(host);

    await page.locator(syslogLocators.form.removeFirstServer).click();
    await expect(page.locator(syslogLocators.form.host)).toBeHidden();
    await page.locator(syslogLocators.form.useFqdn).click();
    await chooseSyslogLevel(page, 'F_ERR');
    await page.locator(syslogLocators.form.includeAuditLogs).click();
    await saveSyslogForm(page);

    await expect(page.locator(syslogLocators.card.useFqdn)).toHaveText('Disabled');
    await expect(page.locator(syslogLocators.card.level)).toHaveText('Error');
    await expect(page.locator(syslogLocators.card.servers)).toHaveText('None');
    await expect(page.locator(syslogLocators.card.includeAuditLogs)).toHaveText('No');

    expect(await readSyslogSettings(api)).toEqual({
      fqdn_syslog: false,
      sysloglevel: 'F_ERR',
      syslog_audit: false,
      syslogservers: [],
    });
  });
});
