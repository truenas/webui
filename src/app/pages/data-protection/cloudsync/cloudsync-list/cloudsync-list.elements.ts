import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const cloudSyncListElements = {
  hierarchy: [T('Data Protection'), T('Cloud Sync Tasks')],
  anchorRouterLink: ['/data-protection', 'cloudsync'],
  elements: {
    tasks: {
      synonyms: [
        T('Data Protection'),
        T('Tasks'),
        T('Storj iX'),
        T('Amazon S3'),
        T('Backblaze B2'),
        T('Box'),
        T('Dropbox'),
        T('FTP'),
        T('Google Cloud Storage'),
        T('Google Drive'),
        T('Google Photos'),
        T('Hubic'),
        T('HTTP'),
        T('Mega'),
        T('Microsoft Azure'),
        T('OpenStack Swift'),
        T('pCloud'),
        T('SFTP'),
        T('Storj'),
        T('WebDAV'),
        T('Yandex'),
      ],
    },
    add: {
      hierarchy: [T('Add')],
      synonyms: [
        T('Add Cloud Sync Task'),
        T('Create Cloud Sync Task'),
        T('New Cloud Sync Task'),
        T('Task'),
      ],
    },
  },
} satisfies UiSearchableElement;
