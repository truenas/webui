import { CallParams, CallResponse } from '@truenas/api-client';
import { DatasetPreset, DatasetType } from 'app/enums/dataset.enum';
import { inherit } from 'app/enums/with-inherit.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { Dataset, DatasetCreate, DatasetUpdate } from 'app/interfaces/dataset.interface';
import { ZfsProperty } from 'app/interfaces/zfs-property.interface';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

/*
 * The storage pages are written against the shape `pool.dataset.query` returned: each property as
 * `{ parsed, rawvalue, value, source }` with upper-case enum values, and the payloads `pool.dataset.create` and
 * `update` took. `zfs.resource.*` speaks native ZFS instead. These helpers translate at the call, the same way
 * middleware's own `pool.dataset` compatibility wrapper does (plugins/pool_/dataset.py and dataset_query_utils.py),
 * so the forms keep their model while every request goes to `zfs.resource`.
 */

export type ZfsResourceEntry = CallResponse<WebUiApiDirectory, 'zfs.resource.list'>[number];
export type ZfsResourceQuery = NonNullable<CallParams<WebUiApiDirectory, 'zfs.resource.list'>[0]>;
export type ZfsResourceCreateArgs = CallParams<WebUiApiDirectory, 'zfs.resource.create'>[0];
export type ZfsResourceSetArgs = CallParams<WebUiApiDirectory, 'zfs.resource.set'>[0];
type ZfsPropertyValue = NonNullable<NonNullable<ZfsResourceEntry['properties']>['used']>;

/**
 * The properties the storage pages read, which is what `pool.dataset.query` returned by default plus `mounted`.
 * Asking for `encryption` returns all five encryption properties. A property that doesn't apply to the dataset's
 * type is dropped by middleware.
 */
export const datasetProperties = [
  'aclmode', 'acltype', 'atime', 'available', 'casesensitivity', 'checksum', 'compression', 'compressratio',
  'copies', 'dedup', 'encryption', 'exec', 'mounted', 'mountpoint', 'origin', 'pbkdf2iters', 'quota', 'readonly',
  'recordsize', 'refquota', 'refreservation', 'reservation', 'snapdev', 'snapdir', 'special_small_blocks', 'sync',
  'used', 'usedbychildren', 'usedbydataset', 'usedbyrefreservation', 'usedbysnapshots', 'volblocksize', 'volsize',
  'xattr',
];

/** Native names the storage pages know by their `pool.dataset` names. */
const renamedProperties: Record<string, string> = {
  dedup: 'deduplication',
  encryption: 'encryption_algorithm',
  keyformat: 'key_format',
  special_small_blocks: 'special_small_block_size',
};

const sizeProperties = new Set([
  'available', 'quota', 'refquota', 'refreservation', 'reservation', 'used', 'usedbychildren', 'usedbydataset',
  'usedbyrefreservation', 'usedbysnapshots', 'volsize',
]);
const onOffProperties = new Set(['atime', 'checksum', 'exec', 'readonly', 'xattr']);
const zeroIsUnsetProperties = new Set(['quota', 'refquota', 'refreservation', 'reservation']);
const integerProperties = new Set([
  'available', 'copies', 'recordsize', 'special_small_block_size', 'used', 'usedbychildren', 'usedbydataset',
  'usedbyrefreservation', 'usedbysnapshots', 'volblocksize', 'volsize',
]);
const sizeUnits = ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

/** Formats bytes the way `pool.dataset.query` did for its size properties: `'2 GiB'`, `'1.5 KiB'`, `'512 bytes'`. */
export function formatZfsSize(bytes: number): string {
  if (bytes < 1024) {
    return bytes === 1 ? '1 byte' : `${bytes} bytes`;
  }
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < sizeUnits.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${Number(value.toFixed(2))} ${sizeUnits[unit]}`;
}

/** `131072` → `'128K'`, as `recordsize` and `volblocksize` read in `pool.dataset.query`. */
export function formatBlockSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${Math.trunc(bytes / (1024 * 1024))}M`;
  }
  if (bytes >= 1024) {
    return `${Math.trunc(bytes / 1024)}K`;
  }
  return String(bytes);
}

const blockSizeSuffixes: Record<string, number> = {
  '': 1, B: 1, K: 1024, M: 1024 ** 2, G: 1024 ** 3, T: 1024 ** 4,
};

/** `'128K'` → `131072`. The forms hold record and block sizes as the strings the `*_choices` calls list. */
export function parseBlockSize(size: string | number): number {
  if (typeof size === 'number') {
    return size;
  }
  const match = /^(\d+)\s*([BKMGT]?)i?B?$/i.exec(size.trim());
  if (!match) {
    throw new Error(`Cannot read block size "${size}".`);
  }
  return Number(match[1]) * blockSizeSuffixes[match[2].toUpperCase()];
}

/**
 * Reads one `zfs.resource` property into the legacy `{ parsed, rawvalue, value, source }` form, by the rules
 * `normalize_zfs_properties` in middleware applied for `pool.dataset.query`.
 */
export function toLegacyZfsProperty(name: string, property: ZfsPropertyValue): ZfsProperty<unknown> {
  const raw = property.raw;
  let parsed: unknown = raw;
  let value: unknown = raw.toUpperCase();
  let rawvalue = raw;

  if (onOffProperties.has(name)) {
    const onOff: Record<string, boolean> = { on: true, off: false };
    parsed = onOff[raw] ?? null;
  } else if (zeroIsUnsetProperties.has(name)) {
    if (raw === '0') {
      parsed = null;
      value = null;
    } else {
      parsed = Number(raw);
      value = formatZfsSize(Number(raw));
    }
  } else if (integerProperties.has(name) && /^\d+$/.test(raw)) {
    parsed = Number(raw);
    if (name === 'recordsize' || name === 'volblocksize') {
      value = formatBlockSize(Number(raw));
    } else if (sizeProperties.has(name)) {
      value = formatZfsSize(Number(raw));
    }
  } else if (name === 'compressratio') {
    value = `${raw}x`;
  } else if (name === 'encryption_algorithm' && raw === 'off') {
    value = null;
  } else if (name === 'key_format' && raw === 'none') {
    value = null;
  } else if (name === 'origin' && raw === 'none') {
    parsed = '';
    rawvalue = '';
    value = '';
  } else if (name === 'mounted') {
    parsed = property.value;
  }

  return {
    parsed,
    rawvalue,
    value,
    source: (property.source?.type ?? ZfsPropertySource.None) as ZfsPropertySource,
  };
}

/**
 * Reads a `zfs.resource.list` row into `Dataset`, deriving the top-level fields `pool.dataset.query` used to send.
 * Request {@link datasetProperties} with `get_source` and `get_user_properties` for a complete row.
 */
export function zfsResourceToDataset(row: ZfsResourceEntry): Dataset {
  const properties = (row.properties ?? {}) as Record<string, ZfsPropertyValue | undefined>;
  const dataset: Record<string, unknown> = {
    id: row.name,
    name: row.name,
    pool: row.pool,
    type: row.type as DatasetType,
  };

  Object.entries(properties).forEach(([nativeName, property]) => {
    if (!property || nativeName === 'mountpoint' || nativeName === 'encryptionroot') {
      return;
    }
    const name = renamedProperties[nativeName] ?? nativeName;
    dataset[name] = toLegacyZfsProperty(name, property);
  });

  dataset.mountpoint = row.type === 'FILESYSTEM' ? properties.mountpoint?.raw ?? null : null;

  if (properties.encryption) {
    const encrypted = properties.encryption.raw !== 'off';
    const keystatus = properties.keystatus?.raw;
    dataset.encrypted = encrypted;
    dataset.locked = encrypted && keystatus === 'unavailable';
    dataset.key_loaded = encrypted && keystatus === 'available';
    dataset.encryption_root = encrypted ? properties.encryptionroot?.raw ?? null : null;
  }

  if (row.user_properties) {
    dataset.user_properties = Object.fromEntries(
      Object.entries(row.user_properties).map(([key, userValue]) => [key, {
        parsed: userValue,
        rawvalue: userValue,
        value: userValue,
        source: ZfsPropertySource.Local,
      }]),
    );
  }

  if (Array.isArray(row.children)) {
    dataset.children = (row.children as ZfsResourceEntry[]).map(zfsResourceToDataset);
  }

  return dataset as unknown as Dataset;
}

/** The managed user properties the forms send under their `pool.dataset` names, with the key ZFS stores. */
const userPropertyKeys: Record<string, string> = {
  comments: 'org.freenas:description',
  managedby: 'org.truenas:managedby',
  quota_warning: 'org.freenas:quota_warning',
  quota_critical: 'org.freenas:quota_critical',
  refquota_warning: 'org.freenas:refquota_warning',
  refquota_critical: 'org.freenas:refquota_critical',
};

/** Fields of the legacy payloads that are ZFS properties, by their native name. */
const nativePropertyNames: Record<string, string> = {
  aclmode: 'aclmode',
  acltype: 'acltype',
  atime: 'atime',
  casesensitivity: 'casesensitivity',
  checksum: 'checksum',
  compression: 'compression',
  copies: 'copies',
  deduplication: 'dedup',
  exec: 'exec',
  quota: 'quota',
  readonly: 'readonly',
  recordsize: 'recordsize',
  refquota: 'refquota',
  refreservation: 'refreservation',
  reservation: 'reservation',
  snapdev: 'snapdev',
  snapdir: 'snapdir',
  special_small_block_size: 'special_small_blocks',
  sync: 'sync',
  volblocksize: 'volblocksize',
  volsize: 'volsize',
};

/** Properties that are cleared with 0 rather than inherited. */
const notInheritable = new Set(['quota', 'refquota', 'refreservation', 'reservation', 'volsize', 'volblocksize']);

function toNativeValue(nativeName: string, value: unknown): string | number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (nativeName === 'recordsize' || nativeName === 'volblocksize') {
    return parseBlockSize(value as string | number);
  }
  if (nativeName === 'copies') {
    return Number(value);
  }
  return typeof value === 'string' ? value.toLowerCase() : value as number;
}

interface TranslatedPayload {
  properties: Record<string, string | number>;
  userProperties: Record<string, string>;
  inherit: string[];
}

function translatePayload(payload: Partial<DatasetCreate> | Partial<DatasetUpdate>): TranslatedPayload {
  const result: TranslatedPayload = { properties: {}, userProperties: {}, inherit: [] };

  Object.entries(payload).forEach(([field, value]) => {
    if (value === undefined) {
      return;
    }
    const userKey = userPropertyKeys[field];
    const nativeName = nativePropertyNames[field];
    if (!userKey && !nativeName) {
      return;
    }

    // A cleared user property (`null`, e.g. an emptied alert threshold) has no value to write; ZFS would store the
    // literal "null". It is inherited instead, which on create simply leaves it unset.
    if (value === inherit || (userKey && value === null)) {
      if (userKey) {
        result.inherit.push(userKey);
      } else if (!notInheritable.has(nativeName)) {
        result.inherit.push(nativeName);
      }
      return;
    }

    if (userKey) {
      result.userProperties[userKey] = String(value);
    } else {
      result.properties[nativeName] = toNativeValue(nativeName, value);
    }
  });

  return result;
}

/**
 * Translates the dataset and zvol forms' `pool.dataset.create` payload into `zfs.resource.create`, as middleware's
 * `translate_create` does. `INHERIT` and omitted fields are left out so ZFS inherits them, `share_type` sets the
 * preset instead of `GENERIC`, and a sparse zvol is created without a reservation.
 */
export function toZfsResourceCreate(payload: DatasetCreate): ZfsResourceCreateArgs {
  const { properties, userProperties } = translatePayload(payload);

  (payload.user_properties || []).forEach(({ key, value }) => {
    userProperties[key] = value;
  });

  if (payload.sparse) {
    properties.refreservation = 0;
  }

  const shareType = payload.share_type && payload.share_type !== DatasetPreset.Generic
    ? payload.share_type.toLowerCase() as ZfsResourceCreateArgs['share_type']
    : null;

  const args: ZfsResourceCreateArgs = {
    path: payload.name,
    type: payload.type ?? DatasetType.Filesystem,
    properties: properties as ZfsResourceCreateArgs['properties'],
    user_properties: userProperties,
    create_ancestors: payload.create_ancestors ?? false,
    share_type: shareType,
    force_size: payload.force_size ?? false,
  };

  if (payload.encryption && payload.encryption_options) {
    args.encryption = payload.encryption_options;
  }

  return args;
}

/**
 * Translates a `pool.dataset.update` payload into `zfs.resource.set`, as middleware's `translate_update` does.
 * `INHERIT` becomes an entry in `inherit`; `user_properties_update` entries are written, or inherited to remove them.
 */
export function toZfsResourceSet(path: string, payload: DatasetUpdate): ZfsResourceSetArgs {
  const { properties, userProperties, inherit: inheritList } = translatePayload(payload);

  (payload.user_properties_update || []).forEach((update) => {
    if (update.remove) {
      inheritList.push(update.key);
    } else {
      userProperties[update.key] = update.value;
    }
  });

  return {
    path,
    properties: properties as ZfsResourceSetArgs['properties'],
    user_properties: userProperties,
    inherit: inheritList,
    force_size: payload.force_size ?? false,
  };
}

/**
 * `zfs.resource.create` / `set` report errors under native names (`properties.dedup`, `user_properties.<key>`,
 * `path`); this maps the leaf of each onto the form control that sends it, for `FormErrorHandlerService`.
 */
export const zfsResourceErrorFields: Record<string, string> = {
  // An error on the call as a whole (`zfs.resource.create`), e.g. a read-only parent, is about the new name.
  create: 'name',
  path: 'name',
  dedup: 'deduplication',
  special_small_blocks: 'special_small_block_size',
  'freenas:description': 'comments',
  'truenas:managedby': 'managedby',
  'freenas:quota_warning': 'quota_warning',
  'freenas:quota_critical': 'quota_critical',
  'freenas:refquota_warning': 'refquota_warning',
  'freenas:refquota_critical': 'refquota_critical',
};

/** `pool.dataset` listed `*_choices` in upper case, which is how the forms hold those values. */
export function toUpperCaseChoices(choices: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.keys(choices).map((key) => [key.toUpperCase(), key.toUpperCase()]));
}
