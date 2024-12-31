import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const replicationListElements = {
  hierarchy: [T('Data Protection'), T('Replication Tasks')],
  anchorRouterLink: ['/data-protection', 'replication'],
  elements: {
    tasks: {
      anchor: 'replication-tasks',
      synonyms: [T('Data Protection'), T('Tasks')],
    },
    add: {
      hierarchy: [T('Add Replication Task')],
      synonyms: [
        T('Create Replication Task'),
        T('New Replication Task'),
        T('Task'),
      ],
      anchor: 'add-replication',
    },
  },
} satisfies UiSearchableElement;
