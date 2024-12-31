import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { GlobalSearchVisibleToken } from 'app/modules/global-search/enums/global-search-visible-token.enum';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const failoverElements = {
  hierarchy: [T('System'), T('Failover')],
  anchorRouterLink: ['/system', 'failover'],
  elements: {
    failover: {
      anchor: 'failover',
    },
    syncToPeer: {
      hierarchy: [T('Sync To Peer')],
    },
    syncFromPeer: {
      hierarchy: [T('Sync From Peer')],
    },
  },
  visibleTokens: [GlobalSearchVisibleToken.Failover],
} satisfies UiSearchableElement;
