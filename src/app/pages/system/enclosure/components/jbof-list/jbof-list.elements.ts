import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { GlobalSearchVisibleToken } from 'app/modules/global-search/enums/global-search-visible-token.enum';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const jbofListElements = {
  hierarchy: [T('System'), T('View Enclosure'), T('NVMe-oF Expansion Shelves')],
  anchorRouterLink: ['/system', 'viewenclosure', 'jbof'],
  elements: {
    jbof: {
      anchor: 'jbof',
    },
  },
  visibleTokens: [GlobalSearchVisibleToken.Enclosure],
} satisfies UiSearchableElement;
