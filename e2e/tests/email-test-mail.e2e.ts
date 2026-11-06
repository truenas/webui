/**
 * Story: Send Test Mail in the Email form, with no local administrator email, says why nothing can be sent. The
 * button asks `mail.local_administrator_email` first and stops on an empty answer; checked by the dialog, the page's
 * websocket calls, and unchanged mail settings. A failing test mail is not covered: `mail.send` queues failures and
 * retries them through whatever `mail.config` holds later, which other specs point at `smtp.example.com`, so it could
 * reach another server. Add it once the form sends `queue: false` or the queue can be emptied. The admin's email is
 * set over the API and restored after each test; mail settings are reset as in `email-settings.e2e.ts`.
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
