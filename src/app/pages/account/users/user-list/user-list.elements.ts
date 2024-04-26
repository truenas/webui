import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const userListElements = {
  hierarchy: [T('Credentials'), T('Users')],
  anchorRouterLink: ['/credentials', 'users'],
  elements: {
    list: {
      synonyms: [T('Local Users')],
    },
    add: {
      hierarchy: [T('Add')],
      anchor: 'add-user',
    },
    showBuiltIn: {
      hierarchy: [T('Show Built-in Users')],
    },
  },
} satisfies UiSearchableElement;
