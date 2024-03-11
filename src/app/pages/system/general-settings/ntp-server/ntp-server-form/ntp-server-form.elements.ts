import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const elements: Record<string, UiSearchableElement> = {
  address: {
    hierarchy: [T('System Settings'), T('General'), T('NTP Server'), T('Address')],
    synonyms: [T('NTP Server Address')],
    triggerAnchor: 'add-ntp-server',
    anchorRouterLink: ['/system', 'general'],
  },
};
