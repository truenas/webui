import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const userListElements = {
  hierarchy: [T('Credentials'), T('Users')],
  anchorRouterLink: ['/credentials', 'users'],
  elements: {
    list: {},
    add: {
      hierarchy: [T('Add')],
      anchor: 'add-user',
    },
  },
} satisfies UiSearchableElement;
