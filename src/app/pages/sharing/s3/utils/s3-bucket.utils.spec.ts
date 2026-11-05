import { S3BucketLayout } from 'app/enums/s3.enum';
import { S3Bucket } from 'app/interfaces/s3.interface';
import { bucketDataPath } from 'app/pages/sharing/s3/utils/s3-bucket.utils';

describe('bucketDataPath', () => {
  it('points at the s3data directory of a bucket that has its own dataset', () => {
    const bucket = { dataset: 'tank/buckets/photos', layout: S3BucketLayout.Bucket } as S3Bucket;

    expect(bucketDataPath(bucket)).toBe('/mnt/tank/buckets/photos/s3data');
  });

  it('points at the dataset root of a bucket that serves an existing dataset', () => {
    const bucket = { dataset: 'tank/shares/media', layout: S3BucketLayout.Dataset } as S3Bucket;

    expect(bucketDataPath(bucket)).toBe('/mnt/tank/shares/media');
  });
});
