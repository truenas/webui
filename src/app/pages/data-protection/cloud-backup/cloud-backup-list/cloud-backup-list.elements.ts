import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const cloudBackupListElements = {
  hierarchy: [T('Data Protection'), T('TrueCloud Backup Tasks')],
  anchorRouterLink: ['/data-protection', 'cloud-backup'],
  elements: {
    tasks: {
      anchor: 'cloud-backup-tasks',
      synonyms: [T('Data Protection'), T('Tasks'), T('Cloud Backup')],
    },
    add: {
      hierarchy: [T('Add TrueCloud Backup Task')],
      anchor: 'add-cloud-backup',
      synonyms: [
        T('Add Cloud Backup'),
        T('Create TrueCloud Backup Task'),
        T('Create Cloud Backup'),
        T('New TrueCloud Backup Task'),
        T('New Cloud Backup'),
        T('Task'),
      ],
    },
  },
} satisfies UiSearchableElement;
