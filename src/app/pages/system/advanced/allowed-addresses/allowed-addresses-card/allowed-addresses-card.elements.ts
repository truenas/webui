import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const allowedAddressesCardElements = {
  hierarchy: [T('System'), T('Advanced')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    allowedIpAddresses: {
      hierarchy: [T('Allowed IP Addressed')],
      anchor: 'allowed-addresses-card',
    },
  },
} satisfies UiSearchableElement;
