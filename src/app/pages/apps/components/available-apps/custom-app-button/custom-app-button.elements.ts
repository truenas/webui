import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { GlobalSearchVisibleToken } from 'app/modules/global-search/enums/global-search-visible-token.enum';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const customAppButtonElements = {
  hierarchy: [T('Applications'), T('Discover')],
  anchorRouterLink: ['/apps', 'available'],
  elements: {
    customApp: {
      hierarchy: [T('Custom App')],
      anchor: 'custom-app',
    },
  },
  visibleTokens: [GlobalSearchVisibleToken.Apps],
} satisfies UiSearchableElement;
