import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const allUsersHeaderElements = {
  hierarchy: [T('Credentials'), T('Users (WIP)')],
  anchorRouterLink: ['/credentials/users-new'],
  elements: {
    add: {
      hierarchy: [T('Create New User')],
      synonyms: [T('Add User'), T('Create User'), T('New User')],
      anchor: 'add-user',
    },
  },
} satisfies UiSearchableElement;
