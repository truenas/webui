import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const privilegesListElements = {
  hierarchy: [T('Credentials'), T('Groups'), T('Privileges')],
  anchorRouterLink: ['/credentials', 'groups', 'privileges'],
  elements: {
    list: {
      anchor: 'privileges-list',
    },
    add: {
      hierarchy: [T('Add Privilege')],
      synonyms: [T('Add Privilege'), T('New Privilege'), T('Create Privilege'), T('Privilege')],
      anchor: 'add-privilege',
    },
  },
} satisfies UiSearchableElement;
