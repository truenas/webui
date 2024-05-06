import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const cloudBackupListElements = {
  hierarchy: [T('Data Protection'), T('TrueCloud Backup Tasks')],
  anchorRouterLink: ['/data-protection', 'cloud-backup'],
  elements: {
    tasks: {
      synonyms: [T('Data Protection'), T('Tasks'), T('Cloud Backup')],
    },
    add: {
      hierarchy: [T('Add')],
      synonyms: [T('Add TrueCloud Backup Task'), T('Add Cloud Backup')],
    },
  },
} satisfies UiSearchableElement;
