import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const allUsersElements = {
  hierarchy: [T('Credentials')],
  anchorRouterLink: ['/credentials/users'],
  elements: {
    list: {
      hierarchy: [T('Users')],
      synonyms: [
        T('Local Users'),
        T('Users'),
        T('User List'),
        T('User Management'),
      ],
      anchor: 'users-list',
    },
  },
} satisfies UiSearchableElement;
