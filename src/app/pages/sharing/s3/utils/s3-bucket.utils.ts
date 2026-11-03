import { S3BucketLayout } from 'app/enums/s3.enum';
import { S3Bucket } from 'app/interfaces/s3.interface';

export const s3BucketNamePattern = /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/;

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
 * Where a bucket's objects live on disk, which is what a filesystem ACL for the bucket's contents applies to.
 * A `BUCKET` layout keeps them in the `s3data` directory: the dataset root holds the service's own metadata
 * beside it and is not what an administrator means by "the bucket's files". A `DATASET` layout serves the
 * whole dataset, so its objects are the dataset root.
 */
export function bucketDataPath(bucket: S3Bucket): string {
  const { path } = bucketToShareRow(bucket);
  return bucket.layout === S3BucketLayout.Dataset ? path : `${path}/s3data`;
}
