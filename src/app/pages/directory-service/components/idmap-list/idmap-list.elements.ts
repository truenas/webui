import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const idMapElements = {
  hierarchy: [T('Directory Services'), T('Idmap')],
  anchorRouterLink: ['/directoryservice', 'idmap'],
  elements: {
    idMap: {
      anchor: 'idmap',
    },
    add: {
      hierarchy: [T('Add Idmap')],
      anchor: 'add-idmap',
      synonyms: [
        T('Create Idmap'),
        T('New Idmap'),
        T('Idmap'),
      ],
    },
  },
} satisfies UiSearchableElement;
