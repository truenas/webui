import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { GlobalSearchVisibleToken } from 'app/modules/global-search/enums/global-search-visible-token.enum';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const viewEnclosureElements = {
  hierarchy: [T('System'), T('View Enclosure')],
  anchorRouterLink: ['/system', 'oldviewenclosure'],
  elements: {
    oldViewEnclosure: {
      synonyms: [T('Enclosure')],
    },
  },
  visibleTokens: [GlobalSearchVisibleToken.Enclosure],
} satisfies UiSearchableElement;
