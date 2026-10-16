/**
 * Kerberos realm and keytab preconditions, cleanup and readback, over the API.
 *
 * Middleware holds both unique by name — a realm case-insensitively — so these
 * helpers key on the name. Every realm here is under `.TEST`, which RFC 2606
 * reserves, so no KDC the names point at can exist. Nothing needs one: saving a
 * realm only rewrites `krb5.conf`, and no directory service is joined on the CI
 * appliance to read it.
 *
 * A keytab is checked when it is saved: middleware base64-decodes it, runs
 * `klist -ket` over the bytes and refuses a file that lists no entries. So
 * arbitrary bytes are not enough, and {@link buildKeytab} writes the smallest file
 * `klist` accepts.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** A realm as middleware reports it, with its id narrowed — see `GroupRecord`. */
type KerberosRealmEntry = Extract<CallResponse<E2eApiDirectory, 'kerberos.realm.query'>, unknown[]>[number];

export type KerberosRealmRecord = KerberosRealmEntry & { id: number };

/** A keytab as middleware reports it, with its id narrowed — see `GroupRecord`. */
type KerberosKeytabEntry = Extract<CallResponse<E2eApiDirectory, 'kerberos.keytab.query'>, unknown[]>[number];

export type KerberosKeytabRecord = KerberosKeytabEntry & { id: number };

/** What a realm is set up with, the way the form asks for it. */
export interface KerberosRealmSettings {
  realm: string;
  primaryKdc: string;
  kdc: string[];
  adminServer: string[];
  passwordServer: string[];
}

/**
 * The appliance's own record of a realm, or undefined.
 *
 * `query`, not `queryOne` — absence is an ordinary answer here.
 */
export async function findKerberosRealm(
  client: E2eApiClient,
  realm: string,
): Promise<KerberosRealmRecord | undefined> {
  const realms = await firstValueFrom(
    client.api.query('kerberos.realm.query', [['realm', '=', realm]]).pipe(timeout(readTimeoutMs)),
  );

  return (realms as KerberosRealmRecord[])[0];
}

/** Removes a realm, if there is one. */
export async function ensureKerberosRealmAbsent(client: E2eApiClient, realm: string): Promise<void> {
  const found = await findKerberosRealm(client, realm);
  if (!found) {
    return;
  }

  await firstValueFrom(client.api.call('kerberos.realm.delete', [found.id]).pipe(timeout(slowCallTimeoutMs)));
}

/**
 * Creates a realm, if there is none by that name already.
 *
 * For the realm an edit or a delete acts on, and for a bystander. Never for the
 * realm under test in a create — that one goes through the form.
 */
export async function ensureKerberosRealmPresent(
  client: E2eApiClient,
  settings: KerberosRealmSettings,
): Promise<void> {
  if (await findKerberosRealm(client, settings.realm)) {
    return;
  }

  await firstValueFrom(
    client.api.call('kerberos.realm.create', [{
      realm: settings.realm,
      primary_kdc: settings.primaryKdc,
      kdc: settings.kdc,
      admin_server: settings.adminServer,
      kpasswd_server: settings.passwordServer,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/** The appliance's own record of a keytab, or undefined. */
export async function findKerberosKeytab(
  client: E2eApiClient,
  name: string,
): Promise<KerberosKeytabRecord | undefined> {
  const keytabs = await firstValueFrom(
    client.api.query('kerberos.keytab.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  return (keytabs as KerberosKeytabRecord[])[0];
}

/** Removes a keytab, if there is one. */
export async function ensureKerberosKeytabAbsent(client: E2eApiClient, name: string): Promise<void> {
  const found = await findKerberosKeytab(client, name);
  if (!found) {
    return;
  }

  await firstValueFrom(client.api.call('kerberos.keytab.delete', [found.id]).pipe(timeout(slowCallTimeoutMs)));
}

/**
 * Uploads a keytab, if there is none by that name already. For the keytab a
 * delete acts on; never for the one under test in an add.
 */
export async function ensureKerberosKeytabPresent(
  client: E2eApiClient,
  name: string,
  contents: Buffer,
): Promise<void> {
  if (await findKerberosKeytab(client, name)) {
    return;
  }

  await firstValueFrom(
    client.api.call('kerberos.keytab.create', [{ name, file: contents.toString('base64') }])
      .pipe(timeout(slowCallTimeoutMs)),
  );
}

/** A big-endian unsigned integer of `bytes` bytes. */
function uint(value: number, bytes: 1 | 2 | 4): Buffer {
  const buffer = Buffer.alloc(bytes);
  buffer.writeUIntBE(value, 0, bytes);
  return buffer;
}

/** A keytab "counted octet string": its length in two bytes, then the bytes. */
function counted(value: Buffer): Buffer {
  return Buffer.concat([uint(value.length, 2), value]);
}

/** `KRB5_NT_PRINCIPAL`. */
const principalNameType = 1;

/** `aes256-cts-hmac-sha1-96`, whose key is 32 bytes. */
const aes256Enctype = 18;
const aes256KeyBytes = 32;

/** 2026-01-01T00:00:00Z. Fixed, so the file is the same on every run. */
const keytabTimestamp = 1_767_225_600;

/**
 * An MIT keytab (format `0x0502`) holding one entry for `principal@realm`.
 *
 * `klist -ket` reads the principal, the key version, the timestamp and the
 * enctype — and never the key itself, so the key is zeros. That is enough for
 * middleware, which only asks whether `klist` lists anything. The file is never
 * used to authenticate.
 *
 * Each entry is its length in four bytes, then: the component count, the realm,
 * each component, the name type, the timestamp, an 8-bit key version, the
 * enctype, the key, and a 32-bit key version.
 */
export function buildKeytab(principal: string, realm: string): Buffer {
  const components = principal.split('/');
  const keyVersion = 1;

  const entry = Buffer.concat([
    uint(components.length, 2),
    counted(Buffer.from(realm)),
    ...components.map((component) => counted(Buffer.from(component))),
    uint(principalNameType, 4),
    uint(keytabTimestamp, 4),
    uint(keyVersion, 1),
    uint(aes256Enctype, 2),
    counted(Buffer.alloc(aes256KeyBytes)),
    uint(keyVersion, 4),
  ]);

  return Buffer.concat([Buffer.from([0x05, 0x02]), uint(entry.length, 4), entry]);
}
