/**
 * A dataset's owner, group and Unix mode, and its NFSv4 ACL entries, over the API.
 *
 * Provisioning only, plus the reads a test asserts against. Changing them is what
 * `tests/dataset-permissions.e2e.ts` and `tests/smb-share-acl.e2e.ts` drive through the UI, so
 * nothing here may stand in for it.
 * There is no teardown of its own: the permissions live on the dataset's mountpoint, and the spec
 * deletes the dataset.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { Nfs4Ace } from './storage';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { runJob } from '../support/jobs';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** Who owns a path and what its permission bits are. */
export interface Ownership {
  user: string;
  group: string;
  /** The permission bits alone, as the three octal digits the editor shows: `755`. */
  mode: string;
}

/**
 * The owner, group and permission bits of `path`.
 *
 * `filesystem.stat` reports the whole `st_mode`, file type included. Only the low nine bits are
 * permissions, so the rest is masked off before the digits are compared.
 */
export async function readOwnership(client: E2eApiClient, path: string): Promise<Ownership> {
  const stat = await firstValueFrom(
    client.api.call('filesystem.stat', [path]).pipe(timeout(readTimeoutMs)),
  );

  return {
    user: stat.user ?? String(stat.uid),
    group: stat.group ?? String(stat.gid),
    mode: (stat.mode & 0o777).toString(8).padStart(3, '0'),
  };
}

/**
 * The NFSv4 ACL entries on `path` that name the user with `uid`.
 *
 * What a test of the ACL editor asserts against. Throws if the path is not
 * NFSv4, because an empty answer would then mean the wrong dataset, not a
 * missing entry.
 */
export async function findUserAclEntries(client: E2eApiClient, path: string, uid: number): Promise<Nfs4Ace[]> {
  const acl = await firstValueFrom(
    client.api.call('filesystem.getacl', [path, true, true]).pipe(timeout(readTimeoutMs)),
  );

  if (acl.acltype !== 'NFS4') {
    throw new Error(`"${path}" has ${acl.acltype} ACLs, where the test expects the NFSv4 the SMB preset gives.`);
  }

  return acl.acl.filter((entry) => entry.tag === 'USER' && entry.id === uid);
}

/** The whole of `filesystem.getacl`, a union across the ACL flavours. */
export type AclRead = CallResponse<E2eApiDirectory, 'filesystem.getacl'>;

/** One template of `filesystem.acltemplate.by_path`. */
export type AclTemplate = CallResponse<E2eApiDirectory, 'filesystem.acltemplate.by_path'>[number];

/**
 * Everything `filesystem.getacl` says about `path`, with ids resolved to names.
 *
 * The same call the editor and the Permissions card make, so a test reads what
 * they read.
 */
export async function readAcl(client: E2eApiClient, path: string): Promise<AclRead> {
  return firstValueFrom(
    client.api.call('filesystem.getacl', [path, true, true]).pipe(timeout(readTimeoutMs)),
  );
}

/**
 * The template called `name`, as the preset picker on `path` offers it.
 *
 * `filesystem.acltemplate.by_path` with the picker's own `resolve_names`, so the
 * entries are the ones choosing it in the UI puts into the form. Throws when the
 * path is not offered it, which would otherwise read as an empty ACL.
 */
export async function readAclTemplate(client: E2eApiClient, path: string, name: string): Promise<AclTemplate> {
  // Every template, filtered here, exactly as the picker asks for them.
  const templates = await firstValueFrom(
    client.api.call('filesystem.acltemplate.by_path', [{
      path,
      'format-options': { resolve_names: true },
    }]).pipe(timeout(readTimeoutMs)),
  );
  const template = templates.find((candidate) => candidate.name === name);

  if (!template) {
    throw new Error(`"${path}" is not offered the ACL preset "${name}".`);
  }

  return template;
}

/**
 * Sets the owner, group and mode of `path`, as a precondition.
 *
 * `stripacl` as well, so the path is left with a trivial ACL whatever the dataset was created with.
 * The Permissions card offers the Unix editor only for a trivial one, and sends anything else to
 * the ACL editor instead.
 */
export async function setOwnership(client: E2eApiClient, path: string, ownership: Ownership): Promise<void> {
  await runJob(
    client,
    () => client.api.callAndGetJobId('filesystem.setperm', [{
      path,
      mode: ownership.mode,
      user: ownership.user,
      group: ownership.group,
      options: { stripacl: true },
    }]),
    {
      timeoutMs: slowCallTimeoutMs,
      whatItCosts: `${path} does not have the owner and mode the test starts from`,
    },
  );
}
