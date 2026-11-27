/**
 * The Allowed IP Addresses card's record, `ui_allowlist` on `system.general.config`, over the API.
 *
 * A non-empty allowlist refuses every client it does not name, the suite's own included, so every list a test
 * writes or saves must hold {@link readRunnerAddress}.
 */
import { isIP } from 'net';
import { firstValueFrom, timeout } from 'rxjs';
import { readSessions } from './sessions';
import type { E2eApiClient } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** The allowlist as the appliance holds it. */
export async function readAllowlist(client: E2eApiClient): Promise<string[]> {
  const config = await firstValueFrom(client.api.call('system.general.config').pipe(timeout(readTimeoutMs)));
  return config.ui_allowlist;
}

/**
 * Writes the allowlist. For the state a test starts from and for teardown, never for the change under test,
 * which goes through the card.
 *
 * A plain `system.general.update` with no `ui_restart_delay`, so middleware does not restart the web service.
 */
export async function writeAllowlist(client: E2eApiClient, allowlist: string[]): Promise<void> {
  await firstValueFrom(
    client.api.call('system.general.update', [{ ui_allowlist: allowlist }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * The address the appliance sees this run connect from: the worker client's own session origin,
 * `<address>:<port>`, without the port.
 *
 * The browser reaches the appliance from the same host as the worker client, through a proxy in CI or the dev
 * server locally, so this one address admits both.
 */
export async function readRunnerAddress(client: E2eApiClient): Promise<string> {
  const own = (await readSessions(client)).find((session) => session.current);
  const address = own?.origin.slice(0, own.origin.lastIndexOf(':')).replace(/^\[|\]$/g, '');
  if (!address || !isIP(address)) {
    throw new Error(`Could not read the runner's address from its session origin "${own?.origin ?? ''}".`);
  }
  return address;
}
