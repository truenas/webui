import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const networkConfigurationCardElements = {
  hierarchy: [T('Network')],
  anchorRouterLink: ['/network'],
  elements: {
    nameservers: {
      hierarchy: [T('Nameservers')],
      synonyms: ['NS', 'DNS', T('Domain Name System')],
      anchor: 'nameservers',
    },
  },
} satisfies UiSearchableElement;
