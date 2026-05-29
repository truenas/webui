import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { GlobalSearchVisibleToken } from 'app/modules/global-search/enums/global-search-visible-token.enum';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const kmipElements = {
  hierarchy: [T('Credentials'), T('KMIP')],
  anchorRouterLink: ['/credentials', 'kmip'],
  visibleTokens: [GlobalSearchVisibleToken.Kmip],
  elements: {
    kmip: {
      anchor: 'kmip',
    },
  },
} satisfies UiSearchableElement;
