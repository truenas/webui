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
