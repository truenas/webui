import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const userListElements = {
  hierarchy: [T('Credentials'), T('Users')],
  anchorRouterLink: ['/credentials', 'users'],
  elements: {
    list: {
      anchor: 'users-list',
      synonyms: [
        T('Local Users'),
        T('Users'),
        T('User List'),
        T('User Management'),
        T('Admins'),
        T('Administrators'),
      ],
    },
    add: {
      hierarchy: [T('Add User')],
      synonyms: [T('New User'), T('Create User'), T('User'), T('Add Local User')],
      anchor: 'add-user',
    },
    showBuiltIn: {
      hierarchy: [T('Show Built-in Users')],
    },
  },
} satisfies UiSearchableElement;
