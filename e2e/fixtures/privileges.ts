/**
 * Privilege preconditions, cleanup and readback, over the API.
 *
 * Keyed on the name, which middleware holds unique and which the list builds every
 * id on a row from. Creating, updating and deleting one are plain calls, not jobs.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** A privilege as middleware reports it, with its id narrowed — see `GroupRecord`. */
type PrivilegeEntry = Extract<CallResponse<E2eApiDirectory, 'privilege.query'>, unknown[]>[number];

export type PrivilegeRecord = PrivilegeEntry & { id: number };

/**
 * The appliance's own record of the privilege with this name, or undefined.
 *
 * `query`, not `queryOne` — absence is an ordinary answer here.
 */
export async function findPrivilege(client: E2eApiClient, name: string): Promise<PrivilegeRecord | undefined> {
  const [privilege] = await firstValueFrom(
    client.api.query('privilege.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  return privilege as PrivilegeRecord | undefined;
}

/** Removes the privilege with this name, if there is one. */
export async function ensurePrivilegeAbsent(client: E2eApiClient, name: string): Promise<void> {
  const privilege = await findPrivilege(client, name);
  if (!privilege) {
    return;
  }

  await firstValueFrom(
    client.api.call('privilege.delete', [privilege.id]).pipe(timeout(slowCallTimeoutMs)),
  );
}

export interface PrivilegeSeed {
  name: string;
  /** Wire values, `READONLY_ADMIN`, not the labels the form shows. */
  roles: NonNullable<PrivilegeEntry['roles']>;
  webShell: boolean;
  /** Gids, not group row ids — see `ensureNoWebUiAccessAccountPresent` in `fixtures/users.ts`. */
  localGroupGids: number[];
  /** A directory service's groups, by gid. None unless given. */
  dsGroupGids?: number[];
}

/**
 * Creates a privilege, if none has this name already.
 *
 * For the privilege an edit or a delete acts on, and for a bystander. Never for the
 * privilege under test in an add — that one goes through the form.
 */
export async function ensurePrivilegePresent(client: E2eApiClient, seed: PrivilegeSeed): Promise<void> {
  if (await findPrivilege(client, seed.name)) {
    return;
  }

  await firstValueFrom(
    client.api.call('privilege.create', [{
      name: seed.name,
      local_groups: seed.localGroupGids,
      ds_groups: seed.dsGroupGids ?? [],
      roles: seed.roles,
      web_shell: seed.webShell,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}
