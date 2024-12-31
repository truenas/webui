import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { GlobalSearchVisibleToken } from 'app/modules/global-search/enums/global-search-visible-token.enum';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const installedAppsElements = {
  hierarchy: [T('Applications'), T('Installed')],
  anchorRouterLink: ['/apps', 'installed'],
  elements: {
    installed: {
      anchor: 'installed-apps-list',
      synonyms: [T('Apps'), T('Applications')],
    },
  },
  visibleTokens: [GlobalSearchVisibleToken.Apps],
} satisfies UiSearchableElement;
