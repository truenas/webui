import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const allowedAddressesCardElements = {
  hierarchy: [T('System'), T('Advanced'), T('Allowed IP Addressed'), T('Configure')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    configureAllowedAddresses: {},
  },
} satisfies UiSearchableElement;
