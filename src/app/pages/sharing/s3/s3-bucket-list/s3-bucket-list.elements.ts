import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const s3BucketListElements = {
  hierarchy: [T('Shares'), T('S3')],
  anchorRouterLink: ['/sharing', 's3'],
  elements: {
    s3: {
      anchor: 's3-bucket-list',
      synonyms: [T('S3 Buckets'), T('Object Storage')],
    },
    createS3Bucket: {
      hierarchy: [T('Add S3 Bucket')],
      synonyms: [
        T('Create S3 Bucket'),
        T('New S3 Bucket'),
        T('Create Bucket'),
        T('Add Bucket'),
        T('New Bucket'),
      ],
    },
  },
} satisfies UiSearchableElement;
