import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const elements: Record<string, UiSearchableElement> = {
  addNtpServer: {
    hierarchy: [T('System Settings'), T('General'), T('NTP Server'), T('Add')],
    synonyms: [T('Add NTP Server')],
    triggerAnchor: 'add-ntp',
    anchorRouterLink: ['/system', 'general'],
  },
};
