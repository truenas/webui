import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const allowedAddressesCardElements = {
  hierarchy: [T('System'), T('Advanced Settings')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    allowedIpAddresses: {
      hierarchy: [T('Allowed IP Addressed')],
      anchor: 'allowed-addresses-card',
    },
    configure: {
      anchor: 'allowed-addresses-settings',
      hierarchy: [T('Configure Allowed IP Addresses')],
      synonyms: [T('Allowed IP Addresses Settings')],
    },
  },
} satisfies UiSearchableElement;
