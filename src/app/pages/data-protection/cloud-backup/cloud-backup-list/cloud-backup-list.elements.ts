import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const cloudBackupListElements = {
  hierarchy: [T('Data Protection'), T('TrueCloud Backup Tasks')],
  anchorRouterLink: ['/data-protection', 'cloud-backup'],
  elements: {
    tasks: {
      synonyms: [T('Tasks'), T('Cloud Backup')],
    },
  },
} satisfies UiSearchableElement;
