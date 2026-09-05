import {
  S3Access,
  S3AccessKeyStatus,
  S3AuditOverflow,
  S3LogLevel,
  S3MultipartEtag,
  S3ObjectLockMode,
  S3PermissionsModel,
  S3PrincipalType,
  S3Versioning,
} from 'app/enums/s3.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';

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

export interface S3Listener {
  address: string;
  port: number;
  tls: boolean;
}

export interface S3Config {
  id: number;
  listeners: S3Listener[];
  servers: number;
  certificate: number | null;
  region: string;
  log_level: S3LogLevel;
  default_audit: S3AuditMask;
  default_audit_overflow: S3AuditOverflow;
  global_grants: S3GrantEntry[];
}

export interface S3ConfigUpdate extends Partial<Omit<S3Config, 'id' | 'global_grants'>> {
  global_grants?: S3Grant[];
}

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
}

export interface S3BucketCreate extends Partial<Omit<S3Bucket, 'id' | 'owner_uid' | 'grants' | 'locked'>> {
  name: string;
  dataset: string;
  owner: string;
  grants?: S3Grant[];
}

export type S3BucketUpdate = Partial<Omit<S3BucketCreate, 'dataset'>>;

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
  status: S3AccessKeyStatus;
}

export interface S3AccessKeyCreate {
  name: string;
  username: string;
  enabled?: boolean;
  expires_at?: ApiTimestamp | null;
  access_key?: string | null;
  secret?: string | null;
}

export interface S3AccessKeyUpdate {
  name?: string;
  enabled?: boolean;
  expires_at?: ApiTimestamp | null;
  rotate?: boolean;
}
