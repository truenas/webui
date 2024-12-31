import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const snapshotTaskListElements = {
  hierarchy: [T('Data Protection'), T('Periodic Snapshot Tasks')],
  anchorRouterLink: ['/data-protection', 'snapshot'],
  elements: {
    tasks: {
      anchor: 'snapshot-tasks',
      synonyms: [T('Data Protection'), T('Tasks')],
    },
    add: {
      hierarchy: [T('Add Snapshot Task')],
      anchor: 'add-snapshot-task',
      synonyms: [
        T('Add Periodic Snapshot Task'),
        T('Create Periodic Snapshot Task'),
        T('New Periodic Snapshot Task'),
        T('Create Snapshot Task'),
        T('New Snapshot Task'),
        T('Snapshot'),
        T('Task'),
      ],
    },
  },
} satisfies UiSearchableElement;
