/**
 * NTP server preconditions, cleanup and readback, over the API.
 *
 * Addresses are not unique and a retried save leaves duplicates, so helpers key on the address and removal
 * takes every match. Addresses are in RFC 5737's 192.0.2.0/24, so unreachable: middleware refuses an
 * unanswering server unless `force` is set, so every save sets it, and the suite never depends on reaching
 * real NTP. Changes restart the time daemon; nothing depends on the clock, and existing servers are untouched.
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

/** How many NTP servers the appliance holds, its own included. */
export async function countNtpServers(client: E2eApiClient): Promise<number> {
  const servers = await firstValueFrom(
    client.api.query('system.ntpserver.query', []).pipe(timeout(readTimeoutMs)),
  );

  return servers.length;
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
