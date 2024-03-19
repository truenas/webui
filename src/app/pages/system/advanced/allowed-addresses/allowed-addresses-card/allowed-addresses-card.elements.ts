import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const elements: Record<string, UiSearchableElement> = {
  configureAllowedAddresses: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Allowed IP Addressed'), T('Configure')],
    synonyms: [],
    triggerAnchor: 'allowed-addresses-settings',
    anchorRouterLink: ['/system', 'advanced'],
  },
};
