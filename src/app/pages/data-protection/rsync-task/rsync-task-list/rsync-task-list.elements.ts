import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const rsyncTaskListElements = {
  hierarchy: [T('Data Protection'), T('Rsync Tasks')],
  anchorRouterLink: ['/data-protection', 'rsync'],
  elements: {
    tasks: {
      anchor: 'rsync-tasks',
      synonyms: [T('Data Protection'), T('Tasks')],
    },
    add: {
      hierarchy: [T('Add Rsync Task')],
      synonyms: [
        T('Create Rsync Task'),
        T('New Rsync Task'),
        T('Task'),
      ],
      anchor: 'add-rsync',
    },
  },
} satisfies UiSearchableElement;
