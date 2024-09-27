import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const apiKeysElements = {
  hierarchy: [T('API Keys')],
  anchorRouterLink: ['/apikeys'],
  elements: {
    apiKeys: {},
  },
} satisfies UiSearchableElement;
