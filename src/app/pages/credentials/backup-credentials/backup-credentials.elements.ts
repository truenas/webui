import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const backupCredentialsElements = {
  hierarchy: [T('Credentials'), T('Backup Credentials')],
  anchorRouterLink: ['/credentials', 'backup-credentials'],
  elements: {
    backupCredentials: {
      anchor: 'backup-credentials',
    },
  },
} satisfies UiSearchableElement;
