/**
 * Stories: an admin sets up outgoing mail from the Email card on System > General
 * Settings, and the appliance keeps what they saved.
 *
 * Each save is asserted twice: the card's From readout says the screen believed
 * it, and `mail.config` says the appliance did it.
 *
 * One test fills in every SMTP field, starting from the defaults, and turns SMTP
 * authentication on. The other starts with authentication on and turns it off
 * again while moving to another server. Between them, every SMTP control in the
 * form is changed. The OAuth send methods are not covered: they need a real
 * Google or Microsoft login.
 *
 * The settings are one config record, so there is nothing to delete afterwards.
 * Teardown writes middleware's defaults back, with a placeholder sender because
 * `mail.update` refuses an empty one. See `fixtures/email.ts`.
 */
import { mailBaseline, readMailSettings, resetMailSettings, setAuthenticatedMail } from '../fixtures/email';
import { chooseMailSecurity, openEmailForm, saveEmailForm } from '../flows/email';
import { emailLocators } from '../locators/email';
import { leavingTestData } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Written before each test as well as after, so an interrupted run leaves the next one able to start. */
test.beforeEach(async ({ api }) => {
  await resetMailSettings(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData('the mail settings as the test left them')) {
    return;
  }

  await resetMailSettings(api);
});

test('an admin sets up mail over SMTP with authentication, and the appliance keeps it', async ({ page, api }) => {
  const sender = { email: 'nas@example.com', name: 'E2E Mailer' };
  const server = 'smtp.example.com';
  const username = 'e2e-mailer';

  // The baseline's port.
  await openEmailForm(page, 25);
  // The baseline has a sender and no server, so the From line names no server yet.
  await expect(page.locator(emailLocators.card.from)).toHaveText(mailBaseline.fromemail);

  await page.locator(emailLocators.form.fromEmail).fill(sender.email);
  await page.locator(emailLocators.form.fromName).fill(sender.name);
  await page.locator(emailLocators.form.outgoingServer).fill(server);
  await page.locator(emailLocators.form.port).fill('587');
  await chooseMailSecurity(page, 'TLS');
  await page.locator(emailLocators.form.smtpAuthentication).click();
  await page.locator(emailLocators.form.username).fill(username);
  await page.locator(emailLocators.form.password).fill('e2e-mail-password');
  await saveEmailForm(page);

  await expect(page.locator(emailLocators.card.sendMailMethod)).toHaveText('SMTP');
  await expect(page.locator(emailLocators.card.from)).toHaveText(`${sender.name} ${sender.email} via ${server}`);

  expect(await readMailSettings(api)).toEqual({
    fromemail: sender.email,
    fromname: sender.name,
    outgoingserver: server,
    port: 587,
    security: 'TLS',
    smtp: true,
    user: username,
  });
});

/**
 * Written in a hook rather than in the test, the way the syslog spec starts from
 * every setting on. The file-level `beforeEach` runs first, so this lands on top
 * of the baseline.
 */
test.describe('starting with SMTP authentication on', () => {
  const sender = { email: 'nas@example.com', name: 'E2E Mailer' };
  const username = 'e2e-mailer';

  test.beforeEach(async ({ api }) => {
    await setAuthenticatedMail(api, {
      fromemail: sender.email,
      fromname: sender.name,
      outgoingserver: 'smtp.example.com',
      port: 587,
      security: 'TLS',
      user: username,
      pass: 'e2e-mail-password',
    });
  });

  test('an admin moves mail to another server and turns authentication off', async ({ page, api }) => {
    const server = 'relay.example.com';

    await openEmailForm(page, 587);
    await expect(page.locator(emailLocators.card.from))
      .toHaveText(`${sender.name} ${sender.email} via smtp.example.com`);
    // The account the API wrote is in the form. That is what makes turning it off a real edit.
    await expect(page.locator(emailLocators.form.username)).toHaveValue(username);

    await page.locator(emailLocators.form.outgoingServer).fill(server);
    await page.locator(emailLocators.form.port).fill('465');
    await chooseMailSecurity(page, 'SSL');
    await page.locator(emailLocators.form.smtpAuthentication).click();
    await expect(page.locator(emailLocators.form.username)).toBeHidden();
    await saveEmailForm(page);

    await expect(page.locator(emailLocators.card.from)).toHaveText(`${sender.name} ${sender.email} via ${server}`);

    // The username is not checked: with authentication off the form does not
    // send it, so middleware keeps the one it had.
    expect(await readMailSettings(api)).toMatchObject({
      fromemail: sender.email,
      fromname: sender.name,
      outgoingserver: server,
      port: 465,
      security: 'SSL',
      smtp: false,
    });
  });
});
