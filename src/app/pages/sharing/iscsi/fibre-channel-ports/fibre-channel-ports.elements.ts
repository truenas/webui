import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { GlobalSearchVisibleToken } from 'app/modules/global-search/enums/global-search-visible-token.enum';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const fibreChannelPortsElements = {
  hierarchy: [T('Shares'), T('iSCSI'), T('Fibre Channel Ports')],
  anchorRouterLink: ['/sharing', 'iscsi', 'fibre-channel-ports'],
  elements: {
    list: {
      anchor: 'fibre-channel-ports-list',
    },
  },
  visibleTokens: [GlobalSearchVisibleToken.FibreChannel],
} satisfies UiSearchableElement;
