import { CallParams, CallResponse } from '@truenas/api-client';
import {
  S3Access,
  S3AccessKeyStatus,
  S3AuditOverflow,
  S3MultipartEtag,
  S3ObjectLockMode,
  S3ObjectOwnership,
  S3PermissionsModel,
  S3PrincipalType,
  S3Versioning,
} from 'app/enums/s3.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { SharingTierInfo } from 'app/interfaces/zfs-tier.interface';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

/**
 * A list of audit action names, or the literal `ALL`.
 */
export type S3AuditMask = string[] | 'ALL';

export interface S3Grant {
  principal_type: S3PrincipalType;
  /**
   * uid of the user or gid of the group. `null` for `EVERYONE`.
   */
  xid: number | null;
  access: S3Access;
}

export interface S3GrantEntry extends S3Grant {
  /**
   * Resolved user or group name. Empty for `EVERYONE`.
   */
  name: string;
}

/** The S3 service's settings, as `s3.config` returns them. */
export type S3Config = CallResponse<WebUiApiDirectory, 's3.config'>;

export type S3ConfigUpdate = CallParams<WebUiApiDirectory, 's3.update'>[0];

export type S3Listener = NonNullable<S3Config['listeners']>[number];

export interface S3Bucket {
  id: number;
  name: string;
  /**
   * ZFS dataset name, e.g. `tank/buckets/photos`.
   */
  dataset: string;
  enabled: boolean;
  owner: string;
  owner_uid: number;
  grants: S3GrantEntry[];
  permissions_model: S3PermissionsModel;
  object_ownership: S3ObjectOwnership;
  versioning: S3Versioning;
  snapshot_versions: string[];
  snapshot_versions_max: number;
  multipart_etag: S3MultipartEtag;
  object_lock: boolean;
  object_lock_default_mode: S3ObjectLockMode | null;
  object_lock_default_days: number | null;
  audit: S3AuditMask | null;
  audit_overflow: S3AuditOverflow | null;
  locked: boolean | null;
  /**
   * `null` when TrueNAS is unlicensed, tiering is disabled, or the pool has no SPECIAL vdev. Read only.
   */
  tier?: SharingTierInfo | null;
}

export interface S3BucketCreate extends Partial<Omit<S3Bucket, 'id' | 'owner_uid' | 'grants' | 'locked' | 'tier'>> {
  name: string;
  /**
   * Omitted, the dataset is created under the service's `managed_root_dataset` and named after the bucket.
   */
  dataset?: string;
  owner: string;
  grants?: S3Grant[];
}

export type S3BucketUpdate = Partial<Omit<S3BucketCreate, 'dataset'>>;

/**
 * Reads a `sharing.s3.query` row, or the bucket `sharing.s3.create` / `update` return, into the UI's `S3Bucket`.
 * The generated entry spells the enums and the audit actions as wire literals and leaves the fields middleware
 * defaults optional; it describes the same object.
 */
export function toS3Bucket(
  entry: WebUiQueryEntity<'sharing.s3.query'>,
): S3Bucket {
  return entry as S3Bucket;
}

/** What `sharing.s3.create` takes, as middleware declares it. */
export type S3BucketCreateArgs = CallParams<WebUiApiDirectory, 'sharing.s3.create'>[0];

/** What `sharing.s3.update` takes as its changes, as middleware declares it. */
export type S3BucketUpdateArgs = CallParams<WebUiApiDirectory, 'sharing.s3.update'>[1];

/**
 * Hands the bucket form's payload to `sharing.s3.create` unchanged. Middleware narrows `audit` to the actions it
 * knows; the form sends what `sharing.s3.audit_choices` offered, typed as strings.
 */
export function toS3BucketCreateArgs(payload: S3BucketCreate): S3BucketCreateArgs {
  return payload as S3BucketCreateArgs;
}

/** {@link toS3BucketCreateArgs} for `sharing.s3.update`. */
export function toS3BucketUpdateArgs(payload: S3BucketUpdate): S3BucketUpdateArgs {
  return payload as S3BucketUpdateArgs;
}

export interface S3AccessKey {
  id: number;
  name: string;
  username: string | null;
  user_identifier: number | string;
  local: boolean;
  access_key: string;
  /**
   * Readable with `SHARING_S3_WRITE`, redacted otherwise. `null` when lost to a config restore.
   */
  secret: string | null;
  enabled: boolean;
  expires_at: ApiTimestamp | null;
  created_at: ApiTimestamp;
  /**
   * When the S3 service last accepted a request signed with this key. Reported at intervals, so a
   * recent request may be missing for a short time. `null` if never used. Read-only.
   */
  last_used_at: ApiTimestamp | null;
  /**
   * Whether the key may create and delete buckets through the S3 protocol. Requires the owning
   * account to hold `SHARING_S3_WRITE`, checked when turned on.
   */
  manage_buckets: boolean;
  status: S3AccessKeyStatus;
}

export interface S3AccessKeyCreate {
  name: string;
  username: string;
  enabled?: boolean;
  expires_at?: ApiTimestamp | null;
  access_key?: string | null;
  secret?: string | null;
  manage_buckets?: boolean;
}

export interface S3AccessKeyUpdate {
  name?: string;
  enabled?: boolean;
  expires_at?: ApiTimestamp | null;
  manage_buckets?: boolean;
  rotate?: boolean;
}

/**
 * Reads an `s3.accesskey.query` row, or the key `s3.accesskey.create` / `update` return, into the UI's
 * `S3AccessKey`. The generated entry types the timestamps as strings where the wire carries `{ $date }`
 * envelopes (gap 15), and `status` as the wire literal; it describes the same object.
 */
export function toS3AccessKey(
  entry: WebUiQueryEntity<'s3.accesskey.query'>,
): S3AccessKey {
  return entry as unknown as S3AccessKey;
}

/** What `s3.accesskey.create` takes, as middleware declares it. */
export type S3AccessKeyCreateArgs = CallParams<WebUiApiDirectory, 's3.accesskey.create'>[0];

/** What `s3.accesskey.update` takes as its changes, as middleware declares it. */
export type S3AccessKeyUpdateArgs = CallParams<WebUiApiDirectory, 's3.accesskey.update'>[1];

/**
 * Hands the form's payload to `s3.accesskey.create` unchanged. Middleware declares `expires_at` as a string; the
 * wire takes the `{ $date }` envelope the form sends, and `null` for a key that does not expire (gap 15).
 */
export function toS3AccessKeyCreateArgs(payload: S3AccessKeyCreate): S3AccessKeyCreateArgs {
  return payload as unknown as S3AccessKeyCreateArgs;
}

/** {@link toS3AccessKeyCreateArgs} for `s3.accesskey.update`. */
export function toS3AccessKeyUpdateArgs(payload: S3AccessKeyUpdate): S3AccessKeyUpdateArgs {
  return payload as unknown as S3AccessKeyUpdateArgs;
}
