/**
 * NFS share preconditions and cleanup, over the API.
 *
 * The counterpart of `fixtures/smb.ts`, with one difference that runs through
 * everything here: an NFS share has no name. Its path is its identity — to the
 * form, to the card, and to these helpers — so a spec that needs two shares
 * needs two paths.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import { ensureServiceRunning, ensureServiceStopped } from './services';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** Middleware's name for the NFS service, which for once is also the UI's. */
export const nfsServiceName = 'nfs';

/** A share as middleware reports it, with its id narrowed — see `SmbShareRecord`. */
type NfsShareEntry = Extract<CallResponse<E2eApiDirectory, 'sharing.nfs.query'>, unknown[]>[number];

export type NfsShareRecord = NfsShareEntry & { id: number };

/**
 * The appliance's own record of the share on a path, or undefined.
 *
 * What a form test asserts against: the card showing a row says the screen
 * believed the save, this says the appliance did it — and carries back what the
 * card never displays, like the networks and hosts an export is restricted to.
 */
export async function findNfsShare(client: E2eApiClient, path: string): Promise<NfsShareRecord | undefined> {
  // `query`, not `queryOne` — absence is an ordinary answer here.
  const [share] = await firstValueFrom(
    client.api.query('sharing.nfs.query', [['path', '=', path]]).pipe(timeout(readTimeoutMs)),
  );

  return share as NfsShareRecord | undefined;
}

/**
 * Removes every share on a path, if any.
 *
 * Every, because middleware allows several exports of one path as long as their
 * hosts and networks do not overlap. The data stays: deleting a share stops
 * exporting a path and never touches what is on it.
 */
export async function ensureNfsShareAbsent(client: E2eApiClient, path: string): Promise<void> {
  const shares = await firstValueFrom(
    client.api.query('sharing.nfs.query', [['path', '=', path]]).pipe(timeout(readTimeoutMs)),
  );

  for (const share of shares) {
    await firstValueFrom(
      client.api.call('sharing.nfs.delete', [share.id]).pipe(timeout(slowCallTimeoutMs)),
    );
  }
}

/**
 * Exports an existing path, if it is not exported already.
 *
 * For the bystander in a deletion test and anything else that needs a share to
 * merely exist. Never for the share under test — that one goes through the form.
 * `networks` restricts the export; left out, middleware's default of none applies.
 */
export async function ensureNfsSharePresent(
  client: E2eApiClient,
  { path, comment = '', networks = [] }: { path: string; comment?: string; networks?: string[] },
): Promise<void> {
  if (await findNfsShare(client, path)) {
    return;
  }

  await firstValueFrom(
    client.api.call('sharing.nfs.create', [{ path, comment, networks }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/** The NFS protocol versions the service offers, as `nfs.config` spells them (`NFSV3`, `NFSV4`). */
export type NfsProtocols = CallResponse<E2eApiDirectory, 'nfs.config'>['protocols'];

/**
 * The protocol versions the NFS service has enabled.
 *
 * Read before a test that changes them, so teardown can put back what it found.
 * The share form decides from this whether to offer Security at all.
 */
export async function readNfsProtocols(client: E2eApiClient): Promise<NfsProtocols> {
  const config = await firstValueFrom(client.api.call('nfs.config').pipe(timeout(readTimeoutMs)));

  return config.protocols;
}

/**
 * Sets the protocol versions the NFS service offers. For preconditions and
 * teardown only; a change under test goes through the service form.
 *
 * Only `protocols` is written, so nothing else the service holds is touched.
 * Saving a stopped service's settings rewrites its configuration and starts nothing.
 */
export async function setNfsProtocols(client: E2eApiClient, protocols: NfsProtocols): Promise<void> {
  await firstValueFrom(
    client.api.call('nfs.update', [{ protocols }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

type NfsConfig = CallResponse<E2eApiDirectory, 'nfs.config'>;

/**
 * The part of `nfs.config` the service settings spec edits.
 *
 * The thread count and the three ports are spelled out rather than picked: `null`
 * is what middleware stores for "calculate dynamically" and "no fixed port", and
 * the baseline has to be able to write it back.
 */
export type NfsSettings = Pick<
  NfsConfig,
  'protocols' | 'v4_domain' | 'v4_krb' | 'allow_nonroot' | 'userd_manage_gids'
> & {
  servers: number | null;
  mountd_port: number | null;
  rpcstatd_port: number | null;
  rpclockd_port: number | null;
};

/**
 * The stock NFS configuration: threads calculated dynamically, NFSv3 and NFSv4,
 * no domain, no Kerberos, no fixed ports, and both server-side toggles off.
 */
export const nfsBaseline: NfsSettings = {
  servers: null,
  protocols: ['NFSV3', 'NFSV4'],
  v4_domain: '',
  v4_krb: false,
  mountd_port: null,
  rpcstatd_port: null,
  rpclockd_port: null,
  allow_nonroot: false,
  userd_manage_gids: false,
};

/**
 * The settings as the appliance holds them, and `managed_nfsd`, which is how
 * middleware reports that it calculates the thread count itself.
 *
 * The protocols are sorted, as the baseline spells them, so a comparison does
 * not depend on the order middleware returns them in.
 */
export async function readNfsSettings(
  client: E2eApiClient,
): Promise<NfsSettings & Pick<NfsConfig, 'managed_nfsd'>> {
  const config = await firstValueFrom(client.api.call('nfs.config').pipe(timeout(readTimeoutMs)));

  return {
    servers: config.servers,
    managed_nfsd: config.managed_nfsd,
    protocols: [...config.protocols].sort((a, b) => a.localeCompare(b)),
    v4_domain: config.v4_domain,
    v4_krb: config.v4_krb,
    mountd_port: config.mountd_port,
    rpcstatd_port: config.rpcstatd_port,
    rpclockd_port: config.rpclockd_port,
    allow_nonroot: config.allow_nonroot,
    userd_manage_gids: config.userd_manage_gids,
  };
}

/**
 * Writes the settings in one call. For preconditions and teardown only; a change
 * under test goes through the service form.
 *
 * One call, with the protocols in it: middleware refuses an NFSv4 domain while
 * NFSv4 is off, so writing the domain before the protocols could be refused.
 */
export async function setNfsSettings(client: E2eApiClient, settings: NfsSettings): Promise<void> {
  await firstValueFrom(
    client.api.call('nfs.update', [settings]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Returns the NFS service to stopped and not-auto-starting.
 *
 * Same reason as SMB's: the form's post-save prompt is raised only while the
 * service is stopped, so a service left running makes the next run exercise a
 * different path while still reporting green.
 */
export async function ensureNfsServiceStopped(client: E2eApiClient): Promise<void> {
  await ensureServiceStopped(
    client,
    nfsServiceName,
    'NFS service did not stop; the next run will not be offered the start prompt its saves expect.',
  );
}

/**
 * Starts the NFS service, for a journey that needs it running.
 *
 * The sessions page asks the running server which clients it has. Whoever
 * calls this owes {@link ensureNfsServiceStopped} in teardown.
 */
export async function ensureNfsServiceRunning(client: E2eApiClient): Promise<void> {
  await ensureServiceRunning(
    client,
    nfsServiceName,
    'NFS service did not start, so the sessions page has no server to ask about clients.',
  );
}
