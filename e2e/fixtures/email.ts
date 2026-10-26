/**
 * Email settings: preconditions, cleanup and readback, over the API.
 *
 * The settings are `mail.config`, a single config record, so — as in
 * `fixtures/syslog.ts` — there is nothing to create or delete. Each test starts
 * from a known baseline and teardown writes that baseline back, rather than
 * snapshotting what it found and restoring that.
 *
 * The baseline is middleware's own default except for the sender address: no
 * name, no server, port 25, no encryption, no SMTP authentication and no OAuth.
 * A fresh appliance holds an empty sender, but `mail.update` refuses one
 * (`[EINVAL] fromemail: This field is required`), so no update can write it back.
 * On an appliance someone has set up to send mail, a run clears that setup.
 *
 * The stored username and password are left alone. Middleware ignores them while
 * SMTP authentication is off, and the form does not send them then either.
 *
 * Every address and server is under `example.com`, which RFC 2606 reserves.
 * Saving the settings sends nothing. Only Send Test Mail would. The one test that
 * presses it, in `email-test-mail.e2e.ts`, first leaves no local administrator
 * with an address, so the form stops before `mail.send`.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs } from '../support/timeouts';

type MailConfig = CallResponse<E2eApiDirectory, 'mail.config'>;

/** The part of `mail.config` the SMTP form edits, less the password, which no test reads back. */
export type MailSettings = Pick<
  MailConfig, 'fromemail' | 'fromname' | 'outgoingserver' | 'port' | 'security' | 'smtp' | 'user'
>;

/**
 * Middleware's defaults, less the username, which the baseline leaves alone, and
 * with a sender, which `mail.update` requires.
 */
export const mailBaseline: Omit<MailSettings, 'user'> = {
  fromemail: 'baseline@example.com',
  fromname: '',
  outgoingserver: '',
  port: 25,
  security: 'PLAIN',
  smtp: false,
};

/** The settings as the appliance holds them. */
export async function readMailSettings(client: E2eApiClient): Promise<MailSettings> {
  const config = await firstValueFrom(client.api.call('mail.config').pipe(timeout(readTimeoutMs)));

  return {
    fromemail: config.fromemail,
    fromname: config.fromname,
    outgoingserver: config.outgoingserver,
    port: config.port,
    security: config.security,
    smtp: config.smtp,
    user: config.user,
  };
}

/**
 * The address Send Test Mail would send to: the first local administrator's
 * email middleware finds, or null when none has one.
 */
export async function readLocalAdministratorEmail(client: E2eApiClient): Promise<string | null> {
  return await firstValueFrom(
    client.api.call('mail.local_administrator_email').pipe(timeout(readTimeoutMs)),
  );
}

/**
 * Writes the baseline. Used before and after each test.
 *
 * Clears OAuth too, so the form opens on SMTP whatever the appliance held.
 */
export async function resetMailSettings(client: E2eApiClient): Promise<void> {
  await firstValueFrom(
    client.api.call('mail.update', [{ ...mailBaseline, oauth: null }]).pipe(timeout(readTimeoutMs)),
  );
}

/**
 * Turns on SMTP authentication with a server, a sender and an account. Used for
 * the state a test starts from. Never for the change under test, which goes
 * through the form.
 */
export async function setAuthenticatedMail(
  client: E2eApiClient,
  settings: Omit<MailSettings, 'smtp'> & { pass: string },
): Promise<void> {
  await firstValueFrom(
    client.api.call('mail.update', [{ ...settings, smtp: true, oauth: null }]).pipe(timeout(readTimeoutMs)),
  );
}
