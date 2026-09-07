/**
 * The S3 surface, which `@truenas/api-client` does not generate yet.
 *
 * Checked against 3.0.2 (installed) and 4.0.2 (latest on npm, 2026-09): neither
 * v27 directory carries a `sharing.s3.*` or `s3.accesskey.*` entry, because the
 * generator ran before middleware grew the service. The S3 fixtures need them
 * for setup and teardown, so this declares exactly what they call, in the shape
 * the generated directory uses, and `E2eApiDirectory` in `client.ts` merges it
 * in. It is a stopgap, not a second directory: delete this file the day the
 * client ships these methods, and the merge falls away with it.
 *
 * The shapes follow `src/app/interfaces/s3.interface.ts`, trimmed to the fields
 * the suite reads. Only what is *read* is declared — the tests create buckets
 * and keys through the UI, never through these.
 */

export interface S3BucketEntry {
  id: number;
  name: string;
  /** The bucket's own dataset, `<parent>/<name>`, created with the bucket. */
  dataset: string;
  owner: string;
  enabled: boolean;
  /** `S3` | `MULTIPROTOCOL` | `BUCKET_OWNER_ENFORCED` */
  permissions_model: string;
  /** `OFF` | `ENABLED` | `SUSPENDED` */
  versioning: string;
  object_lock: boolean;
  /** `COMPLIANCE` | `GOVERNANCE`, or null for no default retention rule. */
  object_lock_default_mode: string | null;
  object_lock_default_days: number | null;
  locked: boolean;
}

export interface S3AccessKeyEntry {
  id: number;
  name: string;
  /** Null once the account it belonged to has been deleted. */
  username: string | null;
  access_key: string;
  enabled: boolean;
  expires_at: { $date: number } | null;
  /** `ENABLED` | `DISABLED` | `EXPIRED` */
  status: string;
}

/**
 * Entries in the generated directory's own vocabulary: `params` and `response`
 * for `call`, plus `entity` on the two collections so `client.api.query` accepts
 * them and types their filters.
 */
export interface S3CallDirectoryDelta {
  'sharing.s3.query': {
    params: [filters?: unknown[], options?: unknown];
    response: S3BucketEntry[];
    entity: S3BucketEntry;
  };
  'sharing.s3.delete': {
    params: [id: number];
    response: boolean;
  };
  's3.accesskey.query': {
    params: [filters?: unknown[], options?: unknown];
    response: S3AccessKeyEntry[];
    entity: S3AccessKeyEntry;
  };
  's3.accesskey.delete': {
    params: [id: number];
    response: boolean;
  };
}
