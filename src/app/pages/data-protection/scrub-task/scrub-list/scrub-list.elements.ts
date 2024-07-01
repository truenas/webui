import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const scrubListElements = {
  hierarchy: [T('Data Protection'), T('Scrub Tasks')],
  anchorRouterLink: ['/data-protection', 'scrub'],
  elements: {
    tasks: {
      synonyms: [T('Data Protection'), T('Tasks')],
    },
    add: {
      hierarchy: [T('Add')],
      synonyms: [
        T('Add Scrub Task'),
        T('Create Scrub Task'),
        T('New Scrub Task'),
        T('Task'),
      ],
      anchor: 'add-scrub',
    },
  },
} satisfies UiSearchableElement;
