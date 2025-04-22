import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { GlobalSearchVisibleToken } from 'app/modules/global-search/enums/global-search-visible-token.enum';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const failoverCardElements = {
  hierarchy: [T('System'), T('Advanced Settings'), T('Failover')],
  anchorRouterLink: ['/system', 'advanced'],
  synonyms: [
    T('HA'),
    T('High Availability'),
    T('Failover'),
  ],
  elements: {
    card: {
      anchor: 'failover-card',
    },
    settings: {
      hierarchy: [T('Failover Settings')],
      synonyms: [
        T('Sync To Peer'),
        T('Sync From Peer'),
      ],
    },
  },
  visibleTokens: [GlobalSearchVisibleToken.Failover],
} satisfies UiSearchableElement;
