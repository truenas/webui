/**
 * NTP server preconditions, cleanup and readback, over the API.
 *
 * A server has no name, and middleware does not hold addresses unique: a form
 * saved twice by a retried test leaves two servers with the same address. So
 * these helpers key on the address, and removal takes every match.
 *
 * Every address here is in 192.0.2.0/24, which RFC 5737 reserves for
 * documentation, so no appliance can reach a server on it. That is deliberate:
 * middleware queries a new or edited server before saving it and refuses one
 * that does not answer unless `force` is set, and whether a CI appliance can
 * reach any real NTP server is not something the suite should depend on. With
 * an unreachable address, `force` is what every save turns on, every time.
 *
 * Creating or deleting a server rewrites the time daemon's configuration and
 * restarts it. Nothing in a test run depends on the clock moving, and the
 * appliance's own servers are left alone.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** An NTP server as middleware reports it, with its id narrowed — see `GroupRecord`. */
type NtpServerEntry = Extract<CallResponse<E2eApiDirectory, 'system.ntpserver.query'>, unknown[]>[number];

export type NtpServerRecord = NtpServerEntry & { id: number };

/** Every NTP server middleware holds for an address. */
async function findNtpServers(client: E2eApiClient, address: string): Promise<NtpServerRecord[]> {
  const servers = await firstValueFrom(
    client.api.query('system.ntpserver.query', [['address', '=', address]]).pipe(timeout(readTimeoutMs)),
  );

  return servers as NtpServerRecord[];
}

/**
 * The appliance's own record of the server at an address, or undefined.
 *
 * `query`, not `queryOne` — absence is an ordinary answer here.
 */
export async function findNtpServer(client: E2eApiClient, address: string): Promise<NtpServerRecord | undefined> {
  const [server] = await findNtpServers(client, address);
  return server;
}

/** Removes every server at an address, if any. */
export async function ensureNtpServerAbsent(client: E2eApiClient, address: string): Promise<void> {
  for (const server of await findNtpServers(client, address)) {
    await firstValueFrom(
      client.api.call('system.ntpserver.delete', [server.id]).pipe(timeout(slowCallTimeoutMs)),
    );
  }
}

/**
 * Creates a server at an address with the form's defaults and the given poll
 * intervals, if there is none there already.
 *
 * For the server an edit or a delete acts on, and for a bystander. Never for
 * the server under test in a create — that one goes through the form.
 */
export async function ensureNtpServerPresent(
  client: E2eApiClient,
  { address, minpoll, maxpoll }: { address: string; minpoll: number; maxpoll: number },
): Promise<void> {
  if (await findNtpServer(client, address)) {
    return;
  }

  await firstValueFrom(
    client.api.call('system.ntpserver.create', [{
      address, minpoll, maxpoll, burst: false, iburst: true, prefer: false, force: true,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}
