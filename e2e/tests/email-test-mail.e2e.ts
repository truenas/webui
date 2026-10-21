/**
 * Story: an admin presses Send Test Mail in the Email form on System > General
 * Settings while no local administrator has an email address, and is told why
 * nothing can be sent.
 *
 * The button first asks `mail.local_administrator_email`. An empty answer raises
 * an info dialog and stops there. Anything else would start `mail.send`. The
 * screen's half is the dialog. The appliance's half is the calls the page made,
 * read off its websocket, and the mail settings, which a test mail never saves.
 *
 * ## Not covered: a test mail that fails
 *
 * `mail.send` defaults `queue` to true, and the form leaves it there. A send that
 * fails is put on middleware's mail queue, which retries it every ten minutes, up
 * to three times, through whatever `mail.config` holds at that moment rather than
 * the settings it was first sent with (`plugins/mail/send.py`, `send_queue.py`).
 * Other specs leave `mail.config` pointing at `smtp.example.com` and
 * `relay.example.com` while they run. So a failed test mail could later be sent
 * to a server other than the dead port it was aimed at, which nothing in this
 * suite may risk. That scenario is left out until the form sends `queue: false`,
 * or the suite has a way to empty the queue.
 *
 * The suite admin's email is set over the API, and restored after each test,
 * whether it passed or not. The mail settings are reset as in
 * `email-settings.e2e.ts`. See `fixtures/email.ts`.
 */
import {
  mailBaseline, readLocalAdministratorEmail, readMailSettings, resetMailSettings,
} from '../fixtures/email';
import { findUser, setUserEmailAndShell } from '../fixtures/users';
import { openEmailForm } from '../flows/email';
import { infoDialogLocators } from '../locators/dialogs';
import { emailLocators } from '../locators/email';
import { apiCallsTo } from '../support/api-calls';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';
import { readTimeoutMs } from '../support/timeouts';

/** Which calls the button made is the only evidence that it stopped where it should. */
test.use({ recordApiCalls: true });

const noAdministratorEmail = 'No email address is set for root user or any other local administrator. '
  + 'Please configure such an email address first.';

/** The suite admin's email as the test found it. Unset until `beforeEach` has read it. */
let adminEmail: string | null | undefined;

test.beforeEach(async ({ api, config }) => {
  adminEmail = undefined;
  const admin = await findUser(api, config.username);
  if (!admin) {
    throw new Error(`The suite admin "${config.username}" does not exist on the appliance.`);
  }
  adminEmail = admin.email;

  await resetMailSettings(api);
});

test.afterEach(async ({ api, config }) => {
  if (leavingTestData(`the mail settings and ${config.username}'s email as the test left them`)) {
    return;
  }

  const email = adminEmail;
  await runCleanupSteps([
    ['reset the mail settings', () => resetMailSettings(api)],
    [`restore ${config.username}'s email`, async () => {
      if (email !== undefined) {
        await setUserEmailAndShell(api, config.username, { email });
      }
    }],
  ]);
});

test('with no administrator email, Send Test Mail explains why and sends nothing', async ({ page, api, config }) => {
  await setUserEmailAndShell(api, config.username, { email: null });
  expect(
    await readLocalAdministratorEmail(api),
    `mail.local_administrator_email should be empty once ${config.username} has no email. `
    + 'Another local administrator on this appliance has one, so the button would send mail.',
  ).toBeFalsy();

  // The baseline's port.
  await openEmailForm(page, 25);
  await page.locator(emailLocators.form.sendTestMail).click();

  await expect(page.locator(infoDialogLocators.title)).toHaveText('Email', { timeout: readTimeoutMs });
  await expect(page.locator(infoDialogLocators.message)).toHaveText(noAdministratorEmail);
  await page.locator(infoDialogLocators.close).click();
  await expect(page.locator(infoDialogLocators.title)).toBeHidden();
  // The dialog closes over the form, which stays open.
  await expect(page.locator(emailLocators.form.sendTestMail)).toBeVisible();

  expect(apiCallsTo(page, 'mail.local_administrator_email')).toEqual([
    { method: 'mail.local_administrator_email', answer: 'result' },
  ]);
  expect(apiCallsTo(page, 'mail.send')).toEqual([]);
  expect(await readMailSettings(api)).toMatchObject(mailBaseline);
});
