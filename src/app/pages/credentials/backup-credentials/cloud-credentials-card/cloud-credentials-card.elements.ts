import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const cloudCredentialsCardElements = {
  hierarchy: [T('Credentials'), T('Cloud Credentials')],
  anchorRouterLink: ['/credentials', 'backup-credentials'],
  elements: {
    cloudCredentials: {
      anchor: 'cloud-credentials',
    },
    add: {
      hierarchy: [T('Add Cloud Credential')],
      synonyms: [
        T('Add Credential'),
        T('Add Backup Credential'),
        T('New Credential'),
        T('New Cloud Credential'),
        T('New Backup Credential'),
        T('Create Credential'),
        T('Create Cloud Credential'),
        T('Create Backup Credential'),
        T('Credential'),
        T('Cloud Credential'),
        T('Backup Credential'),
      ],
      anchor: 'add-backup-credential',
    },
  },
} satisfies UiSearchableElement;
