import { S3Bucket } from 'app/interfaces/s3.interface';

/**
 * A bucket is its dataset, mounted where every dataset is. Shapes it for the share
 * availability helpers, which reason about mount paths.
 */
export function bucketToShareRow(bucket: S3Bucket): { locked: boolean; path: string } {
  return {
    locked: Boolean(bucket.locked),
    path: `/mnt/${bucket.dataset}`,
  };
}

/**
 * Where a bucket's objects live on disk: the `s3data` directory inside the
 * bucket's dataset, which is what a filesystem ACL for the bucket's contents
 * applies to. The dataset root itself holds the service's own metadata beside
 * it and is not what an administrator means by "the bucket's files".
 */
export function bucketDataPath(bucket: S3Bucket): string {
  return `${bucketToShareRow(bucket).path}/s3data`;
}
