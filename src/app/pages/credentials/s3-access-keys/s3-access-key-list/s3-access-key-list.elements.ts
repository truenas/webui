import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const s3AccessKeyListElements = {
  hierarchy: [T('Credentials'), T('S3 Access Keys')],
  anchorRouterLink: ['/credentials', 's3-access-keys'],
  elements: {
    accessKeys: {
      anchor: 's3-access-key-list',
      synonyms: [T('Access Keys'), T('S3 Credentials'), T('S3 Keys')],
    },
    createAccessKey: {
      hierarchy: [T('Add S3 Access Key')],
      synonyms: [
        T('Create S3 Access Key'),
        T('New S3 Access Key'),
      ],
    },
  },
} satisfies UiSearchableElement;
