/**
 * Two-factor authentication: preconditions, cleanup and readback, over the API.
 *
 * Global two-factor is one config record (`auth.twofactor`), so there is nothing
 * to create or delete — only a setting to write back. It matters more than most:
 * while it is on, every account that has no secret is put through the setup
 * dialog at its next sign-in, the suite's own admin included, and every later
 * spec would meet that dialog instead of the shell. So teardown always writes
 * `enabled: false`, whatever it found.
 *
 * A user's secret lives on the user, and goes when the user does.
 */
import type { CallParams, CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

export type GlobalTwoFactorConfig = CallResponse<E2eApiDirectory, 'auth.twofactor.config'>;
export type GlobalTwoFactorUpdate = NonNullable<CallParams<E2eApiDirectory, 'auth.twofactor.update'>[0]>;

/**
 * The throwaway administrator who sets up two-factor. Never the suite's own
 * admin: an account with a secret is asked for a code at every sign-in, and the
 * suite's API client cannot answer one (`support/api/client.ts`).
 */
export const twoFactorUser = {
  username: 'twofactoruser',
  /** Meets the appliance's complexity rules; not a credential of any real account. */
  password: 'TwoFactor-E2E-Passw0rd!',
};

/** Global two-factor as the appliance holds it. */
export async function readGlobalTwoFactor(client: E2eApiClient): Promise<GlobalTwoFactorConfig> {
  return firstValueFrom(client.api.call('auth.twofactor.config').pipe(timeout(readTimeoutMs)));
}

/**
 * Turns global two-factor off, keeping the other settings as `baseline` has them.
 *
 * For setup and teardown alike. Off rather than "as found": a run that died with
 * it on would otherwise restore it on, and every later sign-in would hit the
 * setup dialog. The tolerance window and SSH are written back as they were.
 */
export async function disableGlobalTwoFactor(
  client: E2eApiClient,
  baseline: GlobalTwoFactorConfig,
): Promise<void> {
  await setGlobalTwoFactor(client, {
    enabled: false,
    window: baseline.window,
    services: baseline.services,
  });
}

/**
 * Writes global two-factor as given: a precondition for a spec that starts with
 * it on. Slow, because middleware reloads the `ssh` and `user` services and
 * regenerates PAM on every save.
 */
export async function setGlobalTwoFactor(client: E2eApiClient, update: GlobalTwoFactorUpdate): Promise<void> {
  await firstValueFrom(
    client.api.call('auth.twofactor.update', [update]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Creates {@link twoFactorUser} if absent: a local administrator with a password.
 *
 * An administrator because signing in to the UI needs a role. A password because
 * the account is signed in as.
 */
export async function ensureTwoFactorUserPresent(client: E2eApiClient): Promise<void> {
  const { username, password } = twoFactorUser;
  const [existing] = await firstValueFrom(
    client.api.query('user.query', [['username', '=', username]]).pipe(timeout(readTimeoutMs)),
  );
  if (existing) {
    return;
  }

  const [administrators] = await firstValueFrom(
    client.api.query('group.query', [['group', '=', 'builtin_administrators']]).pipe(timeout(readTimeoutMs)),
  );
  if (!administrators) {
    throw new Error('group.query returned no builtin_administrators row; cannot create an administrator.');
  }

  await firstValueFrom(
    client.api.call('user.create', [{
      username,
      full_name: `E2E ${username}`,
      password,
      group_create: true,
      groups: [administrators.id],
      smb: false,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}
