/**
 * The global SED password: preconditions, cleanup and readback, over the API.
 *
 * The password is part of `system.advanced`, a single config record, but it is
 * not restored the way the other Advanced Settings are. Restoring a password
 * means sending it back in clear text, and a wrong restore on a machine with SED
 * drives locks them out at its next boot. So the spec touches it only on an
 * appliance where none was set, and its baseline is "none": middleware takes
 * `sed_passwd: ''` as clearing it, unconditionally, even without the entitlement
 * a non-empty password needs (`plugins/system_advanced/config.py`).
 *
 * `system.advanced.config` never returns the password, so these read it through
 * the two calls the UI makes.
 *
 * Nothing here puts a password in an error message.
 */
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

export async function isSedPasswordSet(client: E2eApiClient): Promise<boolean> {
  return firstValueFrom(
    client.api.call('system.advanced.sed_global_password_is_set').pipe(timeout(readTimeoutMs)),
  );
}

export async function readSedPassword(client: E2eApiClient): Promise<string> {
  return firstValueFrom(
    client.api.call('system.advanced.sed_global_password').pipe(timeout(readTimeoutMs)),
  );
}

/**
 * For the state a test starts from. Never for the change under test, which goes
 * through the form. Middleware refuses a non-empty password without the `SED`
 * entitlement.
 */
export async function setSedPassword(client: E2eApiClient, password: string): Promise<void> {
  await firstValueFrom(
    client.api.call('system.advanced.update', [{ sed_passwd: password }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/** Clears the password and reads back that it is gone, rather than trusting the call. */
export async function clearSedPassword(client: E2eApiClient): Promise<void> {
  await setSedPassword(client, '');

  if (await isSedPasswordSet(client)) {
    throw new Error('system.advanced.sed_global_password_is_set is still true after writing an empty SED password');
  }
}
