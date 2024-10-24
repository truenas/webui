import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const userApiKeysElements = {
  hierarchy: [T('Credentials'), T('Users'), T('User API Keys')],
  anchorRouterLink: ['/credentials', 'user-api-keys'],
  elements: {
    list: {
      synonyms: [
        T('User linked API Keys'),
      ],
    },
    add: {
      synonyms: [T('Add user linked API Key'), T('Add API Key')],
    },
  },
} satisfies UiSearchableElement;
