import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const userApiKeysElements = {
  hierarchy: [T('Credentials'), T('Users')],
  anchorRouterLink: ['/credentials', 'users', 'api-keys'],
  elements: {
    list: {
      hierarchy: [T('API Keys')],
      synonyms: [
        T('User linked API Keys'),
      ],
    },
    add: {
      hierarchy: [T('Add API Key')],
      synonyms: [T('Add user linked API Key')],
    },
  },
} satisfies UiSearchableElement;
