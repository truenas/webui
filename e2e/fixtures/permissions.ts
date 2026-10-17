/**
 * A dataset's owner, group and Unix mode, and its NFSv4 and POSIX ACL entries, over the API.
 *
 * Provisioning only, plus the reads a test asserts against. Changing them is what
 * `tests/dataset-permissions.e2e.ts` and `tests/smb-share-acl.e2e.ts` drive through the UI, so
 * nothing here may stand in for it.
 * Permissions have no teardown of their own: they live on the dataset's mountpoint, and the spec
 * deletes the dataset. Custom ACL templates are the exception. They are global to the appliance and
 * outlive every dataset, so they are created and deleted here.
 */
import type { CallParams, CallResponse } from '@truenas/api-client';
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

/** The entries of an NFSv4 ACL. Throws on any other kind, which would mean the wrong dataset. */
export function nfs4Entries(acl: AclRead): Nfs4Ace[] {
  if (acl.acltype !== 'NFS4') {
    throw new Error(`Expected an NFSv4 ACL, found ${acl.acltype}.`);
  }
  return acl.acl;
}

/** An entry of a POSIX.1e ACL: `tag`, `id`, `default` and `perms` of READ, WRITE and EXECUTE. */
export type PosixAce = Extract<AclRead, { acltype: 'POSIX1E' }>['acl'][number];

/** The entries of a POSIX.1e ACL, access and default together. Throws on any other kind. */
export function posixEntries(acl: AclRead): PosixAce[] {
  if (acl.acltype !== 'POSIX1E') {
    throw new Error(`Expected a POSIX.1e ACL, found ${acl.acltype}.`);
  }
  return acl.acl;
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

/** The fields that make two entries the same entry. Optional where the generated type has them so. */
export interface AceShape {
  tag: string;
  type: string;
  perms?: unknown;
  flags?: unknown;
  who?: string | null;
}

/**
 * An entry reduced to what it grants and to whom.
 *
 * `owner@`, `group@` and `everyone@` are kept by tag alone. Their `who` is at
 * most the path's owner or group, which the two calls need not fill in alike,
 * and it is not something a preset chooses. A USER or GROUP entry is kept by the
 * name it resolves to.
 */
function shapeOf(ace: AceShape): AceShape {
  const shape: AceShape = {
    tag: ace.tag,
    type: ace.type,
    perms: ace.perms,
    flags: ace.flags,
  };
  if (ace.tag === 'USER' || ace.tag === 'GROUP') {
    shape.who = ace.who;
  }
  return shape;
}

/** Entries as comparable shapes, in a stable order so a reordering is not a difference. */
export function shapesOf(entries: AceShape[]): AceShape[] {
  return entries
    .map(shapeOf)
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
}

/** A template's entries. The response types them as a union across ACL kinds. */
export function templateEntries(template: AclTemplate): AceShape[] {
  if (template.acltype !== 'NFS4') {
    throw new Error(`Expected an NFSv4 template, found ${template.acltype} for "${template.name}".`);
  }
  return template.acl as unknown as AceShape[];
}

/**
 * One row of `filesystem.acltemplate.query`, with the id `filesystem.acltemplate.delete` needs
 * narrowed, as `GroupRecord` does in `fixtures/groups.ts`.
 */
export type AclTemplateRecord = Extract<
  CallResponse<E2eApiDirectory, 'filesystem.acltemplate.query'>, unknown[]
>[number] & { id: number };

/** What `filesystem.acltemplate.create` takes. */
export type AclTemplateCreate = NonNullable<CallParams<E2eApiDirectory, 'filesystem.acltemplate.create'>[0]>;

/**
 * The ACL template called `name`, built-in or custom, or undefined.
 *
 * `query`, not `queryOne`: absence is the normal answer, and `queryOne` errors on it.
 */
export async function findAclTemplate(client: E2eApiClient, name: string): Promise<AclTemplateRecord | undefined> {
  const [template] = await firstValueFrom(
    client.api.query('filesystem.acltemplate.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  return template as AclTemplateRecord | undefined;
}

/**
 * Creates a custom ACL template if none is called `template.name`.
 *
 * Templates are global to the appliance and outlive any dataset, so whatever creates one deletes it
 * again with {@link ensureAclTemplateAbsent}.
 */
export async function ensureAclTemplatePresent(client: E2eApiClient, template: AclTemplateCreate): Promise<void> {
  if (await findAclTemplate(client, template.name)) {
    return;
  }

  await firstValueFrom(
    client.api.call('filesystem.acltemplate.create', [template]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/** Deletes the ACL template called `name`, if present. */
export async function ensureAclTemplateAbsent(client: E2eApiClient, name: string): Promise<void> {
  const existing = await findAclTemplate(client, name);

  if (!existing) {
    return;
  }

  await firstValueFrom(
    client.api.call('filesystem.acltemplate.delete', [existing.id]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Applies the POSIX template `name` to `path`, as a precondition, so its ACL is not trivial.
 *
 * The template's entries as `filesystem.acltemplate.by_path` serves them, ids and all, sent through
 * `filesystem.setacl`. Choosing a preset in the editor is what a test of presets drives instead.
 */
export async function applyPosixAclTemplate(client: E2eApiClient, path: string, name: string): Promise<void> {
  const template = await readAclTemplate(client, path, name);
  if (template.acltype !== 'POSIX1E') {
    throw new Error(`"${name}" is a ${template.acltype} template, where a POSIX one was expected.`);
  }

  await runJob(
    client,
    () => client.api.callAndGetJobId('filesystem.setacl', [{
      path,
      dacl: template.acl,
      acltype: template.acltype,
      options: { recursive: false },
    }]),
    {
      timeoutMs: slowCallTimeoutMs,
      whatItCosts: `${path} does not have the ${name} ACL the test starts from`,
    },
  );
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
